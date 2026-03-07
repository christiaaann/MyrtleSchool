import React from 'react'
import Navbar from '../../components/Navbar'
import bg from '../../assets/myrtlebg.png'
import kid from '../../assets/kid.png'
import girl from '../../assets/girl.png'
import flyingkid from '../../assets/flyingkid.png'
import { useNavigate } from 'react-router-dom'
import model1 from '../../assets/model1.png'
import mission from '../../assets/icons/mission.png'
import { auth, db } from "../../services/firebase";
import { doc, getDoc } from "firebase/firestore";
const Landing = () => {
  
  const navigate = useNavigate();
  const handleEnrollNow = async () => {
  const user = auth.currentUser;

  if (!user) {
    navigate("/Auth");
    return;
  }

  // Fetch user doc
  const docRef = doc(db, "users", user.uid);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    navigate("/Auth"); 
    return;
  }

  const data = docSnap.data();

  const isProfileComplete =
    data.parent?.firstname &&
    data.parent?.lastname &&
    data.spouse?.firstname &&
    data.spouse?.lastname &&
    data.address?.barangay &&
    data.address?.city &&
    data.address?.province;

  if (!isProfileComplete) {
    navigate("/completeprofile"); 
  } else {
    navigate("/Enrollment"); 
  }
};
  return (
    <>
    <Navbar />
     <div id='home' className=' min-h-screen flex items-center bg-no-repeat bg-cover bg-center' style={{backgroundImage: `url(${bg})`}}>
      <div className='px-10'>
      <div className=' flex-col flex justify-center'>   
      <h1  className='text-yellow-100  leading-10 text-[6rem] font-baloo drop-shadow-lg font-bold'>Welcome to</h1>
      <h1  className=' text-green-200 flex drop-shadow-xl gap-5 font-baloo font-bold text-[6rem]'>Myrtle<span className='text-white drop-shadow-lg'>School</span></h1>
      <div className='flex gap-5'>
      <button onClick={handleEnrollNow}  className='bg-[#F3EFE4] border-2 px-10 py-4 rounded-full font-bold shadow-md text-[#2D5B60]'>Enroll Now</button>
      <button className=' border-2 text-white px-10 rounded-full backdrop-blur-sm font-bold'>Learn More</button>
      </div>
      </div> 
      {/* <img className='w-1/2' src={flyingkid} alt="" /> */}
      </div>
     </div>
          

     {/* programs */}
     <div id='courses' className=' min-h-screen gap-5  bg-[#F3EFE4] flex flex-col justify-center'>
      <h1 className=' w-full text-center text-7xl text-[#2D5B60] drop-shadow-lg font-bold font-baloo'>Program</h1>  
         <div className='flex   justify-center items-center  gap-2'>
         <div className=' bg-neutral-100 border-t-8 border-[#2D5B60] p-5 rounded-lg w-[38rem]'> 
         <div className='flex text-neutral-600 gap-5 font-baloo font-semibold'>
          <h1 className='border border-black px-5 rounded-lg'>Nursery</h1>
          <h1 className='border border-black px-5 rounded-lg'>Preparatory</h1>
          <h1 className='border border-black px-5 rounded-lg'>Kindergarten</h1>
        </div>  

         <div className='flex items-center mt-5 justify-between w-full'>
          <div className='flex gap-5 flex-col'>
           <h1 className=' text-3xl text-neutral-500 font-baloo font-bold'>PRESCHOOL</h1>        
           <p className=' text-justify font-baloo font-semibold text-neutral-500'>Enroll your child in our Preschool and watch them grow through fun, play-based learning in a safe, caring, and creative environment. Our teachers nurture curiosity, confidence, and early skills while keeping every day joyful and engaging.</p>
           <button onClick={()=> navigate("/preschool")} className='bg-white rounded-lg font-baloo shadow-sm py-1 w-32'>View More</button>
          </div>
           <img className='w-64 drop-shadow-xl' src={model1} alt="" />
         </div>

         </div>

         <div className='bg-neutral-100 w-[38rem] rounded-lg p-5 border-t-8 border-[#2D5B60]'>
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
      
      {/* about */}
    <div id='about' className='min-h-screen'>
   
</div>

    </>
  )
}

export default Landing