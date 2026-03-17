import React, { useState, useRef, useEffect } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../../services/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate, Link } from "react-router-dom";
import FloatingInput from "../../components/FloatingInput";
import { sileo } from "sileo";
import { Eye, EyeClosed } from "lucide-react";
const SignUpForm = () => {
  const navigate = useNavigate();

  const [firstname, setFirstname] = useState("");
  const [middlename, setMiddlename] = useState("");
  const [lastname, setLastname] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword ] = useState("")
  const [errors, setErrors] = useState({});
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

  // Validation function
  const validate = () => {
    const newErrors = {};
    if (!firstname.trim()) newErrors.firstname = "First name is required.";
    // if (!middlename.trim()) newErrors.middlename = "Middle name is required"
    if (!lastname.trim()) newErrors.lastname = "Last name is required.";

    if (!email.trim()) newErrors.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      newErrors.email = "Invalid email format.";

    if (!password) newErrors.password = "Password is required.";
    else if (password.length < 6)
      newErrors.password = "Password must be at least 6 characters.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return; // stop submission if invalid

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        email,
        role: "parent",
        createdAt: serverTimestamp(),
        parent: { firstname, middlename, lastname },
        spouse: { firstname: "", middlename: "", lastname: "", occupation: "", contact: "" },
        address: { province: "", city: "", barangay: "", purok: "" },
        profilePicture: "",
      });

      sileo.success({
        title: "Account Created",
        fill: "black"
      });
      navigate("/completeprofile");
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  };

  // Live validation for email
  const handleEmailChange = (e) => {
    setEmail(e.target.value);

    // Remove error if valid
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.target.value)) {
      setErrors((prev) => ({ ...prev, email: undefined }));
    } else {
      setErrors((prev) => ({ ...prev, email: "Invalid email format." }));
    }
  };

  return (
    <div className="max-w-2xl flex mx-auto p-6">
      <form onSubmit={handleSubmit} className="flex w-full flex-col overflow-hidden gap-4">
        <Link to="/Auth">Back</Link>
        <h2 className="text-3xl text-neutral-700 leading-10">Create Account</h2>
        <p className="text-neutral-500 text-xl">
          Create an account to access your child’s school information, enrollment, and important updates.
        </p>

        <h1 className="font-semibold">Name</h1>
        <div className="flex flex-col tablet:flex-row gap-4">
          <div className="flex w-full flex-col">
            <FloatingInput
              id="firstname"
              label="First name"
              value={firstname}
              onChange={  (e) => setFirstname(e.target.value)}
            />
            {errors.firstname && (
              <p className="text-red-500 text-sm mt-1">{errors.firstname}</p>
            )}
          </div>

          <div className="flex w-full flex-col">
            <FloatingInput
              id="middlename"
              type="text"
              label="Middle name"
              value={middlename}
              onChange={(e) => setMiddlename(e.target.value)}
            />
            {/* {errors.middlename && (
              <p className="text-red-500 text-sm">{errors.middlename}</p>
            )} */}
          </div>

          <div className="flex w-full flex-col">
            <FloatingInput
              id="lastname"
              type="text"
              label="Last name"
              value={lastname}
              onChange={(e) => setLastname(e.target.value)}
            />
            {errors.lastname && (
              <p className="text-red-500 text-sm mt-1">{errors.lastname}</p>
            )}
          </div>
        </div>

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
              Please enter a valid email address. This email will be used for login.
            </div>
          )}
        </div>
        <div className="flex w-full flex-col">
          <FloatingInput
            id="email"
            label="Email"
            type="email"
            value={email}
            onChange={handleEmailChange}
          />
          {errors.email && (
            <p className="text-red-500 text-sm mt-1">{errors.email}</p>
          )}
        </div>

        <h1 className="font-semibold">Password</h1>
        <div className="flex flex-col relative w-full">
          <FloatingInput
            id="password"
            type={showPassword ? "text" : "password" }
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {errors.password && (
            <p className="text-red-500 text-sm mt-1">{errors.password}</p>
          )}
          <button
          className="absolute right-3 gap-2 top-[1.5rem] -translate-y-1/2"
          type="button"
          onClick={() =>setShowPassword(!showPassword)}
          >
            {showPassword ? <Eye/> : <EyeClosed/>}
          </button>
        </div>

        <button type="submit" className="bg-[#2D5B60] text-white py-3 rounded-full">
          Create Account
        </button>
      </form>
    </div>
  );
};

export default SignUpForm;