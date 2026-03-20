import React, { useState, useEffect } from "react";
import SignInForm from "./SignInForm";
import { Link } from "react-router-dom";
import {
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
import DepED from "../../assets/DepEDLogo.png";
import facebook from "../../assets/icons/facebook.png";
import google from "../../assets/icons/google.png";

const Auth = () => {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

 const handleNavigation = (userData) => {
  const role = (userData.role || "parent").toLowerCase();

  // Admin
  if (role === "admin") {
    navigate("/admin/dashboard", { replace: true });
    return;
  }

  // Compute dynamically if profile is complete
  const profileComplete =
    !!userData.isProfileComplete ||
    (!!userData.parent?.firstname &&
     !!userData.parent?.lastname &&
     !!userData.address?.barangay &&
     !!userData.address?.city &&
     !!userData.address?.province);

  if (!profileComplete) {
    navigate("/completeprofile", { replace: true });
  } else {
    navigate("/enrollment", { replace: true });
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
      parent: {
        firstname: firstName,
        middlename: middleName,
        lastname: lastName,
        occupation: "",
        contact: "",
      },
      spouse: {
        firstname: "",
        middlename: "",
        lastname: "",
        occupation: "",
        contact: "",
      },
      address: {
        barangay: "",
        city: "",
        province: "",
        purok: "",
        fullAddress: "",
      },
    };

    const userDocRef = doc(db, "users", user.uid);
    await setDoc(userDocRef, newUserData);

    return newUserData;
  };

  // google account
 const handleOAuthLogin = async (provider) => {
  try {
    if (provider instanceof GoogleAuthProvider) {
      provider.setCustomParameters({ prompt: "select_account" });
    }

    await signInWithPopup(auth, provider);

  } catch (error) {
    console.error("OAuth login error:", error);
    alert(error.message);
  }
};

  const handleFacebookLogin = () =>
        handleOAuthLogin(new FacebookAuthProvider());

  const handleGoogleLogin = () =>
        handleOAuthLogin(new GoogleAuthProvider());

 useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (user) => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const userDocRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(userDocRef);

      let userData;
      if (docSnap.exists()) {
        userData = docSnap.data();
      } else {
        userData = await createNewUserDoc(user);
      }

      // Wait until userData is fully ready
      if (userData) {
        handleNavigation(userData);
      }

    } catch (err) {
      console.error("Auth state error:", err);
    } finally {
      setLoading(false);
    }
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
      <div className="min-h-screen overflow-hidden flex bg-gradient-to-l from-gray-200 via-green-100 to-stone-100">
        <div className="flex  w-full">
          {/* Left */}
          <div className="w-full hidden duration-300 laptop:block relative overflow-hidden">
            <div className="flex items-center justify-center h-full gap-4 w-full absolute left-5">
              <img className="w-32 bottom-3" src={logo} alt="" />
              <img className="w-32 bottom-3" src={DepED} alt="" />
            </div>
          </div>

          {/* Right */}
          <div className="bg-white tablet:w-[70rem] w-full p-3 flex flex-col justify-center items-center border-l-4">
            <button
              onClick={() => navigate("/")}
              className="absolute top-5 right-5"
            >
              Back
            </button>

            <h2 className="text-4xl text-[#2D5B60] text-center font-semibold mb-6">
              Sign In
            </h2>

            <SignInForm />
             <h1 className=" text-neutral-500 flex gap-1 mt-2">Don't have an account?<Link className=" text-neutral-700" to="/signup">Signup</Link></h1>
            <div className="flex justify-center mt-2 text-neutral-500 items-center gap-2">
              <hr className="w-36" />
              <h1>Or</h1>
              <hr className="w-36" />
            </div>

            <div className="flex justify-center gap-5">
              {/* Facebook */}
              <button
                onClick={handleFacebookLogin}
                className="w-12 h-12 rounded-full mt-5 bg-blue-100 flex items-center justify-center"
              >
                <img className="w-8" src={facebook} alt="" />
              </button>

              {/* Google */}
              <button
                onClick={handleGoogleLogin}
                className="w-12 h-12 rounded-full mt-5 bg-gray-100 flex items-center justify-center"
              >
                <img className="w-8" src={google} alt="Google" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <footer className="w-full bg-white p-5 border-t-4">
        <div className="flex flex-col gap-1 tablet:gap-10 tablet:flex-row justify-around">
          <div className="text-neutral-500 w-full leading-6 text-sm">
            <h1 className="text-xl font-bold text-neutral-500">
              Myrtle Christian School
            </h1>
            <p>
              Purok 1, Hacienda de Ortube, Irosin, Sorsogon, San Juan
              Poblacion, Philippines 4707
            </p>
          </div>

          <div className="text-neutral-500 w-full text-sm">
            <p>School Telephone: +639919107871</p>
            <p>Email:</p>
            <p>Contact Admin:</p>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Auth;