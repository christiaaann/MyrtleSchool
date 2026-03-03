import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { doc, getDoc, updateDoc, serverTimestamp, setDoc, collection, query, where, getDocs, onSnapshot } from 'firebase/firestore'; 
import { db, auth } from '../../services/firebase';
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from 'react-router-dom';
import { sileo, Toaster } from 'sileo';
import EnrollmentArchive from './EnrollmentArchive';

import deaf from '../../assets/default.png'
import logo from '../../assets/logo.png'
import user from '../../assets/icons/user.png'
import archive from '../../assets/icons/archive.png'

const Enrollment = () => {
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

    useEffect(() => {
        const settingsRef = doc(db, "settings", "schoolYear");
        const unsub = onSnapshot(settingsRef, (snap) => {
            if (snap.exists()) {
                setCurrentSY(snap.data().active);
            }
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
        return () => {
            if (interval) clearInterval(interval);
            unsubscribe();
        };
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
        setChildFirst(""); setChildMiddle(""); setChildLast(""); setSuffix("none");
        setAge(""); setSex(""); setPrevSchool(""); setLevel(""); setGrade("");
        setStudentType(""); setFiles({ birthCert: null, reportCard: null, idPicture: null });
        setPaymentMethod(""); setPaymentProof(null); setEditingStudent(null);
    };

 const handleSubmitEnrollment = async () => {
  // 1️⃣ Validation with fake loading → error
  if (!level || !childFirst || !childLast || !studentType) {
    await sileo.promise(
      new Promise((resolve, reject) =>
        setTimeout(
          () => reject(new Error("Please fill up required Student Info")),
          1000
        )
      ),
      {
        loading: { title: "Validating...", fill: "black" },
        success: { title: "Validation Passed" }, // won't be shown
        error: {
          title: "Missing Info",
          fill: "black",
          styles:{description: "text-white/75"},
          description: "Please fill up required Student Info"
        }
      }
    );
    return;
  }

  // 2️⃣ Begin enrollment submission
  setIsSubmitting(true);

  const submitEnrollment = async () => {
    const studentID = editingStudent
      ? editingStudent.studentID
      : `${currentSY}-${childLast[0].toUpperCase()}${childFirst[0].toUpperCase()}-${Math.floor(
          100 + Math.random() * 900
        )}`;

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
      age: Number(age),
      sex,
      studentType,
      previousSchool: studentType === "Transferee" ? prevSchool : "",
      isEnrolled: false,
      status: "Pending",
      requirements: { birthCert: birthUrl, reportCard: cardUrl, idPicture: picUrl },
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
        acc[month] = { status: "Unpaid", amount: tuitionFees[level].monthlyRate };
        return acc;
      }, {}),
      payment: { method: paymentMethod, proofImage: gcashUrl, status: "Pending", dateEnrolled: serverTimestamp() }
    });
  };

  try {
    // 3️⃣ Enrollment submission with Sileo promise
    await sileo.promise(submitEnrollment(), {
      loading: { title: "Submitting Enrollment..." },
      success: {
        styles: {description: "text-white"},
        title: "Enrollment Successful",
        description: `Pending Admin Approval for S.Y. ${currentSY}`,
        fill: "black"
      },
      error: { title: "Enrollment Failed" }
    });

    // 4️⃣ After success
    fetchMyStudents(auth.currentUser.uid);
    handleAddNewChild();
    setPage("archive");

  } finally {
    setIsSubmitting(false);
  }
};

    if (!userData) return <p className='text-center mt-20 font-bold animate-pulse'>Loading MCS Portal...</p>;

    const fullAddress = `${userData.address.purok}, ${userData.address.barangay}, ${userData.address.city}, ${userData.address.province}`;

    return (
        <div className='min-h-screen bg-[#F3F4F6] font-sans'>
            <Toaster position="top-center" richColors={false} />
            
            <header className='bg-white border-b flex items-center justify-between px-6 py-3 shadow-sm'>
                <div className='flex items-center gap-4'>
                    <img className='w-14 object-contain' src={logo} alt="Logo" />
                    <div>
                        <h1 className='text-xl font-bold text-green-900 tracking-tight'>MYRTLE CHRISTIAN SCHOOL, INC.</h1>
                        <p className='text-[10px] text-gray-500 uppercase'>San Juan, Irosin, Sorsogon</p>
                    </div>
                </div>

                <div className='flex items-center gap-6'>
                    <div className="relative">
                        <button onClick={toggleDropdown} className="flex items-center gap-2 bg-green-50 text-green-800 px-4 py-2 rounded-full font-semibold border border-green-200 hover:bg-green-100 transition-all">
                            Application Menu
                        </button>
                        {isOpen && (
                            <div className="z-50 absolute right-0 mt-2 bg-white rounded-xl shadow-2xl w-56 overflow-hidden border">
                                <button onClick={() => { setPage("personal"); handleAddNewChild(); setIsOpen(false); }} className="flex items-center gap-3 w-full p-4 hover:bg-green-50 text-gray-700 transition-colors">
                                    <img className='w-5 opacity-70' src={user} alt="" /> Enrollment Form
                                </button>
                                <button onClick={() => { setPage("archive"); setIsOpen(false); }} className="flex items-center gap-3 w-full p-4 hover:bg-green-50 text-gray-700 border-t transition-colors">
                                    <img className='w-5 opacity-70' src={archive} alt="" /> Payment Records
                                </button>
                            </div>
                        )}
                    </div>
                    
                    <div className="flex items-center gap-3 pl-6 border-l">
                        <div className='text-right'>
                            <p className='text-xs font-bold text-gray-800 leading-none'>{userData.parent?.firstname} {userData.parent?.lastname}</p>
                            <p className='text-[10px] text-green-600 font-medium'>Parent / Guardian</p>
                        </div>
                        <img onClick={() => setOpen(!open)} className="w-10 h-10 rounded-full border-2 border-green-500 p-0.5 cursor-pointer hover:scale-105 transition-transform" src={userData.profilePicture || deaf} alt="" />
                        {open && (
                            <div className="absolute top-16 right-6 bg-white shadow-2xl border rounded-lg p-1 w-32 z-50">
                                <button onClick={async () => { await auth.signOut(); navigate("/auth"); }} className="text-red-500 text-xs font-bold w-full text-left px-4 py-2 hover:bg-red-50 rounded">Logout</button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <div className="p-6 max-w-7xl mx-auto">
                {/* ARCHIVE PAGE VIEW */}
                {setpage === "archive" && (
                    <EnrollmentArchive {...{setpage, myStudents, handleAddNewChild, setChildFirst, setChildMiddle, setChildLast, setSuffix, setAge, setSex, setStudentType, setPrevSchool, setLevel, setGrade, setFiles, setPaymentMethod, setEditingStudent, setPage}} />
                )}

                {/* ENROLLMENT FORM VIEW */}
                {setpage === "personal" && (
                    <div className='bg-white shadow-2xl rounded-sm border border-gray-300 overflow-hidden'>
                        <div className="text-center py-8 border-b-2 border-gray-100 bg-white">
                            <img className='w-20 mx-auto mb-2 opacity-90' src={logo} alt="" />
                            <h2 className="text-2xl font-black text-gray-800">MYRTLE CHRISTIAN SCHOOL, INC.</h2>
                            <p className='text-xs font-medium text-gray-500'>SAN JUAN, IROSIN, SORSOGON</p>
                            <h3 className="text-lg font-bold mt-4 tracking-[0.2em] text-gray-700 uppercase">Record of Payment – S.Y. {currentSY || "---"}</h3>
                        </div>

                        <div className="p-8 space-y-8">
                            <section>
                                <div className='flex items-center gap-2 mb-4 border-b border-green-800 pb-1'>
                                    <div className='w-2 h-6 bg-green-800'></div>
                                    <h4 className='font-black text-green-900 uppercase tracking-wider italic'>Pupil Information</h4>
                                </div>
                                <div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
                                    <div className='flex flex-col gap-1'>
                                        <label className='text-[11px] font-bold text-gray-400 uppercase tracking-widest'>First Name</label>
                                        <input className='border-b-2 border-gray-200 focus:border-green-800 outline-none py-2 font-semibold text-gray-800 bg-transparent transition-colors' type="text" placeholder='e.g. Juan' value={childFirst} onChange={(e)=>setChildFirst(e.target.value)} />
                                    </div>
                                    <div className='flex flex-col gap-1'>
                                        <label className='text-[11px] font-bold text-gray-400 uppercase tracking-widest'>Middle Name</label>
                                        <input className='border-b-2 border-gray-200 focus:border-green-800 outline-none py-2 font-semibold text-gray-800 bg-transparent transition-colors' type="text" placeholder='e.g. Dela Cruz' value={childMiddle} onChange={(e)=>setChildMiddle(e.target.value)} />
                                    </div>
                                    <div className='flex flex-col gap-1'>
                                        <label className='text-[11px] font-bold text-gray-400 uppercase tracking-widest'>Last Name</label>
                                        <input className='border-b-2 border-gray-200 focus:border-green-800 outline-none py-2 font-semibold text-gray-800 bg-transparent transition-colors' type="text" placeholder='e.g. Santos' value={childLast} onChange={(e)=>setChildLast(e.target.value)} />
                                    </div>
                                    <div className='flex flex-col gap-1'>
                                        <label className='text-[11px] font-bold text-gray-400 uppercase tracking-widest'>Suffix</label>
                                        <select className="border-b-2 border-gray-200 focus:border-green-800 outline-none py-2 font-semibold bg-transparent transition-colors" value={suffix} onChange={(e)=>setSuffix(e.target.value)}>
                                            <option value="none">None</option><option value="Jr.">Jr.</option><option value="Sr.">Sr.</option>
                                        </select>
                                    </div>
                                </div>
                            </section>

                            <div className='grid grid-cols-1 lg:grid-cols-3 gap-10'>
                                <div className='lg:col-span-1 space-y-6'>
                                    <div className='flex flex-col'>
                                        <label className='text-[11px] font-bold text-gray-400 uppercase'>Student Type</label>
                                        <select className="border rounded px-3 py-2 mt-1 focus:ring-2 ring-green-100 outline-none border-gray-200 font-bold" value={studentType} onChange={(e) => setStudentType(e.target.value)}>
                                            <option value="">Select Type</option>
                                            <option value="New">New Student</option>
                                            <option value="Old">Old Student</option>
                                            <option value="Transferee">Transferee</option>
                                        </select>
                                    </div>

                                    {studentType === "Transferee" && (
                                        <div className='flex flex-col animate-in fade-in duration-300'>
                                            <label className='text-[11px] font-bold text-gray-400 uppercase'>Previous School</label>
                                            <input type="text" className="border rounded px-3 py-2 mt-1 focus:ring-2 ring-green-100 outline-none border-gray-200 font-bold" placeholder="Last School Attended" value={prevSchool} onChange={(e) => setPrevSchool(e.target.value)} />
                                        </div>
                                    )}

                                    <div className='grid grid-cols-2 gap-4'>
                                        <div className='flex flex-col'>
                                            <label className='text-[11px] font-bold text-gray-400 uppercase'>Age</label>
                                            <input type="number" className="border rounded px-3 py-2 mt-1 focus:ring-2 ring-green-100 outline-none border-gray-200 font-bold" value={age} onChange={(e)=>setAge(e.target.value)} />
                                        </div>
                                        <div className='flex flex-col'>
                                            <label className='text-[11px] font-bold text-gray-400 uppercase'>Sex</label>
                                            <select className="border rounded px-3 py-2 mt-1 focus:ring-2 ring-green-100 outline-none border-gray-200 font-bold" value={sex} onChange={(e)=>setSex(e.target.value)}>
                                                <option value="">Select</option><option value="Male">Male</option><option value="Female">Female</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className='flex flex-col'>
                                        <label className='text-[11px] font-bold text-gray-400 uppercase'>Level</label>
                                        <select className="border rounded px-3 py-2 mt-1 focus:ring-2 ring-green-100 outline-none border-gray-200 font-bold" value={level} onChange={(e) => {setLevel(e.target.value); setGrade("");}}>
                                            <option value="">Select</option><option value="Preschool">Preschool</option><option value="Elementary">Elementary</option>
                                        </select>
                                    </div>

                                    <div className='flex flex-col'>
                                        <label className='text-[11px] font-bold text-gray-400 uppercase'>Grade</label>
                                        <select className="border rounded px-3 py-2 mt-1 focus:ring-2 ring-green-100 outline-none border-gray-200 font-bold" value={grade} onChange={(e) => setGrade(e.target.value)} disabled={!level}>
                                            <option value="">Select</option>
                                            {level === "Preschool" ? <><option value="Nursery">Nursery</option><option value="Kinder">Kinder</option></> : <><option value="1">Grade 1</option><option value="2">Grade 2</option><option value="3">Grade 3</option><option value="4">Grade 4</option><option value="5">Grade 5</option><option value="6">Grade 6</option></>}
                                        </select>
                                    </div>

                                    <div className='pt-4 border-t'>
                                        <h5 className='text-[10px] font-black uppercase text-gray-400 mb-3 tracking-widest'>Required Documents</h5>
                                        <div className='space-y-3'>
                                            <div className='flex justify-between items-center text-xs p-2 bg-gray-50 rounded border border-dashed'>
                                                <span className='font-semibold'>Birth Cert</span>
                                                <input className='w-24 text-[10px]' type="file" onChange={(e)=>setFiles({...files, birthCert: e.target.files[0]})} />
                                            </div>
                                            <div className='flex justify-between items-center text-xs p-2 bg-gray-50 rounded border border-dashed'>
                                                <span className='font-semibold'>Report Card</span>
                                                <input className='w-24 text-[10px]' type="file" onChange={(e)=>setFiles({...files, reportCard: e.target.files[0]})} />
                                            </div>
                                            <div className='flex justify-between items-center text-xs p-2 bg-gray-50 rounded border border-dashed'>
                                                <span className='font-semibold'>2x2 ID Picture</span>
                                                <input className='w-24 text-[10px]' type="file" onChange={(e)=>setFiles({...files, idPicture: e.target.files[0]})} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className='lg:col-span-2'>
                                    <div className='overflow-x-auto border-2 border-gray-800 rounded-sm'>
                                        <table className='w-full text-center border-collapse text-[10px] font-bold'>
                                            <thead className='bg-gray-100 border-b-2 border-gray-800'>
                                                <tr>
                                                    <th className='border-r border-gray-800 p-2'>REG. FEE</th>
                                                    <th className='border-r border-gray-800 p-2'>MISC.</th>
                                                    <th className='border-r border-gray-800 p-2'>BOOKS</th>
                                                    <th className='border-r border-gray-800 p-2'>INSTRUCTIONAL</th>
                                                    <th className='border-r border-gray-800 p-2'>UNIFORM</th>
                                                    <th className='border-r border-gray-800 p-2'>PTA</th>
                                                    <th className='bg-green-900 text-white p-2'>TOTAL INITIAL</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr className='bg-white'>
                                                    <td className='border-r border-gray-200 py-3 italic'>₱{level ? tuitionFees[level].registration : '0'}</td>
                                                    <td className='border-r border-gray-200 py-3 italic'>₱{level ? tuitionFees[level].misc : '0'}</td>
                                                    <td className='border-r border-gray-200 py-3 italic'>₱{level ? tuitionFees[level].books : '0'}</td>
                                                    <td className='border-r border-gray-200 py-3 italic'>₱{level ? tuitionFees[level].instructional : '0'}</td>
                                                    <td className='border-r border-gray-200 py-3 italic'>₱{level ? tuitionFees[level].uniform : '0'}</td>
                                                    <td className='border-r border-gray-200 py-3 italic'>₱{level ? tuitionFees[level].pta : '0'}</td>
                                                    <td className='py-3 text-sm font-black text-green-900'>
                                                        ₱{level ? (tuitionFees[level].registration + tuitionFees[level].misc + tuitionFees[level].books + tuitionFees[level].instructional + tuitionFees[level].uniform + tuitionFees[level].pta).toLocaleString() : '0'}
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                        
                                        <div className='bg-gray-800 text-white text-[9px] py-1 px-2 uppercase tracking-tighter flex justify-between'>
                                            <span>Monthly Payment Ledger Calendar</span>
                                            <span>S.Y. {currentSY}</span>
                                        </div>
                                        <div className='grid grid-cols-5 md:grid-cols-10 border-t border-gray-800'>
                                            {(level ? tuitionFees[level].months : ["JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC", "JAN", "FEB", "MAR"]).map(m => (
                                                <div key={m} className='border-r border-b border-gray-300 py-2 bg-white flex flex-col items-center justify-center min-h-[50px]'>
                                                    <span className='text-[8px] text-gray-400 leading-none'>{m}</span>
                                                    <span className='text-[10px] text-green-900'>₱{level ? tuitionFees[level].monthlyRate : '---'}</span>
                                                    <div className='w-full mt-1 border-t border-gray-100 flex justify-center py-0.5'>
                                                        <div className='w-2 h-2 rounded-full bg-red-400 animate-pulse'></div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className='mt-6 bg-green-900 p-5 rounded-sm text-white flex flex-col md:flex-row items-center justify-between gap-4'>
                                        <div>
                                            <p className='text-xs font-bold uppercase opacity-80'>Payment Method</p>
                                            <select className='bg-transparent border-b border-white outline-none font-black text-lg py-1' value={paymentMethod} onChange={(e)=>setPaymentMethod(e.target.value)}>
                                                <option className='text-black' value="">Choose Method</option>
                                                <option className='text-black' value="Cash">Cash</option>
                                                <option className='text-black' value="GCash">GCash</option>
                                            </select>
                                        </div>
                                        {paymentMethod === "GCash" && (
                                            <div className='flex flex-col items-center md:items-end'>
                                                <label className='text-[10px] font-bold uppercase mb-1'>Proof of Transfer</label>
                                                <input type="file" className='text-[10px] bg-white text-black p-1 rounded cursor-pointer' onChange={(e)=>setPaymentProof(e.target.files[0])} />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <section className='grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t-4 border-double border-gray-200'>
                                <div className='space-y-4'>
                                    <h4 className='text-xs font-black text-gray-800 uppercase flex items-center gap-2'>Family & Address</h4>
                                    <div className='bg-gray-50 p-4 rounded border grid grid-cols-2 gap-y-3 gap-x-6'>
                                        <div>
                                            <p className='text-[9px] font-bold text-gray-400 uppercase'>Father</p>
                                            <p className='text-xs font-bold'>{userData.spouse?.firstname} {userData.spouse?.lastname}</p>
                                        </div>
                                        <div>
                                            <p className='text-[9px] font-bold text-gray-400 uppercase'>Mother</p>
                                            <p className='text-xs font-bold'>{userData.parent?.firstname} {userData.parent?.lastname}</p>
                                        </div>
                                        <div className='col-span-2 pt-2 border-t border-gray-200'>
                                            <p className='text-[9px] font-bold text-gray-400 uppercase'>Permanent Address</p>
                                            <p className='text-xs font-medium text-gray-600'>{fullAddress}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className='flex flex-col justify-end items-end'>
                                    <p className='text-[10px] text-gray-400 italic mb-4 text-right'>Terms apply for S.Y. {currentSY}. Submission is subject to review.</p>
                                    <button 
                                        onClick={handleSubmitEnrollment} 
                                        disabled={isSubmitting} 
                                        className={`w-full md:w-auto px-16 py-4 rounded-sm font-black uppercase tracking-widest text-sm transition-all shadow-xl ${isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-900 text-white hover:bg-black hover:-translate-y-1'}`}
                                    >
                                        {isSubmitting ? "Processing..." : "Submit Enrollment"}
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