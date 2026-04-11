import React, { useState, useEffect } from "react";
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth, db } from "../../services/firebase";
import { useNavigate, Link } from "react-router-dom";
// FIX: Added deleteDoc to clean up pending invites
import { doc, getDoc, updateDoc, serverTimestamp, setDoc, deleteDoc } from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";
import { sileo } from "sileo";
import { Eye, EyeClosed } from "lucide-react";

const SignInForm = () => {
  const navigate = useNavigate();
  const { user, role, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // --- SINGLE SOURCE OF TRUTH FOR ROUTING ---
  useEffect(() => {
    if (!authLoading && user && role) {
      const userRole = role.toLowerCase();
      if (userRole === "admin" || userRole === "superadmin" || userRole === "registrar") {
        navigate("/admin/dashboard", { replace: true });
      } else {
        // Parents go to Enrollment. Enrollment will automatically bounce them to CompleteProfile if needed.
        navigate("/Enrollment", { replace: true });
      }
    }
  }, [user, role, authLoading, navigate]);

  // Replace the entire handleGoogleSignIn function with this:
const handleGoogleSignIn = async () => {
  setLoading(true);
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });

  try {
    await signInWithPopup(auth, provider);

    // Let the Cloud Function handle user creation and invite claiming
    const functions = getFunctions();
    const claimInvite = httpsCallable(functions, "claimInviteOnSignIn");
    await claimInvite();

    // AuthContext's onSnapshot will pick up the new/updated role automatically
  } catch (error) {
    console.error("Google Sign-In Error:", error);
    sileo.error({ title: "Sign-in failed", description: error.message, fill: "black" });
  } finally {
    setLoading(false);
  }
};

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return sileo.error({ title: "Invalid Credentials", fill: "black" });
    
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.toLowerCase(), password);
      await updateDoc(doc(db, "users", userCredential.user.uid), { lastActive: serverTimestamp() });
    } catch (error) {
      sileo.error({ title: "Login Failed", description: "Invalid email or password.", fill: "black" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col items-center justify-center">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full phone:w-96 mb-6">
        <div className="px-5 w-full border-2 py-3 rounded-2xl">
          <input className="outline-none w-full" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={authLoading || loading} />
        </div>
        
        <div className="flex gap-2 items-center justify-center px-5 py-3 border-2 rounded-2xl">
          <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="outline-none w-full" disabled={authLoading || loading} />
          <button className="outline-none" type="button" onClick={() => setShowPassword(!showPassword)}>
            {showPassword ? <Eye className="text-black"/> : <EyeClosed className="text-black"/>}
          </button>
        </div>
        
        <Link to="/forgotpassword" className="text-neutral-600 text-center leading-4 text-sm hover:underline">Forgot Password?</Link>
        
        <button type="submit" disabled={loading || authLoading} className={`py-3 rounded-full font-semibold text-white transition-colors mt-2 ${loading || authLoading ? "bg-gray-400 cursor-not-allowed" : "bg-[#2D5B60] hover:bg-green-950"}`}>
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>

      <div className="w-full phone:w-96 flex flex-col items-center">
        <div className="flex items-center w-full mb-6">
           <div className="flex-1 h-px bg-gray-200"></div>
           <span className="px-4 text-xs text-gray-400 font-bold uppercase">OR</span>
           <div className="flex-1 h-px bg-gray-200"></div>
        </div>

        <button type="button" onClick={handleGoogleSignIn} disabled={loading || authLoading} className="w-full flex items-center justify-center gap-3 py-3 rounded-full border-2 border-gray-200 font-bold text-gray-700 hover:bg-gray-50 transition-colors">
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
          Continue with Google
        </button>

        <h1 className="text-neutral-500 flex gap-1 mt-4">
          Don't have an account? <Link className="text-[#2D5B60] font-bold hover:underline" to="/signup">Signup</Link>
        </h1>
      </div>
    </div>
  );
};

export default SignInForm;