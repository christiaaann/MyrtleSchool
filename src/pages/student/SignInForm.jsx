import React, { useState, useEffect } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../../services/firebase";
import { useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";
import { sileo } from "sileo";

const SignInForm = () => {
  const navigate = useNavigate();
  const { user, role, loading: authLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // redirect kapag logged in na
  useEffect(() => {
    if (!authLoading && user) {
      const userRole = role?.toLowerCase();
      if (userRole === "admin") {
        navigate("/admin", { replace: true });
      } else if (userRole === "user" || userRole === "parent") {
        navigate("/Enrollment", { replace: true });
      }
    }
  }, [user, role, authLoading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ===== VALIDATION =====
    if (!email.trim()) {
      sileo.error({ title: "Validation Error", description: "Email is required" });
      return;
    }

    if (email.length < 3) {
      sileo.error({ title: "Validation Error", description: "Email must be at least 3 characters" });
      return;
    }

    if (!/^[a-zA-Z0-9._]+$/.test(email)) {
      sileo.error({ title: "Validation Error", description: "Email contains invalid characters" });
      return;
    }

    if (!password.trim()) {
      sileo.error({ title: "Validation Error", description: "Password is required" });
      return;
    }

    if (password.length < 6) {
      sileo.error({ title: "Validation Error", description: "Password must be at least 6 characters" });
      return;
    }

    setLoading(true);

    try {
      const fullEmail = `${email.toLowerCase()}@gmail.com`;

      const userCredential = await sileo.promise(
        signInWithEmailAndPassword(auth, fullEmail, password),
        {
          loading: { title: "Logging in...", description: "Please wait while we verify your account." },
          success: { title: "Login Successful", description: "Redirecting to your dashboard..." },
          error: { title: "Login Failed", description: "Check your email or password." }
        }
      );

      const firebaseUser = userCredential.user;

      const docRef = doc(db, "users", firebaseUser.uid);
      const docSnap = await getDoc(docRef);

      await updateDoc(docRef, { lastActive: serverTimestamp() });

      if (docSnap.exists()) {
        const userData = docSnap.data();
        const role = userData.role?.toLowerCase();

        if (role === "admin") {
          navigate("/admin", { replace: true });
        } else if (role === "user" || role === "parent") {
          navigate("/Enrollment", { replace: true });
        } else {
          sileo.error({ title: "Login Error", description: "User role undefined" });
        }
      } else {
        sileo.error({ title: "Login Error", description: "User data not found" });
      }
    } catch (error) {
      console.log(error);
      // Friendly Firebase error handling
      let description = "Something went wrong. Please try again.";

      if (error.code === "auth/user-not-found") description = "No account found with this email.";
      if (error.code === "auth/wrong-password") description = "Incorrect password.";
      if (error.code === "auth/invalid-email") description = "Invalid email format.";
      if (error.code === "auth/too-many-requests") description = "Too many attempts. Try again later.";

      sileo.error({ title: "Login Failed", description });
    } finally {
      setLoading(false);
    }
  };

  // update last active every 10 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      if (auth.currentUser) {
        await updateDoc(doc(db, "users", auth.currentUser.uid), { lastActive: serverTimestamp() });
      }
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full flex flex-col items-center justify-center mt-20">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-96">

        {/* EMAIL */}
        <div className="flex px-5 w-full justify-between border-2 py-4 rounded-2xl overflow-hidden">
          <input
            className="outline-none w-full"
            type="text"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value.replace("@", "").replace(/\s/g, ""))}
            disabled={authLoading}
          />
          <span className="text-neutral-500">@gmail.com</span>
        </div>

        {/* PASSWORD */}
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="px-5 py-4 border-2 rounded-2xl outline-none"
          disabled={authLoading}
        />

        {/* LOGIN BUTTON */}
        <button
          type="submit"
          disabled={loading || authLoading}
          className={`py-3 rounded-full font-semibold text-white transition-colors ${
            loading || authLoading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-[#2D5B60] hover:bg-green-950"
          }`}
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
};

export default SignInForm;