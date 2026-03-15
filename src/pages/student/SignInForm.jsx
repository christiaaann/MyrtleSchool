import React, { useState, useEffect } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../../services/firebase";
import { useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";
import { sileo } from "sileo";
import { Eye,
       EyeClosed, 
       } from "lucide-react";

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (lockUntil && Date.now() < lockUntil) {
      const seconds = Math.ceil((lockUntil - Date.now()) / 1000);
      sileo.error({
        title: "Too many login attempts",
        fill: "black",
        description: `Please wait ${seconds} seconds before trying again.`,
        styles: { description: "text-white" },
      });
      return;
    }

    // ===== VALIDATION =====
    if (!email.trim()) {
      sileo.error({ title: "Email is required", fill: "black" });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      sileo.error({
        title: "Invalid Email",
        fill: "black",
        description: "Please enter a valid email address",
        styles: { description: "text-white" },
      });
      return;
    }
    if (!password.trim()) {
      sileo.error({ title: "Password is required", fill: "black" });
      return;
    }
    if (password.length < 6) {
      sileo.error({
        title: "Validation Error",
        fill: "black",
        description: "Password must be at least 6 characters",
        styles: { description: "text-white" },
      });
      return;
    }

    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email.toLowerCase(),
        password
      );

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
      else if (role === "user" || role === "parent")
        navigate("/Enrollment", { replace: true, state: { loginSuccess: true } });
      else sileo.error({ title: "Login Error", description: "User role undefined" });

    } catch (error) {
      console.log(error);
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);

      let description = "Something went wrong. Please try again.";
      if (error.code === "auth/user-not-found") description = "No account found with this email.";
      if (error.code === "auth/wrong-password") description = "Incorrect password.";
      if (error.code === "auth/invalid-email") description = "Invalid email format.";
      if (error.code === "auth/too-many-requests") description = "Too many attempts. Try again later.";

      if (newAttempts >= 5) {
        const timeout = Date.now() + 60000;
        setLockUntil(timeout);
        sileo.error({
          title: "Too many login attempts",
          fill: "black",
          description: "Login locked for 30 seconds.",
          styles: { description: "text-white" },
        });
      } else {
        sileo.error({
          title: "Login Failed",
          description: `${description} Attempts left: ${5 - newAttempts}`,
        });
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
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full phone:w-96">
        <div className="px-5 w-full border-2 py-3 rounded-2xl">
          <input
            className="outline-none w-full"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)} 
            disabled={authLoading}
          />
        </div>
        
        <div  className=" flex gap-2 items-center justify-center px-5 py-3 border-2 rounded-2xl">
        <input
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
         className="outline-none w-full"
          disabled={authLoading}
        />
        <button
        className="outline-none" 
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        >
          {showPassword ? <Eye className="text-black"/> :<EyeClosed className="text-black"/>}
        </button>
        </div>

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