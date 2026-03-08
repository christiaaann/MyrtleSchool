import React, { useState } from "react";
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
        <p className=" text-neutral-500 text-xl">Create an account to access your child’s school information, enrollment, and important announcements.</p>
       
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
        <FloatingInput
          id="email"
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

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