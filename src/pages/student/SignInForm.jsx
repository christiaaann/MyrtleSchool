import React from 'react'

const SignInForm = () => {
   return (
    <form className='flex flex-col gap-4 justify-center w-full items-center'>
      <input className=' px-5 py-2 w-80 outline-none border-2 rounded-lg' type="email" placeholder="your@gmail.com" />
      <input className=' px-5 py-2 w-80 outline-none border-2 rounded-lg' type="password" placeholder="Password" />
      <button className='bg-green-600 text-white w-80 py-2 rounded-lg font-semibold'>Login</button>
    </form>
  );
};

export default SignInForm