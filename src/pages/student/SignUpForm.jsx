import React, { useState, useRef, useEffect } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../../services/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate , Link } from "react-router-dom";
import FloatingInput from "../../components/FloatingInput";

const SignUpForm = () => {
  const navigate = useNavigate();

  const [firstname, setFirstname] = useState("");
  const [middlename, setMiddlename] = useState("");
  const [lastname, setLastname] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showEmailHelp, setShowEmailHelp] = useState(false);
  
  const helpRef = useRef(null);
  useEffect(() => {
  const handleClickOutside = (event) => {
    if (helpRef.current && !helpRef.current.contains(event.target)) {
      setShowEmailHelp(false);
    }
  };

  document.addEventListener("mousedown", handleClickOutside);

  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        email,
        role: "parent",
        createdAt: serverTimestamp(),

        parent: {
          firstname,
          middlename,
          lastname,
        },

        spouse: {
          firstname: "",
          middlename: "",
          lastname: "",
          occupation: "",
          contact: "",
        },

        address: {
          province: "",
          city: "",
          barangay: "",
          purok: "",
        },

        profilePicture: "",
      });

      alert("Account created!");
      navigate("/completeprofile");

    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  };

  return (
    <div className=" max-w-2xl flex mx-auto p-6">
      <form onSubmit={handleSubmit} className="flex w-full flex-col gap-4">
         <Link className="" to="/Auth">Back</Link>
        <h2 className="text-3xl text-neutral-700 leading-10">Create Account</h2>
        <p className=" text-neutral-500 text-xl">Create an account to access your child’s school information, enrollment, and important updates.</p>
        <h1 className="font-semibold">Name</h1>
        <div className=" flex gap-4">
        <div className=" flex w-full">
        <FloatingInput
          id="firstname"
          label="First name"
          value={firstname}
          onChange={(e) => setFirstname(e.target.value)}
          required
        />
        </div>
        <FloatingInput
          id="middlename"
          type="text"
          label="Middle name"
          value={middlename}
          onChange={(e) => setMiddlename(e.target.value)}
        />

        <FloatingInput
          id="lastname"
          type="text"
          label="Last name"
          value={lastname}
          onChange={(e) => setLastname(e.target.value)}
          required
        />
       </div>
      <div className="flex items-center gap-2">
      <div className="flex items-center gap-2 relative" ref={helpRef}>
      <h1 className="font-semibold">Email</h1>
      <button
      type="button"
      onClick={() => setShowEmailHelp(!showEmailHelp)}
      className="border-2 border-black w-6 h-6 font-semibold text-black text-[12px] rounded-full flex items-center justify-center"
      >
      ?
      </button>

      {showEmailHelp && (
      <div className="absolute left-20 top-0 z-10 font-semibold bg-white border shadow-lg rounded-lg p-3 w-64 text-sm text-black">
      Please enter a valid email address. This email will be used for
      login.
      </div>
      )}
      </div>
        </div>   
        <FloatingInput
          id="email"
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <h1 className="font-semibold">Password</h1>
        <FloatingInput
          id="password"
          type="password"
          label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button
          type="submit"
          className="bg-[#2D5B60] text-white py-3 rounded-full"
        >
          Create Account
        </button>

      </form>
    </div>
  );
};

export default SignUpForm;