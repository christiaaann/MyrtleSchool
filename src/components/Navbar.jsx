import React from 'react'
 import logo from '../assets/logo.png'
const Navbar = () => {
  return (

    <div className='flex justify-center'>
    <nav className=' bg-white z-20 fixed mt-2 w-full overflow-hidden rounded-xl px-6 flex items-center justify-between gap-56 py-2 shadow-md'>
     <div className='flex text-nowrap items-center gap-3'>
      <img className='w-14 object-contain' src={logo} alt="" />
      <h1 className='text-xl text-neutral-700 font-baloo font-bold'>MYRTLE CHRISTIAN SHCOOL INC.</h1>
     </div>

     <ul className='flex text-[#494949] font-baloo font-semibold justify-end w-full space-x-11'>
      <li><a href="#home">Home</a></li>
      <li><a href="#about">About</a></li>
      <li><a href="#courses">Program</a></li>
      <li><a href="">Contact</a></li>
     </ul>
       
       <div>
          <button className='text-nowrap mr-16 text-white  w-full px-2 py-2 rounded-full font-semibold shadow-sm  bg-[#2D5B60]'>Enroll Now</button>
       </div>
    </nav></div>
  )
}

export default Navbar