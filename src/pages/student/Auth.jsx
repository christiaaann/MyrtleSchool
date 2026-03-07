import React, { useState, useEffect } from "react";
import SignInForm from "./SignInForm";
import SignUpForm from "./SignUpForm";
import {
  getAuth,
  signInWithPopup,
  FacebookAuthProvider,
  GoogleAuthProvider,
  onAuthStateChanged,
} from "firebase/auth";

import { auth, db } from "../../services/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

// icons
import logo from "../../assets/logo.png";
import video from "../../assets/video.mp4";
import DepED from "../../assets/DepEDLogo.png";
import facebook from "../../assets/icons/facebook.png";
import google from "../../assets/icons/google.png"

const Auth = () => {
  const [mode, setMode] = useState("login");
  const [formData, setFormData] = useState({ name: "", email: "" });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Helper: check if profile complete
  const isProfileComplete = (userDoc) => {
    const parent = userDoc.parent;
    const spouse = userDoc.spouse;
    const address = userDoc.address;
    return (
      parent?.firstname &&
      parent?.lastname &&
      spouse?.firstname &&
      spouse?.lastname &&
      address?.barangay &&
      address?.city &&
      address?.province
    );
  };

const handleNavigation = (userData) => {
  const role = (userData.role || "parent").toLowerCase();

  if (role === "admin") {
    navigate("/admin/dashboard", { replace: true });
    return;
  }

  // Kung profile incomplete must go to completeprofile
  if (
    !userData.parent?.firstname ||
    !userData.parent?.lastname ||
    !userData.spouse?.firstname ||
    !userData.spouse?.lastname ||
    !userData.address?.barangay ||
    !userData.address?.city ||
    !userData.address?.province
  ) {
    navigate("/completeprofile", { replace: true });
  } else {
    navigate("/Enrollment", { replace: true });
  }
};

  const createNewUserDoc = async (user) => {
    const fullName = user.displayName || "";
    const nameParts = fullName.split(" ");
    const firstName = nameParts[0] || "";
    const middleName = nameParts.length === 3 ? nameParts[1] : "";
    const lastName =
      nameParts.length === 3 ? nameParts[2] : nameParts.slice(1).join(" ");

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

    const userDocRef = doc(db, "users", user.uid);
    await setDoc(userDocRef, newUserData);

    return newUserData;
  };

  // OAuth login using popup (better for React SPA)
  const handleOAuthLogin = async (provider) => {
    try {
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
        const newUserData = await createNewUserDoc(user);
        navigate("/completeprofile", { replace: true });
      }
    } catch (error) {
      console.error("OAuth login error:", error);
      alert(error.message);
    }
  };

  const handleFacebookLogin = () => handleOAuthLogin(new FacebookAuthProvider());
  const handleGoogleLogin = () => handleOAuthLogin(new GoogleAuthProvider());

  // Listen to auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDocRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(userDocRef);

          if (docSnap.exists()) {
            handleNavigation(docSnap.data());
          } else {
            const newUserData = await createNewUserDoc(user);
            navigate("/completeprofile", { replace: true });
          }
        } catch (err) {
          console.error("Auth state error:", err);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  if (loading) {
    return (
      <div className="h-screen flex justify-center items-center">
        <h1 className="text-xl font-semibold text-[#2D5B60]">Loading...</h1>
      </div>
    );
  }

  return (
    <>
    <div className="min-h-screen flex bg-gradient-to-l from-gray-200 via-green-100 to-stone-100">
      <div className="flex w-full">
        {/* Left video */}
        <div className="w-full relative overflow-hidden">
          {/* <video
            className="absolute inset-0 w-full h-full object-cover"
            autoPlay
            loop
            muted
            playsInline
            src={video}
          /> */}
          <div className="flex items-center justify-center h-full gap-4 w-full absolute left-5">
            <img className="w-32 bottom-3" src={logo} alt="" />
            <img className="w-32 bottom-3" src={DepED} alt="" />
          </div>
        </div>
        

        {/* Right forms */}
        <div className=" bg-white w-[70rem] flex flex-col justify-center items-center border-l-4">
          <button
            onClick={() => navigate("/")}
            className="absolute top-5 right-5"
          >
            Back
          </button>
          <h2
            className={`text-4xl text-[#2D5B60] text-center font-semibold ${
              mode === "login" ? "mb-6" : "-mt-2 mb-8 text-[25px]"
            }`}
          >
            {mode === "login" ? "Sign In" : "Account Registration"}
          </h2>
        
          {mode === "login" ? (
            <SignInForm />
          ) : (
            <SignUpForm formData={formData} setFormData={setFormData} />
          )}

          <div className="flex items-center justify-center gap-1 mt-5">
            <h2 className="text-center text-neutral-600 font-semibold">
              {mode === "login"
                ? "Don’t have an account yet?"
                : "Already have an account?"}
            </h2>
            <button
              className="font-semibold text-[#2D5B60] text-[17px]"
              onClick={() =>
                setMode(mode === "login" ? "signup" : "login")
              }
            >
              {mode === "login" ? " Sign up" : " Sign in"}
            </button>
          </div>

          <div className="flex justify-center mt-2 text-neutral-500 items-center gap-2">
            <hr className="w-36" />
            <h1>Or</h1>
            <hr className="w-36" />
          </div>
           
           <div className=" flex justify-center gap-5">
          {/* Facebook */}
          <button
            onClick={handleFacebookLogin}
            className=" w-12 h-12 rounded-full mt-5 text-neutral-600  bg-blue-100 flex items-center justify-center gap-5"
          >
            <img className="w-8" src={facebook} alt="" />
          
          </button>

          {/* Google */}
          <button
            onClick={handleGoogleLogin}
            className=" w-12 h-12 rounded-full py-2 mt-5 text-neutral-600 font-semibold bg-gray-200 flex items-center justify-center gap-5"
          >
            <img className="w-8" src={google} alt="Google" />
            
          </button>
          </div>
        </div>
      </div>
    </div>
     <footer className=" w-full bg-white p-5 border-t-4">
      
      <div className="flex justify-around">
      <div className=" text-neutral-500 text-sm">
      <h1 className=" text-xl font-bold text-neutral-500">Myrtle Christian School</h1>  
      <p>Purok 1, Hacienda de Ortube , Irosin,Sorsogon , San Juan Poblacion , Phillippines 4707</p>
      
      </div>
      <div className="text-neutral-500 text-sm">
       <p>School Telephone: +639919107871 </p>
       <p>Email: </p>
       <p>Contact Admin:</p>
      </div>
      </div>
      </footer>
    </>
  );
};

export default Auth;