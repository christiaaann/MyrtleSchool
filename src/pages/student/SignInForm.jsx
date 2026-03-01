import React, { useState, useEffect } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../../services/firebase";
import { useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "../../context/AuthContext"; 

const SignInForm = () => {
  const navigate = useNavigate();
  const { user, role, loading: authLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // kapag may user redirect to enrollment
  useEffect(() => {
    if (!authLoading && user) {
      const userRole = role?.toLowerCase();
      if (userRole === "admin") {
        navigate("/admin", { replace: true });
      } else if (userRole === "user" || userRole === "parent") {
        navigate("/Enrollment", { replace: true });
      } else {
        console.log("Role undefined, contact admin");
      }
    }
  }, [user, role, authLoading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);

      await updateDoc(doc(db, "users", user.uid), {
        lastActive: serverTimestamp()
      });

      if (docSnap.exists()) {
        const userData = docSnap.data();
        const role = userData.role?.toLowerCase();
        setMessage("Login Successful!");
        setSuccess(true);

     
        if (role === "admin") {
          navigate("/admin", { replace: true });
        } else if (role === "user" || role === "parent") {
          navigate("/Enrollment", { replace: true });
        } else {
          setMessage("User role undefined. Contact admin.");
          setSuccess(false);
        }
      } else {
        setMessage("User data not found.");
        setSuccess(false);
      }
    } catch (error) {
      setMessage(error.message);
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    const interval = setInterval(async () => {
      if (auth.currentUser) {
        await updateDoc(doc(db, "users", auth.currentUser.uid), {
          lastActive: serverTimestamp(),
        });
      }
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full flex flex-col items-center justify-center mt-20">
      {message && (
        <div
          className={`px-4 py-1 rounded-md text-white text-center w-80 mb-4 ${
            success ? "bg-green-500" : "bg-red-500"
          }`}
        >
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-80">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@gmail.com"
          className="px-5 py-2 border-2 rounded-lg outline-none"
          required
          disabled={authLoading} // 🔹 disable if checking auth
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="px-5 py-2 border-2 rounded-lg outline-none"
          required
          disabled={authLoading}
        />

        <button
          type="submit"
          disabled={loading || authLoading}
          className={`py-2 rounded-lg font-semibold text-white transition-colors ${
            loading || authLoading ? "bg-gray-400 cursor-not-allowed" : " bg-[#2D5B60]  hover:bg-green-950"
          }`}
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
};

export default SignInForm;