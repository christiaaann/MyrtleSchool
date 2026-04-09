import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "./firebase"; // Adjust path if needed

/**
 * Logs an administrative action to the database.
 * @param {string} actionType - E.g., "PAYMENT_APPROVED", "USER_ADDED", "ENROLLMENT_REJECTED"
 * @param {string} description - Detailed description of what happened.
 * @param {string} targetId - (Optional) The ID of the student or entity affected.
 */
export const logAdminAction = async (actionType, description, targetId = null) => {
  try {
    const user = auth.currentUser;
    if (!user) return; // Only log if logged in

    await addDoc(collection(db, "system_logs"), {
      adminUid: user.uid,
      adminEmail: user.email,
      adminName: user.displayName || "Admin",
      actionType,
      description,
      targetId,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.error("Failed to log action:", error);
  }
};