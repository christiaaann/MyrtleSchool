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

import plus from '../../assets/icons/plus.png'
import deaf from '../../assets/default.png'
import logo from '../../assets/logo.png'

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

    const [childFirst, setChildFirst] = useState("");
    const [childMiddle, setChildMiddle] = useState("");
    const [childLast, setChildLast] = useState("");
    const [suffix, setSuffix] = useState("none");
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
   
    // if user not complete back to complete profile
   useEffect(() => {
   const checkProfile = async () => {
    if (!auth.currentUser) return;

    const docSnap = await getDoc(doc(db, "users", auth.currentUser.uid));
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (
        !data.parent?.firstname || !data.parent?.lastname ||
        !data.spouse?.firstname || !data.spouse?.lastname ||
        !data.address?.barangay || !data.address?.city || !data.address?.province
      ) {
        navigate("/completeprofile", { replace: true });
      }
    } else {
      navigate("/completeprofile", { replace: true });
    }
  };

  checkProfile();
}, [navigate]);

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
        setSex(""); 
        setPrevSchool(""); 
        setLevel(""); 
        setGrade("");
        setStudentType(""); 
        setFiles({ birthCert: null, reportCard: null, idPicture: null });
        setPaymentMethod(""); 
        setPaymentProof(null); 
        setEditingStudent(null);
        setPage("personal"); 
    };

    const handleSubmitEnrollment = async () => {
        if (!level || !childFirst || !childLast || !studentType) {
            await sileo.promise(new Promise((resolve, reject) => setTimeout(() => reject(new Error("Please fill up required Student Info")), 1000)), {
                error: { title: "Missing Info", 
                description: "Please fill up required Student Info", 
                fill: "black",
                styles:{description:"text-white/75"}
            }
            });
            return;
        }
        setIsSubmitting(true);
        const submitEnrollment = async () => {
            const studentID = editingStudent ? editingStudent.studentID : `${currentSY}-${childLast[0].toUpperCase()}${childFirst[0].toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
            const [birthUrl, cardUrl, picUrl, gcashUrl] = await Promise.all([
                uploadToCloudinary(files.birthCert), uploadToCloudinary(files.reportCard),
                uploadToCloudinary(files.idPicture), uploadToCloudinary(paymentProof)
            ]);
            await setDoc(doc(db, "students", studentID), {
                studentID, parentUID: auth.currentUser.uid, firstname: childFirst, middlename: childMiddle, lastname: childLast, suffix, level, grade, age: Number(age), sex, studentType, previousSchool: studentType === "Transferee" ? prevSchool : "", isEnrolled: false, status: "Pending", requirements: { birthCert: birthUrl, reportCard: cardUrl, idPicture: picUrl }, address: userData.address, father: userData.spouse, mother: userData.parent, schoolYear: currentSY, createdAt: serverTimestamp()
            });
            await setDoc(doc(db, "enrollments", `ENR-${currentSY}-${studentID}`), {
                studentID, parentUID: auth.currentUser.uid, schoolYear: currentSY, fees: tuitionFees[level],
                monthlyTracking: tuitionFees[level].months.reduce((acc, month) => { acc[month] = { status: "Unpaid", amount: tuitionFees[level].monthlyRate }; return acc; }, {}),
                payment: { method: paymentMethod, proofImage: gcashUrl, status: "Pending", dateEnrolled: serverTimestamp() }
            });
        };
        try {
            await sileo.promise(submitEnrollment(), {
                loading: { title: "Submitting Enrollment..." },
                success: { title: "Enrollment Successful", description: `Pending Admin Approval for S.Y. ${currentSY}`, fill: "black" },
                error: { title: "Enrollment Failed" }
            });
            fetchMyStudents(auth.currentUser.uid);
            handleAddNewChild();
            setPage("archive");
        } finally { setIsSubmitting(false); }
    };

    if (!userData) return <p className='text-center mt-20 font-bold animate-pulse text-gray-400'>Loading MCS Portal...</p>;

    const fullAddress = `${userData.address.purok}, ${userData.address.barangay}, ${userData.address.city}, ${userData.address.province}`;

    return (
        <div className='min-h-screen bg-gradient-to-l from-gray-200 via-yellow-50 to-stone-100 font-sans text-[#2D3748]'>
            
            {/* Minimal Header */}
            <header className='bg-white z-20 px-8 py-4 flex items-center justify-between border-b border-gray-100 sticky top-0 shadow-sm'>
                <div className='flex items-center gap-6'>
                    <div className='flex items-center gap-3'>
                        <img className='w-10' src={logo} alt="Logo" />
                        <div>
                            <h1 className='text-sm font-black tracking-tight text-gray-800 uppercase'>Myrtle Christian School</h1>
                            <p className='text-[10px] text-orange-500 font-bold tracking-widest uppercase'>Parent Portal</p>
                        </div>
                    </div>
                </div>

                <div className='flex items-center gap-4'>
                    <div className='text-right'>
                        <p className='text-xs font-bold'>{userData.parent?.firstname} {userData.parent?.lastname}</p>
                        <span className='text-[9px] bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-bold uppercase'>Active</span>
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
                </div>
            </header>

            <div className="max-w-7xl mx-auto py-5 px-6">
                
                {/* (TABS MENU) --- */}
                <div className='fixed left-1/2 -translate-x-1/2 z-20'>
                <div className='flex gap-2 backdrop-blur-sm mb-5 bg-gray-200/50 p-1.5 rounded-2xl w-fit'>
                    <button 
                        onClick={() => setPage("personal")} 
                        className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${setpage === 'personal' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400'}`}
                    >
                        Enrollment Form
                    </button>
                    <button onClick={handleAddNewChild} className=' bg-black rounded-full w-10 h-10 flex items-center justify-center'>
                    <img className=' w-5' src={plus} alt="" />
                    </button>
                    <button 
                        onClick={() => setPage("archive")} 
                        className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${setpage === 'archive' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400'}`}
                    >
                        Records / Archive
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
                    <div className='space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700'>
                        
                        {/* Stepper Heading */}
                        <div className='flex items-center gap-10 mb-12'>
                            <div className='flex-1'>
                                <h2 className='text-3xl font-black'>Student Enrollment</h2>
                                <p className='text-gray-400 text-sm mt-1 font-medium'>S.Y. {currentSY} • Information & Assessment</p>
                            </div>
                        </div>

                        {/* FORM CONTENT (YUNG DATING CODE MO NA HINDI BINAGO) */}
                        <div className='bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-12 space-y-12'>
                            
                            {/* SECTION: Pupil Information */}
                            <section>
                                <div className='flex items-center gap-3 mb-8'>
                                    <div className='w-1 h-6 bg-yellow-500 rounded-full'></div>
                                    <h3 className='font-bold text-gray-800 uppercase tracking-widest text-sm'>Child Information</h3>
                                </div>
                                
                                <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                                    <div className='flex flex-col gap-2'>
                                        <label className='text-[10px] font-black text-gray-400 uppercase ml-1'>First Name</label>
                                        <input className='bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 ring-orange-100 outline-none transition-all placeholder:text-gray-300' type="text" placeholder='Juan' value={childFirst} onChange={(e)=>setChildFirst(e.target.value)} />
                                    </div>
                                    <div className='flex flex-col gap-2'>
                                        <label className='text-[10px] font-black text-gray-400 uppercase ml-1'>Middle Name</label>
                                        <input className='bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 ring-orange-100 outline-none transition-all placeholder:text-gray-300' type="text" placeholder='Dela Cruz' value={childMiddle} onChange={(e)=>setChildMiddle(e.target.value)} />
                                    </div>
                                    <div className='flex flex-col gap-2'>
                                        <label className='text-[10px] font-black text-gray-400 uppercase ml-1'>Last Name</label>
                                        <input className='bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 ring-orange-100 outline-none transition-all placeholder:text-gray-300' type="text" placeholder='Santos' value={childLast} onChange={(e)=>setChildLast(e.target.value)} />
                                    </div>
                                </div>

                                <div className='grid grid-cols-2 md:grid-cols-4 gap-6 mt-6'>
                                    <div className='flex flex-col gap-2'>
                                        <label className='text-[10px] font-black text-gray-400 uppercase ml-1'>Suffix</label>
                                        <select className="bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 ring-orange-100 outline-none cursor-pointer" value={suffix} onChange={(e)=>setSuffix(e.target.value)}>
                                            <option value="none">None</option><option value="Jr.">Jr.</option><option value="Sr.">Sr.</option>
                                        </select>
                                    </div>
                                    <div className='flex flex-col gap-2'>
                                        <label className='text-[10px] font-black text-gray-400 uppercase ml-1'>Age</label>
                                        <input type="number" className="bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 ring-orange-100 outline-none" value={age} onChange={(e)=>setAge(e.target.value)} />
                                    </div>
                                    <div className='flex flex-col gap-2'>
                                        <label className='text-[10px] font-black text-gray-400 uppercase ml-1'>Sex</label>
                                        <select className="bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 ring-orange-100 outline-none cursor-pointer" value={sex} onChange={(e)=>setSex(e.target.value)}>
                                            <option value="">Select</option><option value="Male">Male</option><option value="Female">Female</option>
                                        </select>
                                    </div>
                                    <div className='flex flex-col gap-2'>
                                        <label className='text-[10px] font-black text-gray-400 uppercase ml-1'>Student Type</label>
                                        <select className="bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 ring-orange-100 outline-none cursor-pointer" value={studentType} onChange={(e) => setStudentType(e.target.value)}>
                                            <option value="">Choose</option><option value="New">New Student</option><option value="Old">Old Student</option><option value="Transferee">Transferee</option>
                                        </select>
                                    </div>
                                </div>

                                {studentType === "Transferee" && (
                                    <div className='mt-6 animate-in slide-in-from-top-2'>
                                        <label className='text-[10px] font-black text-gray-400 uppercase ml-1'>Previous School Attended</label>
                                        <input type="text" className="w-full mt-2 bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 ring-orange-100 outline-none" placeholder="Enter School Name" value={prevSchool} onChange={(e) => setPrevSchool(e.target.value)} />
                                    </div>
                                )}
                            </section>

                            <hr className='border-gray-50' />

                            {/* SECTION: Academic Level */}
                            <section className='grid grid-cols-1 md:grid-cols-2 gap-10'>
                                <div className='space-y-6'>
                                    <div className='flex items-center gap-3 mb-2'>
                                        <div className='w-1 h-6 bg-yellow-500 rounded-full'></div>
                                        <h3 className='font-bold text-gray-800 uppercase tracking-widest text-sm'>Academic Info</h3>
                                    </div>
                                    <div className='grid grid-cols-2 gap-4'>
                                        <div className='flex flex-col gap-2'>
                                            <label className='text-[10px] font-black text-gray-400 uppercase ml-1'>Level</label>
                                            <select className="bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 ring-orange-100 cursor-pointer" value={level} onChange={(e) => {setLevel(e.target.value); setGrade("");}}>
                                                <option value="">Select</option><option value="Preschool">Preschool</option><option value="Elementary">Elementary</option>
                                            </select>
                                        </div>
                                        <div className='flex flex-col gap-2'>
                                            <label className='text-[10px] font-black text-gray-400 uppercase ml-1'>Grade</label>
                                            <select className="bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 ring-orange-100 cursor-pointer" value={grade} onChange={(e) => setGrade(e.target.value)} disabled={!level}>
                                                <option value="">Select</option>
                                                {level === "Preschool" ? <><option value="Nursery">Nursery</option><option value="Kinder">Kinder</option></> : <><option value="1">Grade 1</option><option value="2">Grade 2</option><option value="3">Grade 3</option><option value="4">Grade 4</option><option value="5">Grade 5</option><option value="6">Grade 6</option></>}
                                            </select>
                                        </div>
                                    </div>

                                    <div className='p-6 bg-yellow-50/50 rounded-3xl space-y-4'>
                                        <h4 className='text-[10px] font-black uppercase text-yellow-600 tracking-widest'>Upload Requirements</h4>
                                        <div className='space-y-3'>
                                            {['birthCert', 'reportCard', 'idPicture'].map((docType) => (
                                                <div key={docType} className='flex justify-between items-center bg-white p-3 rounded-xl shadow-sm border border-orange-100'>
                                                    <span className='text-xs font-bold text-gray-600 uppercase'>{docType.replace(/([A-Z])/g, ' $1')}</span>
                                                    <input className='text-[10px] w-32 outline-none file:mr-4 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-[10px] file:font-bold file:bg-orange-50 file:text-orange-600 hover:file:bg-orange-100' type="file" onChange={(e)=>setFiles({...files, [docType]: e.target.files[0]})} />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* LEDGER VIEW */}
 {/* LEDGER VIEW */}
<div className='bg-gray-50 rounded-3xl p-6'>
    <div className='flex justify-between items-center mb-6'>
        <h4 className='text-[10px] font-black uppercase text-gray-400 tracking-widest'>Financial Summary</h4>
        <span className='text-[10px] font-bold text-orange-500'>S.Y. {currentSY}</span>
    </div>
    
    {/* Breakdown of Fees */}
    <div className='grid grid-cols-2 gap-y-3 mb-6 border-b border-gray-200 pb-6'>
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
            <span className='text-xl font-black text-orange-600 italic'>
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
                <select className='w-full bg-white border border-gray-200 rounded-2xl px-5 py-3 text-sm font-bold focus:ring-2 ring-orange-100 outline-none cursor-pointer' value={paymentMethod} onChange={(e)=>setPaymentMethod(e.target.value)}>
                    <option value="">Choose Method</option>
                    <option value="Cash">Cash Payment</option>
                    <option value="GCash">GCash Transfer</option>
                </select>
            </div>
            {paymentMethod === "GCash" && (
                <div className='animate-in slide-in-from-top-2'>
                    <label className='text-[10px] font-black text-gray-400 uppercase'>Proof of Transaction</label>
                    <input type="file" className='w-full mt-2 text-xs bg-white p-2 rounded-xl border border-dashed border-orange-300' onChange={(e)=>setPaymentProof(e.target.files[0])} />
                </div>
            )}
        </div>
    </div>
</div>
                            </section>

                            {/* SECTION: Final Review */}
                            <section className='pt-10 border-t border-gray-50 flex flex-col md:flex-row justify-between items-center gap-8'>
                                <div className='bg-gray-50 p-6 rounded-3xl flex-1 w-full'>
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
                                    <button 
                                        onClick={handleSubmitEnrollment} 
                                        disabled={isSubmitting} 
                                        className={`w-full md:w-auto px-12 py-4 rounded-2xl font-black uppercase tracking-widest text-sm transition-all shadow-xl shadow-orange-100 flex items-center justify-center gap-3 ${isSubmitting ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-[#1a1a1a] text-white hover:bg-yellow-500 hover:-translate-y-1'}`}
                                    >
                                        {isSubmitting ? "Processing..." : "Submit Enrollment"}
                                        {!isSubmitting && <span className='text-lg'>→</span>}
                                    </button>
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