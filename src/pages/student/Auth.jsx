import React, { useState, useEffect } from 'react'
import SignInForm from './SignInForm';
import SignUpForm from './SignUpForm';
import logo from '../../assets/logo.png'
import check from '../../assets/icons/check.png'
import video from '../../assets/video.mp4'
import DepED from '../../assets/DepEDLogo.png'
import facebook from '../../assets/icons/facebook.png'

import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
const Auth = () => {

  const [mode, setMode] = useState("login");
  const {user, role} = useAuth();
  const navigate = useNavigate();

useEffect(() => {
  if (!user) return;

  if (role === "admin") {
    navigate("/admin");
  } else {
    navigate("/Enrollment");
  }
}, [user, role, navigate]);



  return (
   <>
   <div className='min-h-screen flex max-w-7xl mx-auto p-10'>
      <div className='flex shadow-lg rounded-lg p-1 w-full'>
      <div className=' rounded-s-xl border w-full h-full relative overflow-hidden p-2'>
      <video className=' absolute inset-0 rounded-s-xl w-full h-full object-cover' autoPlay loop muted playsInline src={video}></video>
       <div className="absolute inset-0 w-full h-full bg-green-500/30"></div>
        <div className='flex items-center gap-4 w-full absolute  left-5'>
             <img className='w-16 bottom-3' src={logo} alt="" />
        <img className='w-16 bottom-3' src={DepED} alt="" />
       </div>
      </div>
      
      <div className='relative flex w-full flex-col justify-center items-center p-10'>
        {/* Title */}
      <h2 className="text-4xl absolute text-green-600 w-full text-center top-2 font-semibold">
      {mode === "login" ? "Sign In" : "Account Registration"}
     </h2>
      {mode === "login" ? <SignInForm /> : <SignUpForm />}

        <div className='flex items-center justify-center gap-1 mt-5'>
        <h2 className=' text-center text-neutral-600 font-semibold'>
        {mode === "login"
          ? "Don’t have an account yet?"
          : "Already have an account?"}
       </h2>
        <button className='font-semibold text-green-700 text-[17px]' onClick={() =>
          setMode(mode === "login" ? "signup" : "login")
        }>
          {mode === "login" ? " Sign up" : " Sign in"}
        </button>
</div>
        <div className='flex mt-2 items-center gap-2'>
        <hr className='w-36 border-spacing-2' />
        <h1>Or</h1>
       <hr className='w-36 border-spacing-2' /></div>
        <button className=' w-80 rounded-lg py-2 mt-5 text-neutral-600 font-semibold bg-neutral-100 flex items-center justify-center gap-5'><img className='w-7' src={facebook} alt="" />Continue with Facebook</button>
     
      </div>
    </div>
   </div>
   </>
  )
}

export default Auth