import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate, Link } from 'react-router-dom';
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
import logo from '../../assets/logo.png'
import GCashQR from '../../assets/GCash-QR.png'
import { Archive,
      BookOpenCheck, 
      Check, 
      ChevronDown, 
      CreditCard, 
      FileUser,
      LogOut,
      Phone,
      Settings,
      User,
      UserPen, 
      Users} from 'lucide-react';
import FloatingInput from '../../components/FloatingInput';
import FloatingSelect from '../../components/FloatingSelect';
import UploadBox from '../../components/UploadBox';
import { useTheme } from '../../components/ThemeContext';

const Enrollment = () => {
    const [isOpen, setIsOpen] = useState(false);
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

    const [paymentType, setPaymentType] = useState("Partial");
    const [selectedMonths, setSelectedMonths] = useState([]);
    const [selectedInitialFees, setSelectedInitialFees] = useState(['registration']);

    const location = useLocation();
    const [errors, setErrors] = useState({});
    const [verificationStatus, setVerificationStatus] = useState("Not Submitted");
    const [submittedStudentID, setSubmittedStudentID] = useState(null);
    const [currentSY, setCurrentSY] = useState("2025-2026");
    const [myStudents, setMyStudents] = useState([]);
    const [editingStudent, setEditingStudent] = useState(null);
    

useEffect(() => {
  if (!editingStudent) {
    if (myStudents.length > 0) {
      setPage((prev) => (prev === "personal" ? "archive" : prev));
    } else {
      setPage("personal");
    }
  }
}, [myStudents, editingStudent]);
    
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

    const validateStep2 = () => {
      const newErrors = {};
      if (!files.idPicture) newErrors.idPicture = "Upload 2x2 Picture";
      if (!files.birthCert) newErrors.birthCert = "Upload Birth Certificate";

      if ((studentType === "Old" || studentType === "Transferee") && !files.reportCard) {
          newErrors.reportCard = "Upload Report Card";
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };

    const validateStep3 = () => true;

    const validateStep4 = () => {
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

    const [step, setStep] = useState(1);
    const totalSteps = 4;
    const nextStep = () => {
      if (step === 1 && !validateStep1()) return;
      if (step === 2 && !validateStep2()) return;
      if (step === 3 && !validateStep3()) return;
      if (step === 4 && !validateStep4()) return;
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
    }, [location, navigate]);

    useEffect(() => {
      if (!birthDate) return;
      const today = new Date();
      const birth = new Date(birthDate);
      let ageCalc = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) ageCalc--;
      if (ageCalc < 0) ageCalc = 0;
      setAge(ageCalc);
    }, [birthDate]);
    
    // THIS EFFECT HANDLES THE JUMP TO STEP 4
    useEffect(() => {
      if (editingStudent) {
        setChildFirst(editingStudent.firstname || "");
        setChildMiddle(editingStudent.middlename || "");
        setChildLast(editingStudent.lastname || "");
        setSuffix(editingStudent.suffix || "none");
        setBirthDate(editingStudent.birthDate || "");
        setAge(editingStudent.age || "");
        setSex(editingStudent.sex || "");
        setPrevSchool(editingStudent.previousSchool || "");
        setStudentType(editingStudent.studentType || "");
        setLevel(editingStudent.level || "");
        setGrade(editingStudent.grade || "");
        setFiles({
          birthCert: editingStudent.requirements?.birthCert ? { url: editingStudent.requirements.birthCert } : null,
          reportCard: editingStudent.requirements?.reportCard ? { url: editingStudent.requirements.reportCard } : null,
          idPicture: editingStudent.requirements?.idPicture ? { url: editingStudent.requirements.idPicture } : null
        });
        setPaymentMethod(editingStudent.paymentMethod || "");
        setSubmittedStudentID(editingStudent.studentID);
        
        const isReadyForPayment = editingStudent.verificationStatus === "Approved" || 
                                  editingStudent.status === "Waiting for Payment" || 
                                  editingStudent.status === "Payment Submitted";

        if (isReadyForPayment) {
          setStep(4);
        } else if (editingStudent.status === "Submitted for Verification" || editingStudent.verificationStatus === "Pending") {
          setStep(3);
        } else {
          setStep(1);
        }
      }
    }, [editingStudent]);
    
    const prevStep = () => {
      if (step > 1) setStep(step - 1);
    };
  
    const gradeOptions =
      level === "Preschool"
        ? ["Nursery", "Kinder"]
        : level === "Elementary"
        ? ["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6"]
        : [];

    useEffect(() => {
      const checkProfile = async () => {
        if (!auth.currentUser) return;
        const docSnap = await getDoc(doc(db, "users", auth.currentUser.uid));
        if (docSnap.exists()) {
          const data = docSnap.data();
          const isProfileComplete =
              data.parent?.firstname && data.parent?.lastname &&
              data.address?.barangay && data.address?.city && data.address?.province &&
              (!data.spouse || (data.spouse.firstname && data.spouse.lastname));
          if (!isProfileComplete) navigate("/completeprofile", { replace: true });
        } else {
          navigate("/completeprofile", { replace: true });
        }
      };
      checkProfile();
    }, [navigate]);
                
    // --- NEW: Fetch dynamic fees from database ---
    const [tuitionFees, setTuitionFees] = useState(null);

    useEffect(() => {
        const unsubFees = onSnapshot(doc(db, "settings", "fees"), (snap) => {
            const monthsArray = ["JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC", "JAN", "FEB", "MAR"];
            
            if (snap.exists()) {
                const data = snap.data();
                // Inject the months array into the fetched data so the rest of the app doesn't break
                if (data.Preschool) data.Preschool.months = monthsArray;
                if (data.Elementary) data.Elementary.months = monthsArray;
                setTuitionFees(data);
            } else {
                // Fallback to defaults if admin hasn't set up the database document yet
                setTuitionFees({
                    "Preschool": { registration: 500, misc: 3500, books: 2500, instructional: 500, uniform: 700, pta: 200, monthlyRate: 900, months: monthsArray },
                    "Elementary": { registration: 500, misc: 3500, books: 2500, instructional: 700, uniform: 700, pta: 200, monthlyRate: 1500, months: monthsArray }
                });
            }
        });
        return () => unsubFees();
    }, []);

    // (Make sure to wrap Step 4 in a null check for tuitionFees so it doesn't crash while loading)
    if (!tuitionFees && step === 4) {
        return <p className="text-center animate-pulse p-10 font-bold text-gray-500">Loading Assessment...</p>;
    }

    useEffect(() => {
        const settingsRef = doc(db, "settings", "schoolYear");
        const unsub = onSnapshot(settingsRef, (snap) => {
            if (snap.exists()) setCurrentSY(snap.data().active);
        });
        return () => unsub();
    }, []);

    useEffect(() => {
        if (!submittedStudentID || !currentSY) return;
        const enrRef = doc(db, "enrollments", `ENR-${currentSY}-${submittedStudentID}`);
        const unsub = onSnapshot(enrRef, (snap) => {
            if (snap.exists()) {
                const data = snap.data();
                setVerificationStatus(data.verificationStatus || "Pending");
            }
        });
        return () => unsub();
    }, [submittedStudentID, currentSY]);

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
                    receiptUrl: enrDoc.exists() ? enrDoc.data().payment.proofImage : "",
                    monthlyTracking: enrDoc.exists() ? enrDoc.data().monthlyTracking : {},
                    verificationStatus: enrDoc.exists() ? enrDoc.data().verificationStatus : "Not Submitted"
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
        if (!file || !file.name) return ""; 
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
        setChildFirst(""); setChildMiddle(""); setChildLast(""); setSuffix("none");
        setAge(""); setBirthDate(""); setSex(""); setPrevSchool(""); 
        setLevel(""); setGrade(""); setStudentType(""); 
        setFiles({ birthCert: null, reportCard: null, idPicture: null });
        setPaymentMethod(""); setPaymentProof(null); 
        setEditingStudent(null); setSubmittedStudentID(null);
        setVerificationStatus("Not Submitted"); setSelectedMonths([]);
        setPaymentType("Partial"); setSelectedInitialFees(['registration']);
        setStep(1); setPage("personal"); 
    };

    const handleSubmitForVerification = async () => {
      const step1Valid = validateStep1();
      const step2Valid = validateStep2();

      if (!step1Valid || !step2Valid) {
        await sileo.error({
          title: "Missing Requirements",
          description: "Please complete child info and upload requirements",
          fill: "black",
          styles: { description: "text-white/75" }
        });
        return;
      }

      setIsSubmitting(true);

      const submitForVerification = async () => {
        const studentID = editingStudent
          ? editingStudent.studentID
          : `${currentSY}-${childLast[0].toUpperCase()}${childFirst[0].toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

        const [birthUrl, cardUrl, picUrl] = await Promise.all([
          uploadToCloudinary(files.birthCert),
          uploadToCloudinary(files.reportCard),
          uploadToCloudinary(files.idPicture)
        ]);

        await setDoc(doc(db, "students", studentID), {
          studentID,
          parentUID: auth.currentUser.uid,
          firstname: childFirst, middlename: childMiddle, lastname: childLast, suffix,
          level, grade, birthDate, age: Number(age), sex, studentType,
          previousSchool: studentType === "Transferee" ? prevSchool : "",
          isEnrolled: false,
          status: "Submitted for Verification",
          requirements: { birthCert: birthUrl, reportCard: cardUrl, idPicture: picUrl },
          address: userData.address, father: userData.spouse, mother: userData.parent,
          schoolYear: currentSY,
          createdAt: serverTimestamp()
        });

        await setDoc(doc(db, "enrollments", `ENR-${currentSY}-${studentID}`), {
          studentID, parentUID: auth.currentUser.uid, schoolYear: currentSY,
          fees: tuitionFees[level],
          monthlyTracking: tuitionFees[level].months.reduce((acc, month) => {
            acc[month] = { status: "Unpaid", amount: tuitionFees[level].monthlyRate };
            return acc;
          }, {}),
          verificationStatus: "Pending",
          payment: { method: "", proofImage: "", status: "Pending", dateEnrolled: serverTimestamp() }
        });

        setSubmittedStudentID(studentID);
        setVerificationStatus("Pending");
      };

      try {
        await sileo.promise(submitForVerification(), {
          loading: { title: "Submitting for Verification..." },
          success: { title: "Submitted Successfully", description: "Waiting for admin verification", fill: "black" },
          error: { title: "Submission Failed" }
        });
        setStep(3);
      } finally {
        setIsSubmitting(false);
      }
    };

    const handleSubmitEnrollment = async () => {
      if (!submittedStudentID) return;
      if (!validateStep4()) {
        await sileo.error({ title: "Missing Payment Info", description: "Please complete payment details", fill: "black", styles: { description: "text-white/75" }});
        return;
      }

      setIsSubmitting(true);
      const submitEnrollmentAction = async () => {
        const selectedKeys = paymentType === "Full" ? ['registration', 'misc', 'books', 'instructional', 'uniform', 'pta'] : selectedInitialFees;
        const gcashUrl = paymentProof ? await uploadToCloudinary(paymentProof) : null;

        await updateDoc(doc(db, "enrollments", `ENR-${currentSY}-${submittedStudentID}`), {
            payment: {
                method: paymentMethod, proofImage: gcashUrl,
                status: "Pending Approval", dateEnrolled: serverTimestamp()
            },
            paidInitialFees: selectedKeys
        });

        // Update Students table status to tell Admin we are ready
        await updateDoc(doc(db, "students", submittedStudentID), {
            status: "Payment Submitted"
        });

        const monthsToPay = paymentType === "Full" ? (tuitionFees[level]?.months || []) : paymentType === "Partial" ? selectedMonths : [];
        if (monthsToPay.length > 0) {
            const updates = {};
            monthsToPay.forEach(month => { updates[`monthlyTracking.${month}.status`] = "Paid"; });
            await updateDoc(doc(db, "enrollments", `ENR-${currentSY}-${submittedStudentID}`), updates);
        }
      };

      try {
        await sileo.promise(submitEnrollmentAction(), {
          loading: { title: "Submitting Payment..." },
          success: { title: "Payment Submitted", description: `Waiting for admin approval for S.Y. ${currentSY}`, fill: "black" },
          error: { title: "Enrollment Failed" }
        });

        fetchMyStudents(auth.currentUser.uid);
        handleAddNewChild();
        setPage("archive");
      } finally {
        setIsSubmitting(false);
      }
    };

    if (!userData) return <p className='text-center mt-20 font-bold animate-pulse text-gray-400'>Loading MCS Portal...</p>;

    const fullAddress = `${userData.address.purok}, ${userData.address.barangay}, ${userData.address.city}, ${userData.address.province}`;

    return (
        <div className='dark:bg-black bg-white font-sans text-[#2D3748]'>
          <header className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md border-b border-gray-100 px-6 py-3 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-4">
              <button className="p-2 hover:bg-gray-100 rounded-lg tablet:hidden transition-colors" onClick={() => setIsOpen(!isOpen)}></button>
              <Link to="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
                <img className="w-10 h-10 object-contain" src={logo} alt="Logo" />
                <div className="hidden phone:block border-l border-gray-200 pl-4 py-1">
                  <h1 className="text-[14px] font-black tracking-tight text-gray-800 uppercase leading-none">Myrtle Christian School Inc.</h1>
                  <p className="text-[10px] text-green-800 font-bold tracking-[0.15em] uppercase mt-1">Parent Portal</p>
                </div>
              </Link>
            </div>
          </header>
                
          <div className="flex">
            <div className="fixed bottom-5 left-1/2 -translate-x-1/2 w-auto min-w-[280px] z-50 tablet:hidden">
              <div className="bg-white/80 dark:bg-neutral-950/90 backdrop-blur-md border border-gray-200/50 dark:border-neutral-800 shadow-xl rounded-full px-4 py-2 flex justify-between items-center gap-6">
                <button onClick={() => setPage("personal")} className={`flex flex-col items-center transition-all duration-300 ${setpage === "personal" ? "text-blue-600" : "text-gray-400"}`}>
                  <div className={`p-1.5 rounded-xl transition-colors ${setpage === "personal" ? "bg-blue-50 dark:bg-blue-600/10" : ""}`}><FileUser size={18} strokeWidth={2} /></div>
                  <span className="text-[9px] font-bold tracking-tight">Enroll</span>
                </button>
                <button onClick={() => setPage("archive")} className={`flex flex-col items-center transition-all duration-300 ${setpage === "archive" ? "text-blue-600" : "text-gray-400"}`}>
                  <div className={`p-1.5 rounded-xl transition-colors ${setpage === "archive" ? "bg-blue-50 dark:bg-blue-600/10" : ""}`}><Archive size={18} strokeWidth={2} /></div>
                  <span className="text-[9px] font-bold tracking-tight">Records</span>
                </button>
                <button className="flex flex-col items-center transition-all duration-300 text-gray-400">
                  <div className="p-0.5 rounded-full border border-gray-200 dark:border-neutral-800"><img className="w-6 h-6 rounded-full object-cover grayscale-[0.5]" src={userData.profilePicture} alt="" /></div>
                  <span className="text-[9px] font-bold tracking-tight">Account</span>
                </button>
                <button onClick={async () => { await auth.signOut(); navigate("/auth"); }} className="flex flex-col items-center text-red-500/70">
                  <div className="p-1.5"><LogOut size={18} strokeWidth={2} /></div>
                  <span className="text-[9px] font-bold tracking-tight">Exit</span>
                </button>
              </div>
            </div>
 
            <div className='p-5 hidden dark:text-neutral-700 tablet:block tablet:sticky tablet:top-20 tablet:h-[calc(100vh-5rem)] relative '>
              <div className='w-[15rem] gap-2'>
                <h1 className='font-semibold'>Child</h1>  
                <div className='flex flex-col mt-1 gap-1'>
                  <button className={`px-6 flex gap-2 w-full dark:text-white items-center py-2 rounded-2xl transition-all duration-200 ease-out ${setpage === "personal" ? "bg-gray-100 dark:bg-neutral-900 scale-[0.98]" : "hover:bg-gray-100 hover:dark:bg-neutral-900"}`} onClick={() => setPage("personal")}>
                    <FileUser/> Enrollment
                  </button>
                  <button className={`px-6 flex gap-2 w-full dark:text-white items-center py-2 rounded-2xl transition-all duration-200 ease-out ${setpage === "archive" ? "bg-gray-100 dark:bg-neutral-900 scale-[0.98]" : "hover:bg-gray-100 hover:dark:bg-neutral-900"}`} onClick={() => setPage("archive")}>
                    <Archive/> Records
                  </button>
                </div> 
                <h1 className='mt-2 font-semibold'>Account</h1>
                <div className='flex gap-1 flex-col'>
                  <NavLink to="/profile" className='px-6 hover:bg-gray-100 hover:rounded-2xl hover:dark:bg-neutral-900 flex items-center gap-2 py-2 dark:text-white'><User/>Profile</NavLink>
                  <button className='px-6 dark:text-white py-2 flex items-center gap-2' onClick={() => setOpen(!open)}>
                    <Settings/>Settings <ChevronDown className=' dark:text-white'/>
                  </button>
                  {open && (
                    <div className='flex ml-8 flex-col justify-end'>
                      <NavLink to="/changepassword" className="px-6 hover:bg-gray-100 py-2 rounded-2xl">Change Password</NavLink>
                    </div>
                  )}
                </div>
              </div>
              <div className='flex absolute bottom-3 w-[15rem] items-center justify-center px-6 py-1 rounded-2xl bg-gray-100 dark:text-white dark:bg-neutral-900 gap-2'> 
                <img className='w-8 h-8 rounded-full' src={userData.profilePicture} alt="" />
                <h1 className='text-nowrap'>{userData.parent?.firstname} {userData.parent?.lastname}</h1> 
                <button onClick={async () => { await auth.signOut(); navigate("/auth"); }} className=" text-red-600"><LogOut/></button>
              </div>
            </div>

            {setpage === "archive" ? (
                <EnrollmentArchive {...{setpage, myStudents, handleAddNewChild, setChildFirst, setChildMiddle, setChildLast, setSuffix, setAge, setSex, setStudentType, setPrevSchool, setLevel, setGrade, setFiles, setPaymentMethod, setEditingStudent, setPage}} />
            ) : (
            <div className='space-y-2 animate-in w-full fade-in slide-in-from-bottom-4 duration-700 overflow-hidden'>
              <ol className="flex justify-between items-center mt-1 relative p-5">
                {[1, 2, 3, 4].map((s, i) => (
                  <li key={s} className="relative flex-1 flex flex-col items-center">
                    <span className={`w-8 h-8 rounded-full flex justify-center items-center text-sm z-10 ${step === s ? "bg-[#2D5B60] text-white" : step > s ? "bg-green-600 text-white" : "bg-gray-50 border-2 border-gray-200 text-gray-600"}`}>
                      {step > s ? <Check className='w-4 h-4'/> : s === 1 ? <UserPen className=' w-4 h-4'/> : s === 2 ? <BookOpenCheck className='w-4 h-4'/> : s === 3 ? <Users className='w-4 h-4'/> : <CreditCard className='w-4 h-4'/>}
                    </span>
                    {i < 3 && <div className="absolute top-4 left-1/2 border dark:border-neutral-900 w-full bg-gray-300 z-0"></div>}
                    <div className="text-center mt-6">
                      <h4 className={`tablet:text-base mb-1 text-[10px] text-nowrap font-bold ${step >= s ? "text-[#2D5B60]" : "text-gray-400 dark:text-neutral-600"}`}>
                        {s === 1 && "Child Info"} {s === 2 && "Requirements"} {s === 3 && "Verification"} {s === 4 && "Payment"}
                      </h4>
                    </div>
                  </li>
                ))}
              </ol>

              <div className='p-5'>
                {/* STEP 1 */}
                { step === 1 && (
                  <section>
                    <div className='flex gap-2 items-center mb-4'>
                      <div className='w-1 h-6 bg-[#2D5B60] rounded-full'></div>
                      <h3 className='font-bold uppercase tracking-widest text-sm dark:text-neutral-600'>Child Information</h3>
                    </div>
                    {/* ... (Existing Step 1 Inputs exactly as you had them) ... */}
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

                {/* STEP 2 */}
                { step === 2 && (
                  <section className="space-y-4">
                    <h3 className="font-bold text-slate-700 dark:text-neutral-400">Upload Requirements</h3>
                    {/* ... (Existing Step 2 Inputs) ... */}
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

                {/* STEP 3 */}
                { step === 3 && (
                  <section>
                    <div className='flex gap-2 items-center'>
                      <div className='w-1 h-6 bg-[#2D5B60] rounded-full'></div>
                      <h3 className='font-semibold uppercase tracking-widest text-sm dark:text-neutral-600'>Admin Verification</h3>
                    </div>
                    <div className='mt-4 p-8 bg-gray-50 dark:bg-neutral-900 rounded-2xl border text-center'>
                      <h4 className='text-xl font-bold mb-2'>Documents Submitted</h4>
                      <p className='text-gray-600 dark:text-neutral-400 mb-6'>We are currently reviewing the uploaded documents for {childFirst}.</p>
                      
                      <div className='inline-block px-6 py-3 rounded-full font-bold uppercase tracking-widest text-sm
                        ${verificationStatus === "Approved" ? "bg-green-100 text-green-700" : 
                          verificationStatus === "Rejected" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700 animate-pulse"}'>
                        {verificationStatus === "Pending" ? "⏳ AWAITING VERIFICATION" : verificationStatus}
                      </div>

                      {verificationStatus === "Approved" && (
                        <div className="mt-8">
                          <p className='text-green-700 font-medium mb-4'>Great! Requirements are verified. You can now proceed to payment.</p>
                          <button onClick={() => setStep(4)} className="px-8 py-3 rounded-xl bg-[#2D5B60] text-white font-bold hover:bg-black transition-colors">
                            Continue to Payment →
                          </button>
                        </div>
                      )}

                      {verificationStatus === "Rejected" && (
                        <div className='mt-8'>
                          <p className='text-red-600'>Your application was rejected. Please review and resubmit the correct files.</p>
                          <button onClick={handleAddNewChild} className="mt-4 px-6 py-2 rounded-xl bg-red-600 text-white font-bold">Restart Application</button>
                        </div>
                      )}
                    </div>
                  </section>
                )}

                {/* STEP 4 */}
                { step === 4 && (
                  <section>
                    <div className='bg-gray-50 dark:bg-neutral-900 rounded-3xl p-6'>
                      {/* ... (Existing Step 4 Inputs & logic exactly as you had them) ... */}
                      <div className='flex justify-between items-center mb-6 text-neutral-400'>
                    <h4 className='text-[10px] font-black uppercase text-gray-400 tracking-widest'>Financial Summary</h4>
                    <span className='text-[10px] font-bold text-green-950'>S.Y. {currentSY}</span>
                    </div>
                
                {/* Breakdown of Fees */}
                <div className='space-y-3 mb-6 border-b border-gray-200 pb-6'>
                    <div className='flex flex-col gap-2'>
                        <label className='text-[10px] font-black text-gray-400 uppercase'>Payment Type</label>
                        <select className='w-full bg-white border border-gray-200 rounded-2xl px-5 py-3 text-sm font-bold focus:ring-2 ring-orange-100 outline-none cursor-pointer'
                         value={paymentType} 
                         onChange={(e)=>{
                            setPaymentType(e.target.value);
                            if (e.target.value === "Partial") {
                                setSelectedInitialFees(['registration']);
                            }
                         }}
                         >   
                            <option value="Partial">Initial Fees + Selected Tuition Months</option>
                            <option value="Full">Full Year Tuition (Initial + All Months)</option>
                        </select>
                    </div>
                    <div className='grid grid-cols-1 gap-2'>
                        {[
                            { label: 'Registration', key: 'registration' },
                            { label: 'Miscellaneous', key: 'misc' },
                            { label: 'Books', key: 'books' },
                            { label: 'Instructional', key: 'instructional' },
                            { label: 'PE Uniform', key: 'uniform' },
                            { label: 'PTA', key: 'pta' }
                        ].map((item) => (
                            <div key={item.key} className='flex items-center justify-between'>
                                <div className='flex items-center gap-2'>
                                    <input 
                                        type="checkbox" 
                                        checked={paymentType === "Full" ? true : item.key === 'registration' ? true : selectedInitialFees.includes(item.key)}
                                        disabled={paymentType === "Full" || item.key === 'registration'}
                                        onChange={(e) => {
                                            if (paymentType !== "Full" && item.key !== 'registration') {
                                                if (e.target.checked) {
                                                    setSelectedInitialFees(prev => [...prev, item.key]);
                                                } else {
                                                    setSelectedInitialFees(prev => prev.filter(k => k !== item.key));
                                                }
                                            }
                                        }}
                                        className='w-4 h-4'
                                    />
                                    <span className='text-[11px] font-bold text-gray-500 uppercase'>{item.label}</span>
                                </div>
                                <span className='text-[11px] font-black text-gray-800'>
                                    ₱{level ? tuitionFees[level][item.key].toLocaleString() : '0'}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                    {/* Advance Tuition Payment */}
                    {(paymentType === "Partial" || paymentType === "Full") && (
                    <div className='mt-8 pt-6 border-t border-gray-200'>
                        <h4 className='text-[10px] font-black text-gray-400 uppercase mb-4'>Advance Tuition Payment</h4>
                        <div className='grid grid-cols-5 gap-2'>
                            {tuitionFees[level]?.months.map(m => (
                                <div key={m} className='bg-white rounded-xl p-2 border border-gray-100 text-center flex flex-col shadow-sm'>
                                    <input 
                                        type="checkbox" 
                                        checked={paymentType === "Full" ? true : selectedMonths.includes(m)}
                                        disabled={paymentType === "Full"}
                                        onChange={(e) => {
                                            if (paymentType === "Partial") {
                                                if (e.target.checked) {
                                                    setSelectedMonths(prev => [...prev, m]);
                                                } else {
                                                    setSelectedMonths(prev => prev.filter(month => month !== m));
                                                }
                                            }
                                        }}
                                        className='mb-1'
                                    />
                                    <span className='text-[8px] font-bold text-gray-300'>{m}</span>
                                    <span className='text-[9px] font-black text-gray-700'>
                                        ₱{tuitionFees[level].monthlyRate.toLocaleString()}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                    )}

                        {/* Total Amount */}
                        <div className='mt-6 pt-6 border-t border-gray-200'>
                            <div className='flex justify-between items-center'>
                                <span className='text-lg font-bold text-gray-700'>Total Amount to Pay</span>
                                <span className='text-2xl font-black text-[#2D5B60] italic'>
                                    ₱{(() => {
                                        const selectedKeys = paymentType === "Full" ? ['registration', 'misc', 'books', 'instructional', 'uniform', 'pta'] : selectedInitialFees;
                                        const initialTotal = selectedKeys.reduce((acc, key) => acc + (tuitionFees[level]?.[key] || 0), 0);
                                        const monthsToPay = paymentType === "Full" ? (tuitionFees[level]?.months || []) : paymentType === "Partial" ? selectedMonths : [];
                                        const tuitionTotal = monthsToPay.length * (tuitionFees[level]?.monthlyRate || 0);
                                        return (initialTotal + tuitionTotal).toLocaleString();
                                    })()}
                                </span>
                            </div>
                        </div>

                    {/* Payment Method Section */}
<div className='mt-8 pt-6 border-t border-gray-200'>
    <div className='flex flex-col gap-4'>
        <div className='flex flex-col gap-2'>
            <label className='text-[10px] font-black text-gray-400 uppercase'>Payment Method</label>
            <select 
                className='w-full bg-white border border-gray-200 rounded-2xl px-5 py-3 text-sm font-bold focus:ring-2 ring-orange-100 outline-none cursor-pointer'
                value={paymentMethod} 
                onChange={(e) => {
                    setPaymentMethod(e.target.value);
                    setErrors(prev => ({ ...prev, paymentMethod: "" }));
                }}
            >   
                <option value="">Choose Method</option>
                <option value="Cash">Cash Payment</option>
                <option value="GCash">GCash Transfer</option>
            </select>
        </div>

        {/* GCash Details & Upload Section */}
        {paymentMethod === "GCash" && (
            <div className='animate-in slide-in-from-top-2 flex flex-col gap-4'>
                
                {/* GCash Information Card */}
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex flex-col items-center text-center gap-3">
                    <div className="bg-white p-2 rounded-xl shadow-sm border border-blue-50">
                        {/* Palitan mo ang src ng actual path ng QR Code mo */}
                        <img 
                            src={GCashQR}
                            alt="GCash QR" 
                            className="w-32 h-32 object-contain"
                        />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Send Payment To</p>
                        <p className="text-lg font-black text-blue-900 leading-tight">0912 345 6789</p>
                        <p className="text-xs font-bold text-blue-700">ACCOUNT NAME: MYRTLE SCHOOL</p>
                    </div>
                </div>

                {/* File Upload Field */}
                <div>
                    <label className='text-[10px] font-black text-gray-400 uppercase'>Proof of Transaction (Screenshot)</label>
                    <input 
                        type="file" 
                        accept="image/*"
                        className='w-full mt-2 text-xs bg-white p-2 rounded-xl border border-dashed border-orange-300'
                        onChange={(e) => {
                            setPaymentProof(e.target.files[0]);
                            setErrors(prev => ({ ...prev, paymentProof: "" }));   
                        }} 
                    />
                    <p className="text-[9px] text-gray-400 mt-1 italic">Please upload a clear screenshot of your GCash receipt.</p>
                </div>

            </div>
        )}

        {errors.selectedMonths && (
            <p className='text-red-600 text-sm mt-2'>{errors.selectedMonths}</p>
        )}
    </div>
</div>
                    </div>
                  </section>   
                )}

                {/* Final Review & Controls */}
                <section className='pt-10 flex flex-col md:flex-row justify-between items-center gap-8'>
                  <div className='bg-gray-50 dark:bg-neutral-900 p-6 rounded-2xl flex-1 w-full border border-gray-100'>
                    <h4 className='text-lg mb-4 flex gap-2 items-center font-bold text-[#2D5B60]'><Users/> Family Background</h4>
                    <div className="grid tablet:grid-cols-2 grid-cols-1 gap-4">
                      <div>
                        <p className="font-semibold text-gray-500 uppercase text-[10px] mb-1">{userData.role === "father" ? "Father" : userData.role === "mother" ? "Mother" : "Parent"}</p>
                        <p className="font-bold text-gray-800 uppercase">{userData.parent?.firstname} {userData.parent?.lastname}</p>
                        {userData.spouse && (
                          <div className="mt-4">
                            <p className="font-semibold text-gray-500 uppercase text-[10px] mb-1">{userData.role === "father" ? "Mother" : userData.role === "mother" ? "Father" : "Parent"}</p>
                            <p className="font-bold text-gray-800 uppercase">{userData.spouse?.firstname} {userData.spouse?.lastname}</p>
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-500 uppercase text-[10px] mb-1">Contact</p>
                        <p className="font-bold text-gray-800 flex items-center gap-2"><Phone size={16} />{userData.parent?.contact}</p>
                        <div className="mt-4">
                            <p className="font-semibold text-gray-500 uppercase text-[10px] mb-1">Full Address</p>
                            <p className="font-bold text-gray-800 text-sm">{fullAddress}</p>
                        </div>
                      </div>
                    </div>
                  </div>
          
                  <div className='flex flex-col items-center md:items-end w-full md:w-auto'>
                    <p className='text-[10px] text-gray-400 italic text-center md:text-right max-w-[250px] mb-4'>By clicking submit, you agree to MCS terms for S.Y. {currentSY}.</p>
                    <div className='flex justify-center items-center gap-4 w-full'>
                      {step > 1 && step !== 4 && step !== 3 && (
                        <button onClick={prevStep} className="px-6 py-3 rounded-xl bg-gray-200 font-bold text-gray-700 w-full md:w-auto">Back</button>
                      )}
                      {step < 2 && (
                        <button onClick={nextStep} className="px-10 py-3 rounded-xl bg-[#2D5B60] text-white font-bold w-full md:w-auto hover:bg-black transition-colors">Next →</button>
                      )}
                      {step === 2 && (
                        <button onClick={handleSubmitForVerification} disabled={isSubmitting} className={`px-6 py-3 rounded-xl text-white font-black w-full md:w-auto ${isSubmitting ? 'bg-gray-300' : 'bg-[#2D5B60] hover:bg-black'}`}>
                          {isSubmitting ? "Submitting..." : "Submit for Verification"}
                        </button>
                      )}
                      {step === 4 && (
                        <button onClick={handleSubmitEnrollment} disabled={isSubmitting} className={`px-6 py-3 rounded-xl text-white font-black w-full md:w-auto ${isSubmitting ? 'bg-gray-300' : 'bg-[#2D5B60] hover:bg-black'}`}>
                          {isSubmitting ? "Processing..." : "Submit Payment & Enroll"}
                        </button>
                      )}
                    </div>
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