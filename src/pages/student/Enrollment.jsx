import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { doc, getDoc,
         updateDoc, 
         serverTimestamp, 
         setDoc, collection, 
         query, where, 
         getDocs,
         onSnapshot
         } from 'firebase/firestore'; 
import { db, auth } from '../../services/firebase';
import { onAuthStateChanged } from "firebase/auth";
import { sileo } from 'sileo';
import EnrollmentArchive from './EnrollmentArchive';
import { useLocation } from 'react-router-dom';
import plus from '../../assets/icons/plus.png'
import deaf from '../../assets/default.png'
import logo from '../../assets/logo.png'

import { Archive,
      BookOpenCheck, 
      Check, 
      ChevronDown, 
      CreditCard, 
      FileUser,
      LogOut,
      Menu,
      Settings,
      User,
      UserPen } from 'lucide-react';
import FloatingInput from '../../components/FloatingInput';
import FloatingSelect from '../../components/FloatingSelect';
import UploadBox from '../../components/UploadBox';
import { useTheme } from '../../components/ThemeContext';
const Enrollment = () => {
    // --- ALL ORIGINAL STATES PRESERVED ---
    const [isOpen, setIsOpen] = useState(false);
    const toggleDropdown = () => setIsOpen(!isOpen);
    const [open, setOpen] = useState(false);
    const [setpage, setPage] = useState("personal");
    const [level, setLevel] = useState("");
    const [grade, setGrade] = useState("");
    const [studentType, setStudentType] = useState("");
    const [userData, setUserData] = useState(null);
    const navigate = useNavigate();
     const { darkMode, toggleTheme } = useTheme();

    const [childFirst, setChildFirst] = useState("");
    const [childMiddle, setChildMiddle] = useState("");
    const [childLast, setChildLast] = useState("");
    const [suffix, setSuffix] = useState("none");
    const [birthDate, setBirthDate] = useState("");
    const [age, setAge] = useState("");
    const [sex, setSex] = useState("");
    const [prevSchool, setPrevSchool] = useState("");

    const [files, setFiles] = useState({ birthCert: null, reportCard: null, idPicture: null });
    const [paymentMethod, setPaymentMethod] = useState("");
    const [paymentProof, setPaymentProof] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [myStudents, setMyStudents] = useState([]);
    const [editingStudent, setEditingStudent] = useState(null);
    const [currentSY, setCurrentSY] = useState("");
   
    const location = useLocation();
    const [errors, setErrors] = useState({});
    
    //  === Validations For Stepper 1 ====
    const validateStep1 = () => {
    const newErrors = {};
    if (!childFirst.trim()) newErrors.childFirst = "First name is required";
    if (!childLast.trim()) newErrors.childLast = "Last name is required";
    if (!age) newErrors.age = "Age is required";
    if (!sex) newErrors.sex = "Sex is required";
    if (!studentType) newErrors.studentType = "Student type is required";
    if (!level) newErrors.level = "Level is required";
    if (!grade) newErrors.grade = "Grade is required";

    if (studentType === "Transferee" && !prevSchool.trim()) {
        newErrors.prevSchool = "Previous school is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
    };

    // === Validations For Stepper 2 ===
    const validateStep2 = () => {
    const newErrors = {};
    if (!files.idPicture) newErrors.idPicture = "Upload 2x2 Picture";
    if (!files.birthCert) newErrors.birthCert = "Upload Birth Certificate";

    // optional: Report Card required lang if studentType != New
    if ((studentType === "Old" || studentType === "Transferee") && !files.reportCard) {
        newErrors.reportCard = "Upload Report Card";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
    };

    const validateStep3 = () => {
    const newErrors = {};
    if (!paymentMethod) {
    newErrors.paymentMethod = "Please select payment method";
    }
    if (paymentMethod === "GCash" && !paymentProof) {
    newErrors.paymentProof = "Please upload proof of payment";
    }

  setErrors(newErrors);

  return Object.keys(newErrors).length === 0;
};

    // ==== stepper ====
    const [step, setStep] = useState(1);
    const totalSteps = 3;
    const nextStep = () => {
    if (step === 1) {
    if (!validateStep1()) return; // STOP kung may error
    }
    
    if (step === 2) {
    if (!validateStep2()) return; // check lahat ng files
    }
    if (step === 3) {
    if (!validateStep3()) return; // check if user upload payment proof
    }
   if (step < totalSteps) setStep(step + 1);
   };

    useEffect(() => {
    if (location.state?.loginSuccess) {
        sileo.success({
        title: "Login Successful",
        fill: "black",
        styles: { description: "text-white" }
        });

        navigate(location.pathname, { replace: true, state: {} });
    }
    }, []);

    // birthday automatic
useEffect(() => {
  if (!birthDate) return;

  const today = new Date();
  const birth = new Date(birthDate);

  let ageCalc = today.getFullYear() - birth.getFullYear();

  const monthDiff = today.getMonth() - birth.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birth.getDate())
  ) {
    ageCalc--;
  }

  if (ageCalc < 0) ageCalc = 0;

  setAge(ageCalc);
}, [birthDate]);
    
    
    // === previous ====
    const prevStep = () => {
    if (step > 1) setStep(step - 1);
    };
  
    // ====== Grade level Options ======
  const gradeOptions =
    level === "Preschool"
      ? ["Nursery", "Kinder"]
      : level === "Elementary"
      ? ["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6"]
      : [];

        // ==== if user not complete back to complete profile ====
        useEffect(() => {
        const checkProfile = async () => {
            if (!auth.currentUser) return;

            const docSnap = await getDoc(doc(db, "users", auth.currentUser.uid));
            if (docSnap.exists()) {
            const data = docSnap.data();

            const isProfileComplete =
                data.parent?.firstname &&
                data.parent?.lastname &&
                data.address?.barangay &&
                data.address?.city &&
                data.address?.province &&
                // === spouse is optional: check only if it exists ===
                (!data.spouse || (data.spouse.firstname && data.spouse.lastname));

                if (!isProfileComplete) {
                navigate("/completeprofile", { replace: true });
                }
                } else {
                navigate("/completeprofile", { replace: true });
                }
                };checkProfile();
                }, [navigate]);
                
                // For Calculations ===
                const tuitionFees = {
                    "Preschool": { 
                        registration: 500, misc: 1000, books: 2500, instructional: 500, uniform: 1500, pta: 200,
                        monthlyRate: 900,
                        months: ["JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC", "JAN", "FEB", "MAR"]
                    },
                    "Elementary": { 
                        registration: 500, misc: 2000, books: 2500, instructional: 700, uniform: 1500, pta: 200,
                        monthlyRate: 1100,
                        months: ["JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC", "JAN", "FEB", "MAR"]
                    }
                };

                // --- ALL ORIGINAL LOGIC PRESERVED ---
                useEffect(() => {
                    const settingsRef = doc(db, "settings", "schoolYear");
                    const unsub = onSnapshot(settingsRef, (snap) => {
                        if (snap.exists()) setCurrentSY(snap.data().active);
                    });
                    return () => unsub();
                }, []);

    
    
                useEffect(() => {
        let interval;
        const startOnlineTracking = async (user) => {
            const userRef = doc(db, "users", user.uid);
            await updateDoc(userRef, { isOnline: true, lastActive: serverTimestamp() });
            interval = setInterval(async () => {
                await updateDoc(userRef, { isOnline: true, lastActive: serverTimestamp() });
            }, 20000);
        };
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) startOnlineTracking(user);
        });
        return () => { if (interval) clearInterval(interval); unsubscribe(); };
    }, []);

    const fetchMyStudents = async (uid) => {
        try {
            const q = query(collection(db, "students"), where("parentUID", "==", uid));
            const snap = await getDocs(q);
            const studentList = await Promise.all(snap.docs.map(async (studentDoc) => {
                const studentData = studentDoc.data();
                const enrDoc = await getDoc(doc(db, "enrollments", `ENR-${currentSY}-${studentData.studentID}`));
                return {
                    ...studentData,
                    paymentMethod: enrDoc.exists() ? enrDoc.data().payment.method : "N/A",
                    paymentStatus: enrDoc.exists() ? enrDoc.data().payment.status : "N/A",
                    receiptUrl: enrDoc.exists() ? enrDoc.data().payment.proofImage : ""
                };
            }));
            setMyStudents(studentList);
        } catch (error) { console.error("Error fetching students:", error); }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                const docSnap = await getDoc(doc(db, "users", user.uid));
                if (docSnap.exists()) {
                    setUserData(docSnap.data());
                    fetchMyStudents(user.uid);
                }
            } else { navigate("/auth"); }
        });
        return () => unsubscribe();
    }, [navigate, currentSY]);

    const uploadToCloudinary = async (file) => {
        if (!file) return "";
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
        try {
            const res = await fetch(`https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`, {
                method: "POST", body: formData,
            });
            const data = await res.json();
            return data.secure_url;
        } catch (err) { console.error(err); return ""; }
    };

    const handleAddNewChild = () => {
        // I-reset ang lahat ng inputs
        setChildFirst(""); 
        setChildMiddle(""); 
        setChildLast(""); 
        setSuffix("none");
        setAge("");
        setBirthDate(""); 
        setSex(""); 
        setPrevSchool(""); 
        setLevel(""); 
        setGrade("");
        setStudentType(""); 
        setFiles({ birthCert: null, reportCard: null, idPicture: null });
        setPaymentMethod(""); 
        setPaymentProof(null); 
        setEditingStudent(null);
        setStep(1);
        setPage("personal"); 
    };

const handleSubmitEnrollment = async () => {

  // 🔴 FINAL VALIDATION BLOCK (DITO ILALAGAY)
  const step1Valid = validateStep1();
  const step2Valid = validateStep2();
  const step3Valid = validateStep3();

  if (!step1Valid || !step2Valid || !step3Valid) {
    await sileo.error({
      title: "Missing Requirements",
      description: "Please complete all required fields before submitting",
      fill: "black",
      styles: { description: "text-white/75" }
    });
    return;
  }

  //  ONLY PROCEED IF VALID
  setIsSubmitting(true);

  const submitEnrollment = async () => {
    const studentID = editingStudent
      ? editingStudent.studentID
      : `${currentSY}-${childLast[0].toUpperCase()}${childFirst[0].toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

    const [birthUrl, cardUrl, picUrl, gcashUrl] = await Promise.all([
      uploadToCloudinary(files.birthCert),
      uploadToCloudinary(files.reportCard),
      uploadToCloudinary(files.idPicture),
      uploadToCloudinary(paymentProof)
    ]);

    await setDoc(doc(db, "students", studentID), {
      studentID,
      parentUID: auth.currentUser.uid,
      firstname: childFirst,
      middlename: childMiddle,
      lastname: childLast,
      suffix,
      level,
      grade,
      birthDate,
      age: Number(age),
      sex,
      studentType,
      previousSchool: studentType === "Transferee" ? prevSchool : "",
      isEnrolled: false,
      status: "Pending",
      requirements: {
        birthCert: birthUrl,
        reportCard: cardUrl,
        idPicture: picUrl
      },
      address: userData.address,
      father: userData.spouse,
      mother: userData.parent,
      schoolYear: currentSY,
      createdAt: serverTimestamp()
    });

    await setDoc(doc(db, "enrollments", `ENR-${currentSY}-${studentID}`), {
      studentID,
      parentUID: auth.currentUser.uid,
      schoolYear: currentSY,
      fees: tuitionFees[level],
      monthlyTracking: tuitionFees[level].months.reduce((acc, month) => {
        acc[month] = {
          status: "Unpaid",
          amount: tuitionFees[level].monthlyRate
        };
        return acc;
      }, {}),
      payment: {
        method: paymentMethod,
        proofImage: gcashUrl,
        status: "Pending",
        dateEnrolled: serverTimestamp()
      }
    });
  };

  try {
    await sileo.promise(submitEnrollment(), {
      loading: { title: "Submitting Enrollment..." },
      success: {
        title: "Enrollment Successful",
        description: `Pending Admin Approval for S.Y. ${currentSY}`,
        fill: "black"
      },
      error: { title: "Enrollment Failed" }
    });

    fetchMyStudents(auth.currentUser.uid);
    
    // reset form
    handleAddNewChild();
    
    setPage("archive");

  } finally {
    setIsSubmitting(false);
  }
};

    if (!userData) return <p className='text-center mt-20 font-bold animate-pulse text-gray-400'>Loading MCS Portal...</p>;

    const fullAddress = `${userData.address.purok}, ${userData.address.barangay}, ${userData.address.city}, ${userData.address.province}`;

    return (
        <div className=' dark:bg-black bg-white font-sans text-[#2D3748]'>
            
            {/* Minimal Header */}
            <header className='bg-white dark:bg-black  z-20 px-8 py-4 flex items-center justify-between border-b dark:border-b-neutral-800 border-gray-100 sticky top-0 shadow-sm'>
            <div className='flex items-center gap-6'>
            <div className='flex items-center gap-3'>
            {/* === menu mobile ==== */}
            <button className=" z-50 tablet:hidden" onClick={() => setIsOpen(!isOpen)}>
            <Menu className="w-6 h-6 dark:text-neutral-400" />
            </button> 
            
            <img className='w-10' src={logo} alt="Logo" />
            
            <div className=''>
            <h1 className='text-sm text-nowrap dark:text-gray-500 font-black tracking-tight text-gray-800 uppercase'>Myrtle Christian School</h1>
            <p className='text-[10px] text-green-950 dark:text-white font-bold tracking-widest uppercase'>Parent Portal</p>
            </div>
            </div>
            </div>


            {/* <div className='flex items-center gap-4'>
            <div className='text-right'>
            <p className='text-xs font-bold'>{userData.parent?.firstname} {userData.parent?.lastname}</p>         
            </div>
            <img onClick={() => setOpen(!open)} className="w-10 h-10 rounded-full border-2 border-white shadow-md cursor-pointer hover:scale-105 transition-transform"
            src={userData.profilePicture || deaf} alt="User Profile"
            referrerPolicy="no-referrer" 
            crossOrigin="anonymous"
            />
                   
            {open && (
            <div className="absolute top-16 right-8 bg-white shadow-2xl border rounded-xl p-2 w-40 animate-in fade-in zoom-in-95">
            <button onClick={async () => { await auth.signOut(); navigate("/auth"); }} className="text-red-500 text-xs font-bold w-full text-left px-4 py-3 hover:bg-red-50 rounded-lg">Logout Account</button>
            </div>
            )}
           </div> */}
          
          {/* darkmode toggle */}
        <label className="switch">
          <input
            type="checkbox"
            checked={darkMode}
            onChange={toggleTheme}
          />
          <span className="slider">
            <svg
              className="slider-icon"
              viewBox="0 0 32 32"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path fill="none" d="m4 16.5 8 8 16-16"></path>
            </svg>
          </span>
        </label>
          </header> 
            <div className="flex ">
      

          {/* SIDEBAR / TABS */}
          {/* MOBILE OVERLAY */}
                {isOpen && (
                  <div
                    className="fixed inset-0 bg-black/30 z-30 tablet:hidden"
                    onClick={() => setIsOpen(false)}
                  ></div>
                )}

                {/* SIDEBAR */}
                <div
                  className={`
                    fixed top-0 left-0 min-h-screen w-64 bg-white dark:bg-black dark:text-white p-8 shadow-lg z-40
                    transform transition-transform duration-300
                    ${isOpen ? "translate-x-0" : "-translate-x-full"} 
                    md:translate-x-0 md:relative md:flex md:flex-col md:w-[13rem] tablet:hidden
                  `}
                >
                  <h1>Child</h1>
                  <div className='flex flex-col gap-2'>
                  <button
                     className={`px-6 flex gap-2 w-full items-center py-2 rounded-2xl transition-all
                   ${setpage === "personal" ? "bg-gray-100 dark:bg-neutral-900" : "hover:bg-gray-100 hover:dark:bg-neutral-900"}
                    `}
                    onClick={() => {
                    setPage("personal");
                    setIsOpen(false);
                    }}
                  >
                    <FileUser className='w-5 h-5'/> Enrollment
                  </button>

                  <button
                     className={`px-6 flex gap-2 w-full items-center py-2 rounded-2xl transition-all
                    ${setpage === "archive" ? "bg-gray-100 dark:bg-neutral-900" : "hover:bg-gray-100 hover:dark:bg-neutral-900"}
                     `}
                    onClick={() =>{
                    setPage("archive");
                    setIsOpen(false);
                    }}
                  >
                    <Archive className='w-5 h-5'/> Records
                  </button>
                  </div>
                  
                  <h1>Account</h1>
                  <div className=' flex flex-col'>
                  <button className=' px-6 py-2 flex gap-2 rounded-2xl hover:bg-gray-100 hover:dark:bg-neutral-900'><User/>Profile</button>
                  <button className='flex gap-2 px-6 py-2  rounded-2xl'><Settings/>Settings</button>
                  </div>
                  <div className='flex  absolute bg-gray-100 dark:bg-neutral-900 rounded-2xl gap-2 bottom-2  items-center px-6 py-1 w-ful'>
                  <img className='w-8 h-8 rounded-full' src={userData.profilePicture} alt="" />
                  <p className='text-xs text-nowrap font-bold'>{userData.parent?.firstname} {userData.parent?.lastname}</p>   
                  <button onClick={async () => { await auth.signOut(); navigate("/auth"); }} className=" text-red-600"><LogOut/></button>
               </div> 
                </div>
 
                {/* (TABS MENU) --- */}
                <div className='p-5 hidden dark:text-neutral-700 tablet:block tablet:sticky tablet:top-20 tablet:h-[calc(100vh-5rem)] relative '>
                <div className='w-[15rem] gap-2'>
                 <h1 className='font-semibold'>Child</h1>  
                 <div className='flex flex-col mt-1 gap-1'>

                <button className={`px-6 flex gap-2 w-full dark:text-white  items-center py-2 rounded-2xl transition-all duration-200 ease-out
                 ${setpage === "personal" ? "bg-gray-100 dark:bg-neutral-900 scale-[0.98]" : "hover:bg-gray-100 hover:dark:bg-neutral-900"}`}
                 onClick={() => setPage("personal")}>
                 <FileUser/>
                 Enrollment
                 </button>

                <button   className={`px-6 flex gap-2 w-full dark:text-white items-center py-2 rounded-2xl transition-all  duration-200 ease-out  
                 ${setpage === "archive" ? "bg-gray-100 dark:bg-neutral-900 scale-[0.98]" : "hover:bg-gray-100 hover:dark:bg-neutral-900"}
                 `}
                onClick={() => setPage("archive")}
                ><Archive/>
                 Records
                </button>
                </div> 

              <h1 className=' mt-2 font-semibold'>Account</h1>
              <div className='flex gap-1 flex-col'>
                  <button className='px-6 hover:bg-gray-100 hover:rounded-2xl hover:dark:bg-neutral-900 flex items-center gap-2 py-2 dark:text-white'><User/>Profile</button>
               
              <button className='px-6 dark:text-white py-2 flex items-center gap-2'
               onClick={() => setOpen(!open)}
               >
              <Settings/>Settings
              <ChevronDown className='text-white'/>
              </button>

              {open && (
                <div className='flex ml-8 flex-col justify-end '>
                <NavLink
                to=""
                className="px-6 hover:bg-gray-100 py-2 rounded-2xl"
                >
                Personal Details  
                </NavLink>
                
                <NavLink
                to=""
                className="px-6 hover:bg-gray-100 py-2 rounded-2xl"
                >
                Change Password
                </NavLink>
                </div>
              )}
               
                </div>
                </div>
                <div className='flex absolute bottom-3 w-[15rem] items-center justify-center px-6 py-1 rounded-2xl bg-gray-100 dark:text-white dark:bg-neutral-900 gap-2'> 
                <img className='w-8 h-8 rounded-full' src={userData.profilePicture} alt="" />
                  <h1 className='text-nowrap'>{userData.parent ?. firstname} {userData.parent ?. lastname}</h1> 
                  <button onClick={async () => { await auth.signOut(); navigate("/auth"); }} className=" text-red-600">
                 <LogOut/>
                 </button>
                 </div>
                </div>
                {setpage === "archive" ? (
                    <EnrollmentArchive {...{setpage, 
                        myStudents, 
                        handleAddNewChild, 
                        setChildFirst, 
                        setChildMiddle,
                        setChildLast, 
                        setSuffix, 
                        setAge, 
                        setSex, 
                        setStudentType, 
                        setPrevSchool, 
                        setLevel, 
                        setGrade, 
                        setFiles, 
                        setPaymentMethod, 
                        setEditingStudent, 
                        setPage}} />
                ) : (
        <div className='space-y-2 animate-in  w-full fade-in slide-in-from-bottom-4 duration-700 overflow-hidden'>
        {/* stepper */}
        <ol className="flex justify-between items-center mt-1 relative">
        {[1, 2, 3].map((s, i) => (
        <li key={s} className="relative flex-1 flex flex-col items-center">
                
        {/* Circle */}
        <span
        className={`w-8 h-8  rounded-full flex justify-center items-center text-sm z-10
        ${step === s ? "bg-green-950 text-white" : step > s ? "bg-green-600 text-white" : "bg-gray-50 border-2 border-gray-200 text-gray-600"}`}
        >
        {step > s ? (
        <Check className='w-4 h-4'/>
        ) : s === 1 ? (
        <UserPen className=' w-4 h-4'/>
        ) : s === 2 ? (
        <BookOpenCheck className='w-4 h-4'/>
        ) : (
        <CreditCard className='w-4 h-4'/>
        )}
        </span>

        {/* Connecting line */}
        {i < 2 && (
        <div className="absolute top-4 left-1/2  border dark:border-neutral-900 w-full bg-gray-300 z-0"></div>
        )}

        {/* Step Content */}
        <div className="text-center mt-6">
        <h4 className={`tablet:text-base mb-1 text-sm text-nowrap ${step >= s ? "text-green-600" : "text-gray-900 dark:text-neutral-600"}`}>
        {s === 1 && "Child Info"}
        {s === 2 && "Upload Requirements"}
        {s === 3 && "Payment"}
        </h4>
        <p className="text-sm text-gray-600 max-w-xs">
        {s === 1 && ""}
        {s === 2 && ""}
        {s === 3 && ""}
        </p>
        </div>
        </li>
        ))}

        </ol>

        {/* FORM CONTENT */}
        <div className=' p-5'>
        {/* SECTION: CHILD */}
        { step === 1 && (
        <section>
        <div className='flex gap-2 items-center'>
        <div className='w-1 h-6 bg-green-950 rounded-full'></div>
        <h3 className='font-semibold uppercase tracking-widest text-sm dark:text-neutral-600'>Child Information</h3>
        </div>
                                
        <div className='flex flex-col tablet:flex-row gap-2'>
         <div className='flex flex-col w-full gap-2'>
         <label className='flex gap-2 dark:text-neutral-600'><span className='text-red-600'>*</span>First name</label>
         <FloatingInput
         type="text"
         label="First name"
         id="childFirst"
         value={childFirst} 
         onChange={(e)=>{
         setChildFirst(e.target.value);
         setErrors(prev => ({ ...prev, childFirst: ""}));  
         }} 
         />
         {errors.childFirst && (
         <p className="text-red-600 text-sm">{errors.childFirst}</p>
         )}
         </div>
            
         <div className='flex flex-col w-full gap-2'>
         <label className='flex gap-1 dark:text-neutral-600'>Middle Name</label>
         <FloatingInput
         type="text"
         label="Middle name"
         id="childMiddle"
         value={childMiddle} 
         onChange={(e)=>setChildMiddle(e.target.value)} />
         </div>
            
         <div className='flex flex-col w-full gap-2'>
         <label className='flex gap-1 dark:text-neutral-600'><span className='text-red-500'>*</span>Last Name</label>
         <FloatingInput
          type="text"
          label="Last name" 
          id="childLast"
          value={childLast} 
          onChange={(e)=>{
          setChildLast(e.target.value);
          setErrors(prev => ({ ...prev, childLast: ""}));
          }} 
          />
          {errors.childLast && (
            <p className="text-red-600 text-sm">{errors.childLast}</p>
          )}
          </div>
          </div>

          <div className='grid grid-cols-1 tablet:grid-cols-2 md:grid-cols-4 gap-6 mt-6'>
          <div className='flex flex-col gap-2'>
          <label className='text-neutral-600'>Suffix</label>
          <FloatingSelect
          id="suffix"
          label="Suffix"
          value={suffix}
          onChange={(e) => setSuffix(e.target.value)}
          options={["None", "Jr.", "Sr."]}
          />
          </div>
            
 <div className='flex flex-col gap-2'>
  <label className="flex gap-1 dark:text-neutral-600">
    <span className='text-red-600'>*</span>Birthday
  </label>

  <div
    className="relative w-full cursor-pointer"
    onClick={() => document.getElementById("birthdayInput").showPicker?.()}
  >
      
    <div className="w-full px-6 py-3 border border-neutral-300 dark:border-none rounded-xl bg-white dark:bg-neutral-900 dark:text-white">
      {birthDate ? birthDate : "Select birthday"}
    </div>

    {/* hidden input */}
    <input
      id="birthdayInput"
      type="date"
      value={birthDate}
      max={new Date().toISOString().split("T")[0]}
      onChange={(e) => {
        setBirthDate(e.target.value);
        setErrors(prev => ({ ...prev, age: "" }));
      }}
      className="absolute opacity-0 w-full h-full top-0 left-0 cursor-pointer"
    />
     </div>
    </div>

        <div className='flex flex-col gap-2'>
          <label className="dark:text-neutral-600 flex gap-1"><span className='text-red-600'>*</span>Age</label>

          <FloatingInput
            type="text"
            value={age}
            readOnly
            label="Age"
            disabled
          />
        </div>
                    
          <div className='flex flex-col gap-2'>
          <label className="flex gap-1 dark:text-neutral-600"><span className='text-red-600'>*</span>Sex</label>
          <FloatingSelect
          label="Select"
          id="sex"
          value={sex} 
          onChange={(e)=>{
          setSex(e.target.value);
          setErrors(prev => ({ ...prev, sex : ""}));
          }}
          options={["Male", "Female"]}
          />
          {errors.sex && (
          <p className="text-red-600 text-sm">{errors.sex}</p>
          )}
          </div>
          
          <div className='flex items-center'>
          <div className='flex w-full flex-col gap-2'>
          <label className="flex gap-1 dark:text-neutral-600"><span className='text-red-600'>*</span>Student Type</label>
          <FloatingSelect 
          label="Select"
          value={studentType} 
          onChange={(e) => {
          setStudentType(e.target.value);
          setErrors(prev => ({...prev, studentType: ""}))
          }}
          options={["New Student", "Old", "Transferee"]}
          />
          {errors.studentType && (
          <p className="text-red-600 text-sm">{errors.studentType}</p>
          )}
         </div>
         </div>
          
          {/* ==== previous school ===== */}
          {studentType === "Transferee" && (
          <div className='flex flex-col gap-2'>
          <label className='flex gap-1 dark:text-neutral-600'><span className='text-red-600'>*</span>Previous School Attended</label>
          <FloatingInput 
          type="text" 
          id="prevSchool"
          label="Previous School"
          value={prevSchool} 
          onChange={(e) => {
          setPrevSchool(e.target.value);
          setErrors(prev => ({...prev, prevSchool : ""}));
          }} 
          />
          {errors.prevSchool && (
          <p className="text-red-600 text-sm">{errors.prevSchool}</p>  
          )}
          </div>
          )}
</div>
          <div className='flex gap-5 mt-5'>
          <div className='flex flex-col w-full gap-2'>
          <label className='flex gap-1 dark:text-neutral-600'><span className='text-red-600'>*</span>Level</label>
          <FloatingSelect 
          label="Select"
          id="level"
          value={level} 
          onChange={(e) => {setLevel(e.target.value); 
          setGrade("");
          setErrors (prev =>({...prev, level: ""}));
          }}
          options={["Preschool", "Elementary"]}
          />
          {errors.level && (
          <p className="text-red-600 text-sm">{errors.level}</p>  
          )}
         </div>

         <div className='flex flex-col w-full gap-2'>
         <label className='flex gap-1 dark:text-neutral-600'><span className='text-red-600'>*</span>Grade</label>
         <FloatingSelect 
         label="select"
         id="grade"
         value={grade} 
         onChange={(e) => {
         setGrade(e.target.value);
         setErrors (prev => ({...prev, grade : ""}));   
         }}
         disabled={!level}
         options={gradeOptions}
         />
         {errors.grade && (
         <p className="text-red-600 text-sm">{errors.grade}</p>   
         )}
         </div>
         </div>
         </section>
         )}
        
         {/* Upload Requirments */}
         { step === 2 && (
         <section className="space-y-4">
         <h3 className="font-bold text-slate-700 dark:text-neutral-400">Upload Requirements</h3>
        <div className='flex justify-center'>
        <div className='flex flex-col w-full tablet:w-96'>
        <UploadBox
         label="ID Picture 2x2"
         file={files.idPicture}
         setFile={(file) => {
         setFiles(prev => ({ ...prev, idPicture: file }));
         setErrors(prev => ({ ...prev, idPicture: "" }));
          }}
         validateSize={true}
         />
         {errors.idPicture && (
         <p className='text-red-600 text-sm'>{errors.idPicture}</p>  
         )}
        </div>
        </div>
         <div className="flex flex-col tablet:flex-row gap-5">
         <div className='flex flex-col w-full'>   
         <UploadBox
         label="Birth Certificate"
         file={files.birthCert}
         setFile={(file) => setFiles(prev => ({ ...prev, birthCert: file }))}
         />
         {errors.birthCert && (
         <p className='text-red-600 text-sm'>{errors.birthCert}</p>   
         )}
         </div>
         <div className='flex flex-col w-full'>
         <UploadBox
         label="Report Card"
         file={files.reportCard}
         setFile={(file) => setFiles(prev => ({ ...prev, reportCard: file }))}
         />
         {errors.reportCard && (
         <p className='text-red-600 text-sm'>{errors.reportCard}</p>   
         )}
        </div>

         </div>
         </section>
         )}

                    {/* LEDGER VIEW */}
                    { step == 3 && (
                    <section>
                    <div className='bg-gray-50 dark:bg-neutral-900 rounded-3xl p-6'>
                    <div className='flex justify-between items-center mb-6 text-neutral-400'>
                    <h4 className='text-[10px] font-black uppercase text-gray-400 tracking-widest'>Financial Summary</h4>
                    <span className='text-[10px] font-bold text-green-950'>S.Y. {currentSY}</span>
                    </div>
                
                {/* Breakdown of Fees */}
                <div className='grid grid-cols-2 gap-y-3 mb-6 border-b border-gray-200  pb-6'>
                    {[
                        { label: 'Registration', key: 'registration' },
                        { label: 'Miscellaneous', key: 'misc' },
                        { label: 'Books', key: 'books' },
                        { label: 'Instructional', key: 'instructional' },
                        { label: 'Uniform', key: 'uniform' },
                        { label: 'PTA Fee', key: 'pta' }
                    ].map((item) => (
                        <React.Fragment key={item.key}>
                            <span className='text-[11px] font-bold text-gray-500 uppercase'>{item.label}</span>
                            <span className='text-[11px] font-black text-gray-800 text-right'>
                                ₱{level ? tuitionFees[level][item.key].toLocaleString() : '0'}
                            </span>
                        </React.Fragment>
                    ))}
                </div>

                <div className='space-y-3'>
                    <div className='flex justify-between items-center'>
                        <span className='text-xs font-bold text-gray-500'>Total Initial Fees</span>
                        <span className='text-xl font-black text-green-950 italic'>
                            ₱{level ? (
                                tuitionFees[level].registration + 
                                tuitionFees[level].misc + 
                                tuitionFees[level].books + 
                                tuitionFees[level].instructional + 
                                tuitionFees[level].uniform + 
                                tuitionFees[level].pta
                            ).toLocaleString() : '0'}
                        </span>
                    </div>

                    {/* Monthly Breakdown */}
                    <div className='grid grid-cols-5 gap-2 mt-4'>
                        {(level ? tuitionFees[level].months : ["JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC", "JAN", "FEB", "MAR"]).map(m => (
                            <div key={m} className='bg-white rounded-xl p-2 border border-gray-100 text-center flex flex-col shadow-sm'>
                                <span className='text-[8px] font-bold text-gray-300'>{m}</span>
                                <span className='text-[9px] font-black text-gray-700'>
                                    ₱{level ? tuitionFees[level].monthlyRate.toLocaleString() : '---'}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
    
                    {/* Payment Method Section (Original) */}
                    <div className='mt-8 pt-6 border-t border-gray-200'>
                        <div className='flex flex-col gap-4'>
                            <div className='flex flex-col gap-2'>
                                <label className='text-[10px] font-black text-gray-400 uppercase'>Payment Method</label>
                                <select className='w-full bg-white border border-gray-200 rounded-2xl px-5 py-3 text-sm font-bold focus:ring-2 ring-orange-100 outline-none cursor-pointer'
                                 value={paymentMethod} 
                                 onChange={(e)=>{setPaymentMethod(e.target.value);
                                    setErrors(prev => ({...prev,paymentMethod : ""}));
                                 }}
                                 >   
                                    <option value="">Choose Method</option>
                                    <option value="Cash">Cash Payment</option>
                                    <option value="GCash">GCash Transfer</option>
                                </select>
                            </div>
                            {paymentMethod === "GCash" && (
                                <div className='animate-in slide-in-from-top-2'>
                                    <label className='text-[10px] font-black text-gray-400 uppercase'>Proof of Transaction</label>
                                    <input type="file" className='w-full mt-2 text-xs bg-white p-2 rounded-xl border border-dashed border-orange-300'
                                     onChange={(e)=>{setPaymentProof(e.target.files[0]);
                                     setErrors (prev => ({...prev , paymentProof : ""}));   
                                     }} />
                                </div>
                            )}

                        </div>
                    </div>
                </div>

                        </section>   
)}
                            {/* SECTION: Final Review */}
                            <section className='pt-10 border-gray-50 flex flex-col md:flex-row justify-between items-center gap-8'>
                                <div className='bg-gray-50 dark:bg-neutral-900 p-6 rounded-3xl flex-1 w-full'>
                                    <h4 className='text-[10px] font-black text-gray-400 uppercase mb-4'>Linked Guardian Info</h4>
                                    <div className='grid grid-cols-2 gap-4'>
                                        <div>
                                            <p className='text-[9px] font-bold text-gray-400'>Father</p>
                                            <p className='text-xs font-bold text-gray-700'>{userData.spouse?.firstname} {userData.spouse?.lastname}</p>
                                        </div>
                                        <div>
                                            <p className='text-[9px] font-bold text-gray-400'>Mother</p>
                                            <p className='text-xs font-bold text-gray-700'>{userData.parent?.firstname} {userData.parent?.lastname}</p>
                                        </div>
                                    </div>
                                    <div className='mt-4 pt-4 border-t border-gray-100'>
                                        <p className='text-[9px] font-bold text-gray-400'>Registered Address</p>
                                        <p className='text-xs font-medium text-gray-500 italic'>{fullAddress}</p>
                                    </div>
                                </div>

                                <div className='flex flex-col items-center md:items-end gap-4 w-full md:w-auto'>
                                    <p className='text-[10px] text-gray-400 italic text-center md:text-right max-w-[250px]'>By clicking submit, you agree to MCS terms for S.Y. {currentSY}.</p>

<section className='pt-10 border-t border-gray-50 flex justify-between items-center gap-4'>
  {step > 1 && (
    <button
      onClick={prevStep}
      className="px-6 py-2 rounded-xl bg-gray-200"
    >
      Previous
    </button>
  )}

  {step < 3 && (
    <button
      onClick={nextStep}
      className="px-6 py-2 rounded-xl bg-green-900 text-white"
    >
      Next
    </button>
  )}

  {step === 3 && (
    <button
      onClick={handleSubmitEnrollment}
      disabled={isSubmitting}
      className={`px-6 py-2 rounded-xl bg-[#1a1a1a] text-white font-black ${isSubmitting ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'hover:bg-yellow-500'}`}
    >
      {isSubmitting ? "Processing..." : "Submit Enrollment"}
    </button>
  )}
</section>
                                </div>
                            </section>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Enrollment;