import React from 'react'
import Navbar from '../../components/Navbar'
import bg from '../../assets/myrtlebg.png'
import { useNavigate } from 'react-router-dom'
import model1 from '../../assets/model1.png'
import { auth, db } from "../../services/firebase";
import { doc, getDoc } from "firebase/firestore";
import facebook from "../../assets/icons/facebook.png"
import iconcall from '../../assets/icons/call.png'
import icongmail from '../../assets/icons/gmail.png'
import sun from "../../assets/sun.png"
import mountain from "../../assets/mountain.png"
import img from "../../assets/img.png"
import image2 from "../../assets/image2.png"
import gif from '../../assets/gif.png'
import logo from "../../assets/logo.png"
import { useState } from 'react'
const Landing = () => {
  const navigate = useNavigate("");
  const faqData = [
      {
        question: "What age is accepted for Preschool?",
        answer: "We accept children ages 3 to 5 years old, depending on the program level."
      },
      {
        question: "When does enrollment start?",
        answer: "Enrollment usually starts a few months before the opening of classes. Please check announcements for exact dates."
      },
      {
        question: "Is there an entrance exam?",
        answer: "No entrance exam is required for Preschool. Assessment is done through simple observation."
      },
      {
          question: "What do I need to prepare to enroll my child in Preschool?",
          answer: [
                "PSA Birth Certificate (photocopy)",
                "Photocopy of Progress Report Card",
                "2 pcs of 1x1 ID picture"
          ],
      
      }
    ];
  
  
    const [openIndex, setOpenIndex] = useState(null);
  
    const toggleFAQ = (index) => {
      if (openIndex === index) {
        setOpenIndex(null); 
      } else {
        setOpenIndex(index);
      }
    };

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
    <div className='bg-[#C8E6C9]'>
    <div className=' overflow-hidden'>
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

      
      {/* about */}
    <div id='about' className='min-h-screen relative flex flex-col justify-center items-center phone:p-2 mini:p-2 tablet:p-5'> 
       <h1 className=' text-center text-4xl text-neutral-500 font-semibold'>About</h1>
      <div className='flex  flex-col tablet:flex-row phone:gap-5 tablet:gap-2 mini:gap-2  mt-10'>
       <div className=' bg-white rounded-lg w-full'>
        <img className='rounded-lg' src={image2} alt="" />
        <div className='p-5'>
        <h1 className=' text-3xl font-semibold'>MISSION</h1>
        <p className='text-justify text-neutral-500'>MSCI strive to prepare lifelong
         learning and responsible citizens
         ready to meet to challenges of the future
         In partnership of families and community to perform Godly
         character in a society 
        </p>
        </div>
       </div>
        <div className=' bg-white rounded-lg w-full'>
        <img className='rounded-lg' src={img} alt="" />
        <div className='p-5'>
        <h1 className=' text-3xl font-semibold'>VISSION</h1>
        <p className='text-justify text-neutral-500'>MSCI is dedicated to a continuing tradition of excellence
        in a new ever-changing world, to empower students to believe on
        God's given ability,to Embrace learning and demonstrate a life long learning.
        </p>
        </div>
       </div>
         <div className=' bg-white rounded-lg w-full'>
        <img className='rounded-lg' src={img} alt="" />
        <div className='p-5'>
        <h1 className=' text-3xl font-semibold'>PHILOSOPHY</h1>
        <p className='text-justify text-neutral-500'>Children need to be care for, provided with a healthy relationship,
        lead them into the Image of God,make them feel
        the unconditional Love and help them develop their lives as a total person: Body, Soul, and Spirit. 
        </p>
        </div>
       </div>
      </div>
   
</div>

<div className =" min-h-screen relative">
    <img className=' absolute -left-2 w-[10rem] tablet:w-[15rem] laptop:w-[24rem] laptop:top-2 z-0 ' src={gif} alt="" />
    <div className='max-w-4xl relative mx-auto z-10 p-6'>
        <div className='flex flex-col gap-2 w-full items-center'>
          <h1 className='border-2 border-black px-6 rounded-full'>FAQ</h1>
          <h1 className='font-semibold text-2xl text-neutral-500'>Frequently Asked Questions</h1>
        </div>
        <div className='mt-10 space-y-4'>
          {faqData.map((item, index) => (
            <div key={index} className='bg-gray-100  rounded-lg'>
              <button
                onClick={() => toggleFAQ(index)}
                className='w-full flex justify-between duration-300 items-center px-4 py-3 text-left text-lg font-medium focus:outline-none'
              >
                <span className='text-gray-700'>{item.question}</span>
                <span className='text-xl text-white bg-neutral-400 w-8 h-8 flex justify-center rounded-full'>{openIndex === index ? "−" : "+"}</span>
              </button>
             
              {openIndex === index && (
                <div className='px-4 pb-4 text-gray-500 flex flex-col gap-1'>
                  {Array.isArray(item.answer)
                    ? item.answer.map((ans, idx) => <span key={idx}>• {ans}</span>)
                    : <span>{item.answer}</span>
                  }
                </div>
              )}
            </div>
          ))}
        </div>
         
        <div className='mt-20'>
        <h1 className='text-2xl text-center font-semibold text-neutral-500'>You still have a question?</h1>
        <p className='text-neutral-500 mt-2 text-center flex flex-col'>If you cannot find answer to your question in our FAQ 
        <span>you can always contact us.We will answer to you shortly!</span>
        </p>  
         <div className='flex flex-col tablet:flex-row gap-5 items-center mt-8'>
          <div className='flex justify-center w-full'>
           <div className='bg-gray-100 rounded-lg flex gap-2 flex-col items-center p-2 w-[28rem] tablet:w-full'>
            <img className='w-8' src={iconcall} alt="" />
            <h1 className='font-semibold text-neutral-700'>+0909090909</h1>
            <p className='text-neutral-500'>We are always happy fot help</p>
           </div>
          </div>
            <div className='flex w-full justify-center'>
           <div className='bg-gray-100 rounded-lg flex gap-2 flex-col items-center w-[28rem] tablet:w-full p-2'>
            <img className='w-8' src={icongmail} alt="" />
            <h1 className='font-semibold text-neutral-700'>myrtle@gmail.com</h1>
            <p className='text-neutral-500'>The best way to get answer faster</p>
           </div>
         </div>
         </div>
         
        </div>
      </div>
</div>


<div className=" tablet:h-[20rem] h-[10rem] w-full relative">
  
 

  <div className=" w-full">
    {/* Sun */}
    <img
      src={sun}
      alt="sun"
      className="w-[8rem] phone:w-[12rem] tablet:w-[24rem] absolute duration-300 left-1/3 -bottom-0 transform -translate-x-1/2 animate-smoothBounce"
    />
    {/* Mountain */}
    <img
      src={mountain}
      alt="mountain"
      className="absolute bottom-0 left-0 w-full z-10"
    />
  </div>
</div>

</div>
</div>
    </>
  )
}

export default Landing