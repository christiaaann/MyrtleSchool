import React, { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../services/firebase';
import { onAuthStateChanged } from "firebase/auth";
import deaf from '../../assets/default.png'
import gmail from '../../assets/icons/gmail.png'
import logo from '../../assets/logo.png'
import deped from '../../assets/DepEDLogo.png'
import { useNavigate } from 'react-router-dom';
const Enrollment = () => {
  
  // dropdown menu
  const [isOpen, setIsOpen] = useState(false);
  const toggleDropdown = () => setIsOpen(!isOpen);
  const [open, setOpen] = useState(false);

  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();

  const  handlelogout =async () => {
    try {
     await auth.signOut();
     navigate("/auth")
    }catch (error){
      console.log("Logout failed",error);
    }
  };
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
    
    <div className='min-h-screen bg-gray-200'>
     <header className=' bg-white flex items-center gap-5 p-2'>
      <img className='w-12 object-contain drop-shadow-lg' src={logo} alt="" />
      <h1 className=' font-semibold text-neutral-800'>Myrtle Christian School</h1>

      <div className="relative">
      <button
        id="dropdownInformationButton"
        onClick={toggleDropdown}
        className="inline-flex bg-neutral-200 px-10 py-2 text-[#2D5B60] font-semibold items-center justify-center"
        type="button"
      >
        Application
        <svg
          className="w-4 h-4 ms-1.5 -me-0.5"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          fill="none"
          viewBox="0 0 24 24"
        >
          <path
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="m19 9-7 7-7-7"
          />
        </svg>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div
          id="dropdownInformation"
          className="z-10 absolute p-1 bg-white rounded-lg mt-4 shadow-lg w-72"
        >
          <ul className="text-body font-medium">
            <li>
              <a
                href="#"
                className=" block p-2 py-2 w-full hover:bg-[#2D5B60] hover:text-white"
              >
              Personal Info
              </a>
            </li>
            <li>
              <a
                href="#"
                className=" block p-2 py-2 w-full hover:bg-[#2D5B60] hover:text-white"
              >
                Children
              </a>
            </li>
          <li>
              <a
                href="#"
                className=" block p-2 py-2 w-full hover:bg-[#2D5B60] hover:text-white"
              >
                Archive
              </a>
            </li>
          </ul>
        </div>
      )}
    </div> 

   <div className="absolute right-2">
      <div className="flex items-center px-2.5 p-2 space-x-1.5 text-sm bg-neutral-secondary-strong rounded">
        
        <img
          className="border rounded-full w-10 h-10 object-cover"
          src={userData.profilePicture || deaf}
          alt="profile"
        />

        <div className="text-sm">
          <div className="font-medium text-heading">
            {userData.fullname || null }
          </div>
          <div className="truncate text-body">
            {userData.email || null}
          </div>
        </div>

        {/* Button */}
        <button
          onClick={() => setOpen(!open)}
          className="bg-brand-softer border border-brand-subtle text-fg-brand-strong text-xs font-medium px-2 py-1 rounded ms-auto"
        >
          View
        </button>
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-2 w-40 bg-white border rounded shadow-lg">
          <ul className="text-sm">
            <li>
              <button className="block w-full text-left px-3 py-2 hover:bg-gray-100">
                Profile
              </button>
            </li>
            <li>
              <button className="block w-full text-left px-3 py-2 hover:bg-gray-100">
                Settings
              </button>
            </li>
            <li>
              <button onClick={handlelogout} className="block w-full text-left px-3 py-2 hover:bg-gray-100 text-red-500">
                Logout
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
     </header>

    </div>

    </>
  );
};

export default Enrollment;
