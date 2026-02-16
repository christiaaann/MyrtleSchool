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
     <nav className=''>hello</nav>
    </div>

    </>
  );
};

export default Enrollment;
