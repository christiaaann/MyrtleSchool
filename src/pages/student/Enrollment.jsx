import React, { useEffect, useState } from 'react';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../services/firebase';
import { onAuthStateChanged } from "firebase/auth";
import deaf from '../../assets/default.png'
import gmail from '../../assets/icons/gmail.png'
import logo from '../../assets/logo.png'
import { useNavigate } from 'react-router-dom';
import user from '../../assets/icons/user.png'
import usericon from '../../assets/icons/usericon.png'
import archive from '../../assets/icons/archive.png'
import location from '../../assets/icons/location.png'

const Enrollment = () => {
  
  // dropdown menu
  const [isOpen, setIsOpen] = useState(false);
  const toggleDropdown = () => setIsOpen(!isOpen);
  const [open, setOpen] = useState(false);
  const [page, setpage] = useState("personal");
  const [level, setLevel] = useState("");
  const [grade, setGrade] = useState("");
  // const [phone, setPhone] = useState('');
  const [studentType, setStudentType] = useState("");
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();
  
  const handlelogout = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, {
          isOnline: false,
          lastActive: serverTimestamp()
        });
      }
      await auth.signOut();
      navigate("/auth");
    } catch (error) {
      console.log("Logout failed", error);
    }
  };

  useEffect(() => {
    const interval = setInterval(async () => {
      const user = auth.currentUser;
      if (user) {
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, {
          lastActive: serverTimestamp(),
          isOnline: true,
        });
      }
    }, 10000); 

    return () => clearInterval(interval);
  }, []); 

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setUserData(docSnap.data());
          await updateDoc(docRef, {
            lastActive: serverTimestamp(),
            isOnline: true,
          });

        } else {
          console.log("No such user!");
        }
      } else {
        navigate("/auth"); // redirect kapag walang user
      }
    });

    

    return () => unsubscribe();
  }, [navigate]);

     const fullAddress = [
     userData?.address?.purok,
     userData?.address?.barangay,
     userData?.address?.city,
     userData?.address?.province
     ]
     .filter(Boolean)
    .join(", ");

  if (!userData) return <p>Loading...</p>;

  return (
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
              <button onClick={() => {setpage("personal"); setIsOpen(true); }}
                className="flex items-center gap-2 w-full p-2 py-2  hover:bg-[#2D5B60] hover:text-white"
              ><img className='w-5' src={user} alt="" />
              Info
              </button>
            </li>
            <li>
              <button onClick={() => {setpage("children"); setIsOpen(false);}}
                className="flex items-center gap-2 p-2 py-2 w-full hover:bg-[#2D5B60] hover:text-white"
              ><img className='w-5' src={usericon} alt="" />
                Children
              </button>
            </li>
            <li>
              <button onClick={() => {setpage("archive"); setIsOpen(false); }}
                className="flex items-center gap-2 p-2 py-2 w-full hover:bg-[#2D5B60] hover:text-white"
              ><img className='w-5' src={archive} alt="" />
                Archive
              </button>
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
            {userData.parent.firstname || null } {userData.parent.middlename || null } {userData.parent.lastname || null }
          </div>
          <div className="truncate flex items-center gap-2 text-body">
            <img className='w-4' src={gmail} alt="" />
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

  <div className="min-h-screen bg-gray-100 text-gray-700 text-[15px] w-full p-5">
  {page === "personal" && (
    <div className='flex flex-col'>
      {/* Add Child Section */}
    <div className="bg-white p-6 border-t-8 border-[#2D5B60] rounded shadow ">
  <h2 className="text-xl font-semibold mb-4">Add Child</h2>

  <h2 className='flex items-center text-lg gap-2 font-semibold'>
    <img className='w-5' src={user} alt="" />Child Information
  </h2>

  <div className='flex gap-5 mt-2'>
    <div className='flex flex-col gap-1'>
      <h1 className='flex gap-1'><span className='text-red-600'>*</span>Firstname</h1>
      <input className='rounded-lg border outline-green-800 text-neutral-600 py-1 px-6' type="text" placeholder='e:g Juan' />
    </div>

    <div className='flex flex-col gap-1'>
      <h1 className='flex gap-1'><span className='text-red-600'>*</span>Middle</h1>
      <input className='rounded-lg border outline-green-800 text-neutral-600 py-1 px-6' type="text" placeholder='e:g Dela' />
    </div>

    <div className='flex flex-col gap-1'>
      <h1 className='flex gap-1'><span className='text-red-600'>*</span>Lastname</h1>
      <input className='rounded-lg border outline-green-800 text-neutral-600 py-1 px-6' type="text" placeholder='e:g Cruz' />
    </div>

    <div className="flex flex-col gap-1">
      <label className="flex gap-1">Suffix</label>
      <select className="border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-[#2D5B60]" defaultValue="none">
        <option value="none">None</option>
        <option value="Jr.">Jr.</option>
        <option value="Sr.">Sr.</option>
        <option value="III">III</option>
        <option value="IV">IV</option>
      </select>
    </div>
  </div>

  <div className='flex items-center mt-2 gap-5'>
    <div className="flex gap-1 flex-col w-56">
      <label className="flex gap-1"><span className="text-red-500">*</span>Age</label>
      <input type="number" placeholder="Age" min="0" max="120" className="border rounded-lg px-3 py-1" />
    </div>

    <div className="flex flex-col w-56">
      <label className="mb-1"><span className="text-red-500">*</span> Sex</label>
      <select className="border rounded-lg px-3 py-1" defaultValue="">
        <option value="" disabled>Select sex</option>
        <option value="Male">Male</option>
        <option value="Female">Female</option>
        <option value="Other">Other</option>
      </select>
    </div>

    {/* STUDENT TYPE */}
    <div className="flex flex-col w-56">
      <label className="mb-1"><span className="text-red-500">*</span> Student Type</label>
      <select
        className="border rounded-lg px-3 py-1"
        value={studentType}
        onChange={(e) => setStudentType(e.target.value)}
      >
        <option value="">Select type</option>
        <option value="New">New</option>
        <option value="Old">Old</option>
        <option value="Transferee">Transferee</option>
      </select>
    </div>

    {/* PREVIOUS SCHOOL — ONLY TRANSFEREE */}
    {studentType === "Transferee" && (
      <div className="flex flex-col w-96">
        <label className="mb-1">
          <span className="text-red-500">*</span> Previous School
        </label>
        <input
          type="text"
          placeholder="Enter previous school"
          className="border rounded-lg px-3 py-1"
        />
      </div>
    )}
  </div>

  <div className="flex gap-5 mt-2">
    {/* LEVEL */}
    <div className="flex flex-col w-56">
      <label className="mb-1"><span className="text-red-500">*</span> Level</label>
      <select
        className="border rounded-lg px-3 py-1"
        value={level}
        onChange={(e) => { setLevel(e.target.value); setGrade(""); }}
      >
        <option value="">Select level</option>
        <option value="Preschool">Preschool</option>
        <option value="Elementary">Elementary</option>
      </select>
    </div>

    {/* GRADE */}
    <div className="flex flex-col w-56">
      <label className="mb-1"><span className="text-red-500">*</span> Grade</label>
      <select
        className="border rounded-lg px-3 py-1"
        value={grade}
        onChange={(e) => setGrade(e.target.value)}
        disabled={!level}
      >
        <option value="">Select grade</option>

        {level === "Preschool" && (
          <>
            <option value="Nursery">Nursery</option>
            <option value="Preparatory">Preparatory</option>
            <option value="Kindergarten">Kindergarten</option>
          </>
        )}

        {level === "Elementary" && (
          <>
            <option value="Grade 1">Grade 1</option>
            <option value="Grade 2">Grade 2</option>
            <option value="Grade 3">Grade 3</option>
            <option value="Grade 4">Grade 4</option>
            <option value="Grade 5">Grade 5</option>
            <option value="Grade 6">Grade 6</option>
          </>
        )}
      </select>
    </div>
  </div>
</div>

      {/* Father Information */}
      <div className="bg-white p-6 border-t-8 border-[#2D5B60] rounded h-full shadow w-full mt-2">
        <h2 className='flex items-center text-lg gap-2 font-semibold'>
          <img className='w-5' src={user} alt="" /> Father Information
        </h2>

       <div className='flex gap-5 mt-2'>
      <div>
        <h1 className='flex gap-2'><span className='text-red-600'>*</span>Firstname</h1>
       <input className='rounded-lg border mt-1 px-3 py-1 w-56' type="text" value={userData.spouse.firstname} disabled />
      </div>
      <div>
       <h1 className='flex gap-2'><span className='text-red-600'>*</span>Middlename</h1>
       <input className='rounded-lg mt-1 border px-3 py-1 w-56' type="text" value={userData.spouse.middlename} disabled />
     </div>
     <div>
        <h1 className='flex gap-2'><span className='text-red-600'>*</span>Lastname</h1>
       <input className='rounded-lg mt-1 border px-3 py-1 w-56' type="text" value={userData.spouse.lastname} disabled />
      </div>
       </div>
       <div className='flex gap-5 mt-2'>
      <div>
       <h1 className='flex gap-2'><span className='text-red-600'>*</span>Occupation</h1> 
      <input className='rounded-lg border mt-1 px-3 py-1 w-56' type="text" value={userData.spouse.occupation} disabled />
      </div>
      <div>
      <h1 className='flex gap-2'><span className='text-red-600'>*</span>Contact Number</h1>
      <input className='rounded-lg border mt-1 px-3 py-1 w-56' type="text" value={userData.spouse.contact} disabled />
      </div>
      </div>
      </div>

      {/* Mother Information */}
      <div className="bg-white p-6 border-t-8 border-[#2D5B60] rounded h-full shadow w-full mt-2">
        <h2 className='flex items-center text-lg gap-2 font-semibold'>
          <img className='w-5' src={user} alt="" /> Mother Information
        </h2>

        <div className='flex gap-5 mt-2'>
          <div className='flex flex-col gap-1 w-56'>
            <label className="flex gap-1"><span className="text-red-600">*</span> Firstname</label>
            <input className='rounded-lg border outline-blue-800 text-neutral-600 py-1 px-6'
              type="text" value={userData.parent.firstname || ""} disabled />
          </div>
          <div className='flex flex-col gap-1 w-56'>
            <label className="flex gap-1"><span className="text-red-600">*</span> Middlename</label>
            <input className='rounded-lg border outline-blue-800 text-neutral-600 py-1 px-6'
              type="text" value={userData.parent.middlename || ""} disabled />
          </div>
          <div className='flex flex-col gap-1 w-56'>
            <label className="flex gap-1"><span className="text-red-600">*</span> Lastname</label>
            <input className='rounded-lg border outline-blue-800 text-neutral-600 py-1 px-6'
              type="text" value={userData.parent.lastname || ""} disabled />
          </div>
        </div>
        <div className=' flex gap-5 mt-3'>
        <div>
       <h1 className='flex gap-2'><span className='text-red-600'>*</span>Occupation</h1> 
      <input className='rounded-lg border mt-1 px-3 py-1 w-56' type="text" value={userData.parent.occupation} disabled />
      </div>
       <div>
      <h1 className='flex gap-2'><span className='text-red-600'>*</span>Contact Number</h1>
      <input className='rounded-lg border mt-1 px-3 py-1 w-56' type="text" value={userData.parent.contact} disabled />
      </div>
     </div>
      </div>
      <div className="bg-white mt-2 p-6 border-t-8 border-[#2D5B60] rounded shadow w-full">
      <h2 className='flex items-center text-lg gap-2 font-semibold'>
      <img className='w-5' src={location} alt="" />Full Address
     </h2>

     <div className='mt-2'>
    <input
      className='rounded-lg border px-3 py-1 w-full'
      type="text"
      value={fullAddress}
      disabled
     />
    </div>
    </div>

      <div className=' bg-white flex justify-end w-full p-2 mt-2'>
        <button className=' bg-[#2D5B60] text-white px-10 py-2 rounded-lg font-semibold'>NEXT</button>
      </div>
    </div>
  )}

  {page === "children" && (
   <div>
    <h1>Children</h1>
   </div>
  )}
  
  {page === "archive" && (
    <div className="bg-white p-6 rounded shadow w-full">
      <h2 className="text-xl font-semibold mb-4">Archive</h2>
      <p>Archive</p>
    </div>
  )}
  </div>
 </div>
  );
};

export default Enrollment;
