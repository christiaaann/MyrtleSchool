import React from 'react'
import Navbar from '../components/Navbar'
import bg from '../assets/bg.png'
import kid from '../assets/kid.png'
import girl from '../assets/girl.png'
import flyingkid from '../assets/flyingkid.png'
import { useNavigate } from 'react-router-dom'
import model1 from '../assets/model1.png'
const Landing = () => {
  
  const navigate = useNavigate();

  return (
    <>
    <Navbar />
     <div id='home' className='h-screen relative bg-no-repeat bg-cover bg-center z-0' style={{backgroundImage: `url(${bg})`}}>
      <div className=' h-[50rem] flex gap-2 justify-center items-center'>
      <div className='h-full  flex-col flex justify-center px-20'>
      <h1  className='text-yellow-100  leading-10 text-[6rem] font-baloo drop-shadow-lg font-bold'>Welcome to</h1>
      <h1  className=' text-green-200 flex drop-shadow-xl gap-5 font-baloo font-bold text-[6rem]'>Myrtle<span className='text-white drop-shadow-lg'>School</span></h1>
      <div className='flex px-6 gap-5'>
      <button onClick={() => navigate("/Auth")} className='bg-[#FFBD41] px-10 py-4 rounded-full font-bold shadow-md text-white'>Enroll Now</button>
      <button className=' border-2 text-white px-10 rounded-full font-bold'>Learn More</button>
      </div>
      </div> 
      <img className='w-1/2' src={flyingkid} alt="" />
      </div>
      <div className="absolute -bottom-28 w-full h-40 bg-white blur-xl"></div>      
     </div>
          

     {/* programs */}
     <div id='courses' className=' h-[30rem] relative'>
      <h1 className=' w-full text-center text-5xl text-[#57D021] drop-shadow-lg font-bold font-baloo'>Program</h1>  
      
      <div className=' absolute flex justify-center items-center h-full w-full'>
         
         <div className=' grid grid-cols-2 gap-2'>
         
         <div className=' bg-neutral-100 p-5 rounded-lg w-[38rem]'>
           
         <div className='flex text-neutral-600 gap-5 font-baloo font-semibold'>
          <h1 className='border border-black px-5 rounded-lg'>Nursery</h1>
          <h1 className='border border-black px-5 rounded-lg'>Preparatory</h1>
          <h1 className='border border-black px-5 rounded-lg'>Kindergarten</h1>
        </div>  

         <div className='flex items-center  mt-5 justify-between w-full'>
          <div className='flex gap-5 flex-col'>
           <h1 className=' text-3xl text-neutral-500 font-baloo font-bold'>PRESCHOOL</h1>        
           <p className=' text-justify font-baloo font-semibold text-neutral-500'>Enroll your child in our Preschool and watch them grow through fun, play-based learning in a safe, caring, and creative environment. Our teachers nurture curiosity, confidence, and early skills while keeping every day joyful and engaging.</p>
           <button onClick={()=> navigate("/preschool")} className='bg-white rounded-lg font-baloo shadow-sm py-1 w-32'>View More</button>
          </div>
           <img className='w-64 drop-shadow-xl' src={model1} alt="" />
         </div>

         </div>

         <div className='bg-neutral-100 w-[38rem] rounded-lg p-5'>
          
          <div className='flex text-neutral-600 gap-2 flex-wrap font-baloo text-[15px] font-semibold'>
          <h1 className='border border-black px-4 rounded-lg'>Grade I</h1>
          <h1 className='border border-black px-4 rounded-lg'>Grade II</h1>
          <h1 className='border border-black px-4 rounded-lg'>Grade III</h1>
          <h1 className='border border-black px-4 rounded-lg'>Grade IV</h1>
          <h1 className='border border-black px-4 rounded-lg'>Grade V</h1>
          <h1 className='border border-black px-4 rounded-lg'>Grade VI</h1>
        </div> 
        
         <div className='flex items-center mt-5 justify-between w-full'>
         <div className='flex gap-5 flex-col'>
         <h1 className=' text-3xl text-neutral-500 font-baloo font-bold'>ELEMENTARY</h1>        
         <p className=' text-justify font-baloo font-semibold text-neutral-500'>Our Elementary program builds strong academic foundations while helping students grow in confidence, discipline, and responsibility. With supportive teachers and engaging lessons, we guide children to develop critical thinking, good values, and a love for learning.</p>
         <button className='bg-white rounded-lg font-baloo shadow-sm py-1 w-32'>View More</button>
         </div>
         <img className='w-64 drop-shadow-xl' src={model1} alt="" />
         </div>
         </div>
         </div>
      </div>
     </div>
    </>
  )
}

export default Landing