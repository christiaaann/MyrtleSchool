import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../../services/firebase";
import { useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";

const SignInForm = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);
      
      await updateDoc(doc(db, "users", userCredential.user.uid), {
    lastActive: serverTimestamp(),
  });
      if (docSnap.exists()) {
        const role = docSnap.data().role;
        setMessage("Login Successful!");
        setSuccess(true);

        setTimeout(() => {
          if (role === "admin") {
            navigate("/admin");
          } else {
            navigate("/Enrollment");
          }
        }, 1000);
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
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="px-5 py-2 border-2 rounded-lg outline-none"
          required
        />

        <button
          type="submit"
          disabled={loading}
          className={`py-2 rounded-lg font-semibold text-white transition-colors ${
            loading ? "bg-gray-400 cursor-not-allowed" : " bg-[#2D5B60]  hover:bg-green-950"
          }`}
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg
                className="animate-spin h-5 w-5 mr-2 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8H4z"
                ></path>
              </svg>
              Logging in...
            </span>
          ) : (
            "Login"
          )}
        </button>
      </form>
    </div>
  );
};

export default SignInForm;
