const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getAuth } = require("firebase-admin/auth");

initializeApp();
const db = getFirestore();

exports.assignStaffRole = onCall(async (request) => {
  // 1. Verify the caller is authenticated
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "You must be signed in.");
  }

  // 2. Verify the caller is a superadmin
  const callerDoc = await db.collection("users").doc(request.auth.uid).get();
  if (!callerDoc.exists || callerDoc.data().role !== "superadmin") {
    throw new HttpsError("permission-denied", "Only superadmins can assign roles.");
  }

  const { targetEmail, role, branch } = request.data;

  // 3. Validate inputs
  const validRoles = ["registrar", "admin", "superadmin", "parent"];
  if (!validRoles.includes(role)) {
    throw new HttpsError("invalid-argument", "Invalid role specified.");
  }
  if (!targetEmail || typeof targetEmail !== "string") {
    throw new HttpsError("invalid-argument", "A valid email is required.");
  }

  const finalBranch = role === "superadmin" ? "All" : (branch || "");

  // 4. Check if user already exists
  const snap = await db.collection("users")
    .where("email", "==", targetEmail.toLowerCase())
    .get();

  if (!snap.empty) {
    // Upgrade existing user
    await snap.docs[0].ref.update({ role, branch: finalBranch });
    return { status: "upgraded", message: `${targetEmail} upgraded to ${role}.` };
  } else {
    // Create pending invite
    await db.collection("pre_approved_staff")
      .doc(targetEmail.toLowerCase())
      .set({ email: targetEmail.toLowerCase(), role, branch: finalBranch,
             invitedAt: new Date() });
    return { status: "invited", message: `Invite created for ${targetEmail}.` };
  }
});

exports.revokeStaffRole = onCall(async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Sign in required.");

  const callerDoc = await db.collection("users").doc(request.auth.uid).get();
  if (!callerDoc.exists || callerDoc.data().role !== "superadmin") {
    throw new HttpsError("permission-denied", "Superadmin only.");
  }

  const { targetUserId } = request.data;
  await db.collection("users").doc(targetUserId).update({
    role: "parent",
    branch: ""
  });

  return { status: "revoked" };
});

exports.claimInviteOnSignIn = onCall(async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Sign in required.");

  const uid = request.auth.uid;
  const email = request.auth.token.email?.toLowerCase();
  if (!email) throw new HttpsError("invalid-argument", "No email on token.");

  const userRef = db.collection("users").doc(uid);
  const userSnap = await userRef.get();

  // If user doc already exists, nothing to claim
  if (userSnap.exists) {
    await userRef.update({ lastActive: new Date() });
    return { status: "existing" };
  }

  // Check for pending invite
  let assignedRole = "parent";
  let assignedBranch = "";

  const inviteRef = db.collection("pre_approved_staff").doc(email);
  const inviteSnap = await inviteRef.get();

  if (inviteSnap.exists) {
    assignedRole = inviteSnap.data().role;
    assignedBranch = inviteSnap.data().branch;
    await inviteRef.delete();  // consume the invite
  }

  // Create the user document
  const displayName = request.auth.token.name || "";
  await userRef.set({
    email,
    role: assignedRole,
    branch: assignedBranch,
    profilePicture: request.auth.token.picture || "",
    isActive: true,
    isOnline: true,
    createdAt: new Date(),
    parent: {
      firstname: displayName.split(" ")[0] || "",
      middlename: "",
      lastname: displayName.split(" ").slice(1).join(" ") || "",
      occupation: "",
      contact: ""
    },
    spouse: { firstname: "", middlename: "", lastname: "", occupation: "", contact: "" },
    address: { barangay: "", city: "", province: "", purok: "", fullAddress: "" },
    isProfileComplete: false
  });

  return { status: "created", role: assignedRole };
});