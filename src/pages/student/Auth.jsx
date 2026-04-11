import React from "react";
import SignInForm from "./SignInForm";
import { useNavigate } from "react-router-dom";

import logo from "../../assets/logo.png";
import DepED from "../../assets/DepEDLogo.png";

const Auth = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen overflow-hidden flex bg-gradient-to-l from-gray-200 via-green-100 to-stone-100">
      <div className="flex w-full">
        {/* Left Side: Logos */}
        <div className="w-full hidden duration-300 laptop:block relative overflow-hidden">
          <div className="flex items-center justify-center h-full gap-4 w-full absolute left-5">
            <img className="w-32 bottom-3" src={logo} alt="Logo" />
            <img className="w-32 bottom-3" src={DepED} alt="DepEd" />
          </div>
        </div>

        {/* Right Side: Form Container */}
        <div className="bg-white tablet:w-[70rem] w-full p-3 flex flex-col justify-center items-center border-l-4 relative">
          <button onClick={() => navigate("/")} className="absolute top-5 right-5 text-gray-500 font-bold hover:text-black transition-colors">
            Back
          </button>
          <h2 className="text-4xl text-[#2D5B60] text-center font-semibold mb-6">Sign In</h2>
          
          {/* ALL Login Logic is now isolated inside SignInForm */}
          <SignInForm />
        </div>
      </div>
    </div>
  );
};

export default Auth;