import React, { useState, useEffect } from 'react';
import SignInForm from './SignInForm';
import SignUpForm from './SignUpForm';
import logo from '../../assets/logo.png';
import video from '../../assets/video.mp4';
import DepED from '../../assets/DepEDLogo.png';
import facebook from '../../assets/icons/facebook.png';
import { useNavigate } from 'react-router-dom';
import { 
  getAuth, 
  signInWithPopup, 
  FacebookAuthProvider, 
  GoogleAuthProvider,
  onAuthStateChanged 
} from "firebase/auth";
import { auth, db } from '../../services/firebase'; 
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

const Auth = () => {
  const [mode, setMode] = useState("login");
  const [formData, setFormData] = useState({ name: "", email: "" });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const isProfileComplete = (userDoc) => {
    const parent = userDoc.parent;
    const spouse = userDoc.spouse;
    const address = userDoc.address;
    return (
      parent?.firstname && parent?.lastname &&
      spouse?.firstname && spouse?.lastname &&
      address?.barangay && address?.city && address?.province
    );
  };

  const handleNavigation = (userData) => {
    const role = (userData.role || "parent").toLowerCase();
    if (role === "admin") {
      navigate("/admin/dashboard", { replace: true });
    } else {
      if (!isProfileComplete(userData)) {
        navigate("/completeprofile", { replace: true });
      } else {
        navigate("/Enrollment", { replace: true });
      }
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDocRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(userDocRef);

          if (docSnap.exists()) {
            handleNavigation(docSnap.data());
          } else {
            // New user → create doc first
            const fullName = user.displayName || "";
            const nameParts = fullName.split(" ");
            const firstName = nameParts[0] || "";
            const middleName = nameParts.length === 3 ? nameParts[1] : "";
            const lastName = nameParts.length === 3 ? nameParts[2] : nameParts.slice(1).join(" ");

            const newUserData = {
              email: user.email || "",
              role: "parent",
              profilePicture: user.photoURL || "",
              isActive: true,
              isOnline: true,
              createdAt: serverTimestamp(),
              parent: { firstname: firstName, middlename: middleName, lastname: lastName, occupation: "", contact: "" },
              spouse: { firstname: "", middlename: "", lastname: "", occupation: "", contact: "" },
              address: { barangay: "", city: "", province: "", purok: "", fullAddress: "" },
            };

            await setDoc(userDocRef, newUserData);
            navigate("/completeprofile", { replace: true });
          }
        } catch (err) {
          console.error("Auth state error:", err);
          setLoading(false);
        }
      } else {
        setLoading(false); // show Auth page
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleOAuthLogin = async (provider) => {
    try {
      // Force Google to always show account chooser
      if (provider instanceof GoogleAuthProvider) {
        provider.setCustomParameters({ prompt: "select_account" });
      }

      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const userDocRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(userDocRef);

      if (docSnap.exists()) {
        handleNavigation(docSnap.data());
      } else {
        const fullName = user.displayName || "";
        const nameParts = fullName.split(" ");
        const firstName = nameParts[0] || "";
        const middleName = nameParts.length === 3 ? nameParts[1] : "";
        const lastName = nameParts.length === 3 ? nameParts[2] : nameParts.slice(1).join(" ");

        const newUserData = {
          email: user.email || "",
          role: "parent",
          profilePicture: user.photoURL || "",
          isActive: true,
          isOnline: true,
          createdAt: serverTimestamp(),
          parent: { firstname: firstName, middlename: middleName, lastname: lastName, occupation: "", contact: "" },
          spouse: { firstname: "", middlename: "", lastname: "", occupation: "", contact: "" },
          address: { barangay: "", city: "", province: "", purok: "", fullAddress: "" },
        };

        await setDoc(userDocRef, newUserData);
        navigate("/completeprofile", { replace: true });
      }
    } catch (error) {
      console.error("OAuth login error:", error);
      alert(error.message);
    }
  };

  const handleFacebookLogin = () => handleOAuthLogin(new FacebookAuthProvider());
  const handleGoogleLogin = () => handleOAuthLogin(new GoogleAuthProvider());

  if (loading) {
    return (
      <div className="h-screen flex justify-center items-center">
        <h1 className="text-xl font-semibold text-[#2D5B60]">Loading...</h1>
      </div>
    );
  }

  return (
    <div className="h-screen flex">
      <div className="flex w-full">
        {/* Left video */}
        <div className="w-full relative overflow-hidden p-2">
          <video className="absolute inset-0 w-full h-full object-cover" autoPlay loop muted playsInline src={video} />
          <div className="flex items-center gap-4 w-full absolute left-5">
            <img className="w-16 bottom-3" src={logo} alt="" />
            <img className="w-16 bottom-3" src={DepED} alt="" />
          </div>
        </div>

        {/* Right forms */}
        <div className="relative flex w-full flex-col justify-center items-center p-36">
          <button onClick={() => navigate("/")} className="absolute top-5 right-5">Back</button>
          <h2 className={`text-4xl text-[#2D5B60] text-center font-semibold ${mode === "login" ? "mb-6" : "-mt-2 mb-8 text-[25px]"}`}>
            {mode === "login" ? "Sign In" : "Account Registration"}
          </h2>

          {mode === "login" ? <SignInForm /> : <SignUpForm formData={formData} setFormData={setFormData} />}

          <div className="flex items-center justify-center gap-1 mt-5">
            <h2 className="text-center text-neutral-600 font-semibold">
              {mode === "login" ? "Don’t have an account yet?" : "Already have an account?"}
            </h2>
            <button className="font-semibold text-[#2D5B60] text-[17px]" onClick={() => setMode(mode === "login" ? "signup" : "login")}>
              {mode === "login" ? " Sign up" : " Sign in"}
            </button>
          </div>

          <div className="flex mt-2 text-neutral-500 items-center gap-2">
            <hr className="w-36 border-spacing-2" />
            <h1>Or</h1>
            <hr className="w-36 border-spacing-2" />
          </div>

          {/* Facebook button */}
          <button onClick={handleFacebookLogin} className="w-80 rounded-lg py-2 mt-5 text-neutral-600 font-semibold bg-blue-100 flex items-center justify-center gap-5">
            <img className="w-7" src={facebook} alt="" />
            Continue with Facebook
          </button>

          {/* Google button */}
          <button onClick={handleGoogleLogin} className="w-80 rounded-lg py-2 mt-5 text-neutral-600 font-semibold bg-red-100 flex items-center justify-center gap-5">
            <img className="w-7" src="/path-to-google-icon.png" alt="Google" />
            Continue with Google
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;