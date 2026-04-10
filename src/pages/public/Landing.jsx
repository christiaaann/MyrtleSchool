import React from 'react'
import Navbar from '../../components/Navbar'
import { useNavigate } from 'react-router-dom'
import model1 from '../../assets/model1.png'
import { auth, db } from "../../services/firebase";
import { doc, getDoc } from "firebase/firestore";
import image1 from "../../assets/image1.png"
import image2 from "../../assets/image2.png"
import image3 from "../../assets/image3.png"
import DepedLogo from "../../assets/DepEDLogo.png"
import logo from "../../assets/logo.png"
import { useState, useEffect } from 'react'
import boy from "../../assets/boy.png"
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
const Landing = () => {
  const navigate = useNavigate("");
  
  const [announcements, setAnnouncements] = useState([]);
const [current, setCurrent] = useState(0);

useEffect(() => {
  const q = query(
    collection(db, "announcements"),
    orderBy("createdAt", "desc"),
    limit(3)
  );

  // Real-time listener
  const unsubscribe = onSnapshot(q, (snapshot) => {
    setAnnouncements(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  });

  // Cleanup kapag component 
  return () => unsubscribe();
}, []);

useEffect(() => {
  const interval = setInterval(() => {
    setCurrent(prev => announcements.length ? (prev + 1) % announcements.length : 0);
  }, 3000); // change slide every 3s
  return () => clearInterval(interval);
}, [announcements]);
 

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

  const docRef = doc(db, "users", user.uid);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    navigate("/Auth");
    return;
  }

  const data = docSnap.data();

  // ✅ ADMIN GOES DIRECT TO DASHBOARD
  if (data.role === "admin") {
    navigate("/admin");
    return;
  }

  const isProfileComplete =
    !!data.parent?.firstname &&
    !!data.parent?.lastname &&
    !!data.parent?.contact &&
    !!data.parent?.occupation &&
    !!data.address?.barangay &&
    !!data.address?.city &&
    !!data.address?.province &&
    (data.noSpouse || (
      !!data.spouse?.firstname &&
      !!data.spouse?.lastname &&
      !!data.spouse?.contact &&
      !!data.spouse?.occupation
    ));

  if (!isProfileComplete) {
    navigate("/completeprofile");
  } else {
    navigate("/Enrollment");
  }
};


  return (
    <>
        <Navbar />
    <div className=' overflow-hidden'>
     {/* <div id='home' className=' min-h-screen flex items-center justify-center phone:justify-start bg-cover bg-no-repeat bg-center'>
      <div className='px-10'>
      <div className=' flex-col flex justify-center'>   
      <h1  className='text-yellow-100  leading-10  font-baloo drop-shadow-lg font-bold text-6xl tablet:text-[6rem]'>Welcome to</h1>
      <h1  className=' text-green-200 flex drop-shadow-xl gap-5 font-baloo font-bold text-6xl tablet:text-[6rem]'>Myrtle<span className='text-white drop-shadow-lg'>School</span></h1>
      <div className='flex mt-5 gap-5'>
      <button onClick={handleEnrollNow} className='bg-[#F3EFE4] border-2 px-10 py-4 rounded-full font-bold shadow-md text-[#2D5B60]'>Enroll Now</button>
      <button className=' border-2 text-white px-10 rounded-full backdrop-blur-sm font-bold'>Learn More</button>
      </div>
      </div> 
      </div>
     </div> */}

    <div id='home' className="min-h-screen bg-gradient-to-tr relative from-white via-green-100 to-white flex items-center"> 
       {/* <div className="absolute inset-0 z-0 bg-[radial-gradient(circle,_#cbd5e1_1px,_transparent_1px)] bg-[length:10px_10px] pointer-events-none" /> */}
      <div className='flex z-10  h-full w-full p-5 mx-auto tablet:justify-between justify-center'>
      <div className="flex w-full  flex-col justify-center items-center gap-5 tablet:items-start">
        <div className='flex flex-col gap-1 justify-center items-center w-full'>
        <h1 className="tablet:text-7xl font-bold text-4xl text-nowrap"> Start Your Child’s </h1>
        <h1 className="tablet:text-6xl text-[#2D5B60] font-bold text-4xl"> Future Today!</h1>
      <button onClick={handleEnrollNow} className="bg-[#2D5B60] mt-2 text-white px-10 py-2 tablet:py-2 tablet:text-lg text-sm rounded-2xl">Enroll Now</button> 
       </div>
        <div className='flex justify-center w-full'>
        {announcements.length > 0 ? (
          <div className=" max-w-7xl rounded-xl shadow-lg flex justify-center overflow-hidden">
            <img
              src={announcements[current].imageUrl}
              alt="announcement"
              className=" border-[1rem] w-[48rem] h-[23rem] tablet:h-[28rem] border-white transition-all duration-500"
            />
          </div>
        ) : (
          <div className="text-center py-10 text-gray-400">No announcements yet.</div>
        )}
      </div>

      </div>
      <div className='tablet:flex hidden absolute bottom-0 justify-end w-full'>
        <img className=' laptop:w-72 object-contain tablet:block hidden bottom-0 absolute duration-300' src={boy} alt="" />
        <img className=' w-64 laptop:w-80 hidden tablet:block object-contain absolute bottom-0 right-32 ' src={model1} alt="" />
        </div>
      </div>
    </div>
              

     {/* programs */}
     {/* <div className="h-screen max-w-4xl mx-auto ">
     <h1 className="text-center text-5xl">Our Program</h1>
     <div className=" bg-yellow-100/20 p-10 rounded-3xl shadow-lg border-e-4 border-b-4 border-black w-full flex flex-col">
      <span  className="border-b-4 border-black bg-orange-400 font-bold w-10 h-10 rounded-full flex justify-center items-center">1</span>
      <span  className="border-b-4 border-black bg-orange-400 font-bold w-10 h-10 rounded-full flex justify-center items-center">2</span>
      <span  className="border-b-4 border-black bg-orange-400 font-bold w-10 h-10 rounded-full flex justify-center items-center">3</span>
      <span  className="border-b-4 border-black bg-orange-400 font-bold w-10 h-10 rounded-full flex justify-center items-center">4</span>
      <span  className="border-b-4 border-black bg-orange-400 font-bold w-10 h-10 rounded-full flex justify-center items-center">5</span>
     </div>
     </div> */}

      
      {/* about */}
    <div id='about' className='min-h-screen relative flex flex-col justify-center items-center phone:p-2 mini:p-2 tablet:p-5'> 
       {/* <h1 className=' text-center text-4xl text-neutral-500 font-semibold'>About</h1> */}
       
      <div className='flex  flex-col laptop:flex-row phone:gap-5 tablet:gap-2 mini:gap-2  mt-10'>
    <div className="relative w-full rounded-2xl overflow-hidden shadow">
     <img
      className="w-full h-[450px] object-cover" 
      src={image1}
      alt="Mission image"
      />
     <div className="absolute bottom-0 left-0 right-0 h-[60%] bg-gradient-to-t from-white via-white/95 to-transparent px-8 pb-8 pt-12 flex flex-col justify-end">
    <span className="text-4xl font-serif text-black leading-none mb-1 opacity-80">
      “
    </span>

    <h1 className="text-2xl font-bold drop-shadow-lg text-red-600 leading-relaxed text-justify mb-4">
      MISSION
    </h1>
    <p className="text-sm font-semibold text-justify">
      MSCI strive to prepare lifelong learning and responsible citizens
      ready to meet the challenges of the future. In partnership of
      families and community to perform Godly character in a society.
    </p>
    <div className="mt-5 text-right">
      <p className="text-xs text-neutral-400">— MSCI</p>
    </div>
   </div>
   </div>
     <div className="relative w-full rounded-2xl overflow-hidden shadow">
     <img
      className="w-full h-[450px] object-cover" 
      src={image2}
      alt="Mission image"
      />
     <div className="absolute bottom-0 left-0 right-0 h-[60%] bg-gradient-to-t from-white via-white/95 to-transparent px-8 pb-8 pt-12 flex flex-col justify-end">
    <span className="text-4xl font-serif text-black leading-none mb-1 opacity-80">
      “
    </span>

    <h1 className="text-2xl font-bold drop-shadow-lg text-yellow-300 leading-relaxed text-justify mb-4">
      VISSION
    </h1>
    <p className="text-sm font-semibold text-justify">
        MSCI is dedicated to a continuing tradition of excellence
        in a new ever-changing world, to empower students to believe on
        God's given ability,to Embrace learning and demonstrate a life long learning.
    </p>
    <div className="mt-5 text-right">
      <p className="text-xs text-neutral-400">— MSCI</p>
    </div>
   </div>
   </div>
     <div className="relative w-full rounded-2xl overflow-hidden shadow">
     <img
      className="w-full h-[450px] object-cover" 
      src={image3}
      alt="Mission image"
      />
     <div className="absolute bottom-0 left-0 right-0 h-[60%] bg-gradient-to-t from-white via-white/95 to-transparent px-8 pb-8 pt-12 flex flex-col justify-end">
    <span className="text-4xl font-serif text-black leading-none mb-1 opacity-80">
      “
    </span>

    <h1 className="text-2xl font-bold drop-shadow-md text-green-900 leading-relaxed text-justify mb-4">
      PHILOSOPHY
    </h1>
    <p className="text-sm font-semibold text-justify">
        Children need to be care for, provided with a healthy relationship,
        lead them into the Image of God,make them feel
        the unconditional Love and help them develop their lives as a total person: Body, Soul, and Spirit. 
    </p>
    <div className="mt-5 text-right">
      <p className="text-xs text-neutral-400">— MSCI</p>
    </div>
   </div>
   </div>
      </div>
   
</div>

<div id='contact' className ="relative">
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
                <span className='text-gray-700 '>{item.question}</span>
                <span className='text-xl text-white bg-neutral-400 w-8 h-8 flex justify-center rounded-full flex-shrink-0'>{openIndex === index ? "−" : "+"}</span>
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
         {/* <div className='flex flex-col tablet:flex-row gap-5 items-center mt-8'>
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
         </div> */}
         
        </div>
      </div>
</div>


<footer className="bg-[#2D5B60] text-white pt-16 pb-6">
  <div className="max-w-7xl mx-auto px-6 lg:px-8">
    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-12 pb-12 border-b border-white/10">
      
      {/* 1. School Identity */}
      <div className="col-span-1 lg:col-span-1">
        <h2 className="text-xl font-bold tracking-tight mb-4 border-l-4 border-blue-600 pl-3">
          MYRTLE CHRISTIAN<br/>SCHOOL
        </h2>
        <p className="text-gray-400 text-sm leading-relaxed mb-6">
          Established to provide holistic Christian education, empowering students to lead with faith and excellence.
        </p>
      </div>

      {/* 2. Contact Information */}
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wider mb-5 text-blue-500">Contact Us</h3>
        <div className="space-y-4 text-sm text-gray-300">
          <div className="flex flex-col gap-1">
            <span className="text-gray-400 text-xs font-medium uppercase">Address</span>
            <p>Purok 1, Hacienda de Ortube, Irosin, Sorsogon, 4707</p>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-gray-400 text-xs font-medium uppercase">Phone</span>
            <p className="hover:text-white transition-colors">+63 991 910 7871</p>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-gray-400 text-xs font-medium uppercase">Email</span>
            <p className="hover:text-white transition-colors font-medium">admin@myrtlechristian.edu.ph</p>
          </div>
        </div>
      </div>

      {/* 3. Quick Links (Standard sa School Sites) */}
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wider mb-5 text-blue-500">Academic Portal</h3>
        <ul className="space-y-3 text-sm text-gray-300">
          <li><a href="#" className="hover:text-white transition-colors">Admissions</a></li>
          <li><a href="#" className="hover:text-white transition-colors">School Calendar</a></li>
          <li><a href="#" className="hover:text-white transition-colors">Student Portal</a></li>
          <li><a href="#" className="hover:text-white transition-colors">Faculty Directory</a></li>
        </ul>
      </div>

      {/* 4. Support & Transparency */}
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wider mb-5 text-blue-500">Information</h3>
        <ul className="space-y-3 text-sm text-gray-300">
          <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
          <li><a href="#" className="hover:text-white transition-colors">Terms of Use</a></li>
          <div className='flex gap-2 items-center'>
          <img className='w-20' src={logo} alt="" />
          <img className='w-20 bg-white p-2' src={DepedLogo} alt="" />
          </div>
        </ul>
      </div>

    </div>

    {/* Bottom Bar */}
    <div className="mt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-[11px] text-gray-300 font-medium uppercase tracking-[2px]">
      <p>© {new Date().getFullYear()} Myrtle Christian School. All Rights Reserved.</p>
      <div className="flex gap-6 italic">
        "Nurturing Faith, Building Future"
      </div>
    </div>
  </div>
</footer>

</div>
    </>
  )
}

export default Landing