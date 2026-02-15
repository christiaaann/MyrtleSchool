import React, { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../services/firebase';
import { onAuthStateChanged } from "firebase/auth";
import deaf from '../../assets/default.png'
import gmail from '../../assets/icons/gmail.png'
import logo from '../../assets/logo.png'
import deped from '../../assets/DepEDLogo.png'
const Enrollment = () => {
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUserData(docSnap.data());
        } else {
          console.log("No such user!");
        }
      }
    });

    return () => unsubscribe();
  }, []);

  if (!userData) return <p>Loading...</p>;

  return (
    // <div className="flex flex-col items-center mt-4 gap-4">
    //   <img
    //     src={userData.profilePicture || deaf}
    //     alt="Profile"
    //     className="w-24 h-24 rounded-full object-cover"
    //   />
    //   <h2 className="text-lg font-semibold">{userData.fullname}</h2>
    //   <p>{userData.address}</p>
    //   <p>{userData.email}</p>
    // </div>
    <>
    <div className=' flex min-h-screen p-5 bg-gray-200'>
      
      {/* SIDEBAR */}
      <div className=' flex bg-gray-100 w-full p-5 rounded-lg'>
      <aside className="w-64 bg-white justify-center rounded-s-lg text-neutral-400 flex flex-col">
        <div className=" flex gap-3 p-4 text-[13px] font-semibold text-black">
         <img className='w-12 h-12 rounded-full object-cover' src={userData.profilePicture ||deaf} alt="" />
         <div className=''>
           <h1 className=' text-xl'>{userData.fullname}</h1>
           <div className='flex items-center gap-2'>
           <img className='w-5 h-5' src={gmail} alt="" />
           <h1>{userData.email}</h1>
          </div>
         </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <a href="#" className="block px-4 py-1 rounded-full hover:bg-neutral-200">
            Home
          </a>
          <a href="#" className="block px-4 py-1 rounded-full hover:bg-neutral-200">
            Students
          </a>
          <a href="#" className="block px-4 py-1 rounded-full hover:bg-neutral-200">
            Enrollment
          </a>
          <a href="#" className="block px-4 py-1 rounded-full hover:bg-neutral-200">
            Settings
          </a>
        </nav>

       
      </aside>

      {/* MAIN AREA */}
      <div className="flex-1 flex flex-col">
        
        {/* TOP NAVBAR */}
        <header className="h-16 bg-white rounded-e-lg flex items-center justify-between px-6">
          <h1 className="text-xl font-semibold text-gray-700">
            Home
          </h1>

          <div className="flex items-center gap-3">
            <img
              src={logo}
              alt="profile"
              className="w-10 h-10 rounded-full"
            />
             <img
              src={deped}
              alt="profile"
              className="w-10 h-10 object-contain"
            />
          </div>
        </header>

        {/* CONTENT */}
        {/* <main className="flex-1 p-6 overflow-y-auto">
          <div className="bg-white p-6 rounded-xl shadow">
            <h2 className="text-lg font-semibold mb-2">
              Welcome 👋
            </h2>
            <p className="text-gray-600">
              Ito ang content ng dashboard mo.
            </p>
          </div>
        </main> */}

      </div></div>
    </div>

    </>
  );
};

export default Enrollment;
