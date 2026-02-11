import React from 'react'

const SignUpForm = () => {
   return (
    <form className='flex flex-col gap-4 justify-center w-full items-center'>
      <input className=' px-5 py-2 w-80 outline-none border-2 rounded-lg' type="text" placeholder='FullName' />
      <input className=' px-5 py-2 w-80 outline-none border-2 rounded-lg' type="text" placeholder='Adress' />
      <input className=' px-5 py-2 w-80 outline-none border-2 rounded-lg' type="email" placeholder="Email" />
      <input className=' px-5 py-2 w-80 outline-none border-2 rounded-lg' type="password" placeholder="Password" />
     
      <button className='bg-green-600 text-white w-80 py-2 rounded-lg font-semibold'>Register</button>
    </form>
  );
};

export default SignUpForm