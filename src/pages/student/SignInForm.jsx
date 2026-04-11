import React, { useState, useEffect } from "react";
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth, db } from "../../services/firebase";
import { useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc, serverTimestamp, setDoc, deleteDoc } from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";
import { sileo } from "sileo";
import { Eye, EyeClosed } from "lucide-react";
import { Link } from "react-router-dom";

const SignInForm = () => {
  const navigate = useNavigate();
  const { user, role, loading: authLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lockUntil, setLockUntil] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      const userRole = role?.toLowerCase();
      if (userRole === "admin") navigate("/admin", { replace: true });
      else if (userRole === "user" || userRole === "parent")
        navigate("/Enrollment", { replace: true, state: { loginSuccess: true } });
    }
  }, [user, role, authLoading, navigate]);

  // ===== GOOGLE SIGN IN (ADMIN ACTIVATION FLOW) =====
  const handleGoogleSignIn = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    
    try {
      const result = await signInWithPopup(auth, provider);
      const googleUser = result.user;
      const userEmail = googleUser.email.toLowerCase();

      // 1. Check if this email is on the VIP Admin Invite List (Using email as ID)
      const invitedAdminRef = doc(db, "users", userEmail);
      const invitedAdminSnap = await getDoc(invitedAdminRef);

      if (invitedAdminSnap.exists() && invitedAdminSnap.data().role === "admin") {
        // ACTIVATE THE ADMIN: Move data to their actual UID document
        await setDoc(doc(db, "users", googleUser.uid), {
          email: userEmail,
          name: googleUser.displayName,
          profilePicture: googleUser.photoURL,
          role: "admin",
          status: "Active",
          lastActive: serverTimestamp()
        });
        
        await deleteDoc(invitedAdminRef); // Clean up the temp invite
        navigate("/admin", { replace: true });
        return;
      }

      // 2. Check if they are already an active user/admin (Using UID)
      const existingUserRef = doc(db, "users", googleUser.uid);
      const existingUserSnap = await getDoc(existingUserRef);

      if (existingUserSnap.exists()) {
        await updateDoc(existingUserRef, { lastActive: serverTimestamp() });
        const existingRole = existingUserSnap.data().role?.toLowerCase();
        
        if (existingRole === "admin") navigate("/admin", { replace: true });
        else navigate("/Enrollment", { replace: true, state: { loginSuccess: true } });
        return;
      }

      // 3. Brand new standard Parent User
      await setDoc(existingUserRef, {
        email: userEmail,
        name: googleUser.displayName,
        profilePicture: googleUser.photoURL,
        role: "parent",
        isProfileComplete: false,
        createdAt: serverTimestamp()
      });
      navigate("/Enrollment", { replace: true, state: { loginSuccess: true } });

    } catch (error) {
      console.error("Google Sign-In Error:", error);
      sileo.error({ title: "Google Login Failed", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  // ===== STANDARD EMAIL/PASSWORD LOGIN =====
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (lockUntil && Date.now() < lockUntil) {
      const seconds = Math.ceil((lockUntil - Date.now()) / 1000);
      sileo.error({
        title: "Too many login attempts",
        fill: "black",
        styles: { description: "text-white" },
      });
      return;
    }

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !password.trim() || password.length < 6) {
      sileo.error({ title: "Invalid Credentials", fill: "black", styles: { description: "text-white" }});
      return;
    }

    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.toLowerCase(), password);
      setAttempts(0);
      const firebaseUser = userCredential.user;
      const docRef = doc(db, "users", firebaseUser.uid);
      const docSnap = await getDoc(docRef);

      await updateDoc(docRef, { lastActive: serverTimestamp() });

      if (!docSnap.exists()) {
        sileo.error({ title: "Login Error", description: "User data not found" });
        return;
      }

      const role = docSnap.data().role?.toLowerCase();
      if (role === "admin") navigate("/admin", { replace: true });
      else if (role === "user" || role === "parent" || role === "mother" || role === "father" || role === "guardian")
        navigate("/Enrollment", { replace: true, state: { loginSuccess: true } });
      else sileo.error({ title: "Login Error", description: "User role undefined" });

    } catch (error) {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);

      if (newAttempts >= 5) {
        setLockUntil(Date.now() + 60000);
        sileo.error({ title: "Too many login attempts", fill: "black", description: "Locked for 60 seconds." });
      } else {
        sileo.error({ title: "Login Failed", fill: "black", description: "Invalid email or password." });
      }
    } finally {
      setLoading(false);
    }
  };

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
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full phone:w-96 mb-6">
        <div className="px-5 w-full border-2 py-3 rounded-2xl">
          <input
            className="outline-none w-full"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)} 
            disabled={authLoading || loading}
          />
        </div>
        
        <div className="flex gap-2 items-center justify-center px-5 py-3 border-2 rounded-2xl">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="outline-none w-full"
            disabled={authLoading || loading}
          />
          <button className="outline-none" type="button" onClick={() => setShowPassword(!showPassword)}>
            {showPassword ? <Eye className="text-black"/> : <EyeClosed className="text-black"/>}
          </button>
        </div>
        
        <Link to="/forgotpassword" className="text-neutral-600 text-center leading-4 text-sm hover:underline">Forgot Password?</Link>
        
        <button
          type="submit"
          disabled={loading || authLoading}
          className={`py-3 rounded-full font-semibold text-white transition-colors mt-2 ${
            loading || authLoading ? "bg-gray-400 cursor-not-allowed" : "bg-[#2D5B60] hover:bg-green-950"
          }`}
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>

      {/* GOOGLE SIGN IN BUTTON */}
      <div className="w-full phone:w-96 flex flex-col items-center">
        <div className="flex items-center w-full mb-6">
           <div className="flex-1 h-px bg-gray-200"></div>
           <span className="px-4 text-xs text-gray-400 font-bold uppercase">OR</span>
           <div className="flex-1 h-px bg-gray-200"></div>
        </div>

        <button 
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading || authLoading}
          className="w-full flex items-center justify-center gap-3 py-3 rounded-full border-2 border-gray-200 font-bold text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
          Continue with Google
        </button>
      </div>
    </div>
  );
};

export default SignInForm;