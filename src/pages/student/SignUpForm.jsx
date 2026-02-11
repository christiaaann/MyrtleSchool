import React from 'react'

const SignUpForm = () => {
   return (
    <form className='flex flex-col gap-4 justify-center w-full items-center'>
      <input className=' px-5 py-2 w-80 outline-none border-2 rounded-lg' type="text" placeholder='firstname.lastname' />
      <input className=' px-5 py-2 w-80 outline-none border-2 rounded-lg' type="text" placeholder='Address' />
      <input className=' px-5 py-2 w-80 outline-none border-2 rounded-lg' type="email" placeholder="Email" />
      <input className=' px-5 py-2 w-80 outline-none border-2 rounded-lg' type="password" placeholder="Password" />
      <input className='file:bg-neutral-200 file:border-none file:py-2 file:rounded-lg file:px-5 file:cursor-pointer font-semibold text-neutral-600' type="file" name="" id="picture" />
      <button className='bg-green-600 text-white w-80 py-2 rounded-lg font-semibold'>Register</button>
    </form>
  );
};

export default SignUpForm