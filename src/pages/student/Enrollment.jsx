import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { doc, getDoc, updateDoc, serverTimestamp, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
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

    // --- IDADAGDAG NA DATA PARA SA REAL-WORLD CALENDAR ---
    const tuitionFees = {
        "Preschool": { 
            registration: 1000, misc: 500, books: 1200, instructional: 500, uniform: 800, pta: 200,
            monthlyRate: 900,
            months: ["JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC", "JAN", "FEB", "MAR"]
        },
        "Elementary": { 
            registration: 1500, misc: 800, books: 2000, instructional: 700, uniform: 1000, pta: 200,
            monthlyRate: 1100,
            months: ["JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC", "JAN", "FEB", "MAR"]
        }
    };

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

    useEffect(() => {
        const setOffline = async () => {
            const user = auth.currentUser;
            if (!user) return;
            const userRef = doc(db, "users", user.uid);
            await updateDoc(userRef, { isOnline: false, lastActive: serverTimestamp() });
        };
        window.addEventListener("beforeunload", setOffline);
        return () => window.removeEventListener("beforeunload", setOffline);
    }, []);

    const fetchMyStudents = async (uid) => {
        try {
            const q = query(collection(db, "students"), where("parentUID", "==", uid));
            const snap = await getDocs(q);
            const studentList = await Promise.all(snap.docs.map(async (studentDoc) => {
                const studentData = studentDoc.data();
                const enrDoc = await getDoc(doc(db, "enrollments", `ENR-${studentData.studentID}`));
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
    }, [navigate]);

    if (!userData) return <p>Loading...</p>;

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
        setPage("personal");
    };

    const getSchoolYear = () => {
        const now = new Date();
        let year = now.getFullYear();
        if (now.getMonth() < 5) year = year - 1;
        return `${year}-${year + 1}`;
    };

    const handleSubmitEnrollment = async () => {
        if (!level || !childFirst || !childLast) {
            sileo.error({ title: "Missing Info", description: "Please fill up Student Info" });
            return;
        }
        setIsSubmitting(true);
        try {
            const studentID = editingStudent ? editingStudent.studentID : `2026-${childLast[0].toUpperCase()}${childFirst[0].toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
            const [birthUrl, cardUrl, picUrl, gcashUrl] = await Promise.all([
                uploadToCloudinary(files.birthCert), uploadToCloudinary(files.reportCard),
                uploadToCloudinary(files.idPicture), uploadToCloudinary(paymentProof)
            ]);

            // --- SAVE STUDENT (RETAINED ALL FIELDS) ---
            await setDoc(doc(db, "students", studentID), {
                studentID, parentUID: auth.currentUser.uid,
                firstname: childFirst, middlename: childMiddle, lastname: childLast, suffix,
                level, grade, age: Number(age), sex, studentType,
                previousSchool: studentType === "Transferee" ? prevSchool : "",
                isEnrolled: false, status: "Pending",
                requirements: { birthCert: birthUrl, reportCard: cardUrl, idPicture: picUrl },
                address: userData.address, father: userData.spouse, mother: userData.parent,
                schoolYear: getSchoolYear(), createdAt: serverTimestamp()
            });

            // --- SAVE ENROLLMENT WITH MONTHLY CALENDAR DATA ---
            await setDoc(doc(db, "enrollments", `ENR-${studentID}`), {
                studentID, parentUID: auth.currentUser.uid, schoolYear: getSchoolYear(),
                fees: tuitionFees[level],
                monthlyTracking: tuitionFees[level].months.reduce((acc, month) => {
                    acc[month] = { status: "Unpaid", amount: tuitionFees[level].monthlyRate };
                    return acc;
                }, {}),
                payment: { method: paymentMethod, proofImage: gcashUrl, status: "Pending", dateEnrolled: serverTimestamp() }
            });

            sileo.success({ title: "Enrollment Successful", description: "Pending Admin Approval" });
            fetchMyStudents(auth.currentUser.uid);
            setEditingStudent(null);
            setPage("archive");
        } catch (err) { sileo.error({ title: "Error", description: err.message }); } 
        finally { setIsSubmitting(false); }
    };

    const fullAddress = `${userData.address.purok}, ${userData.address.barangay}, ${userData.address.city}, ${userData.address.province}`;

    return (
        <div className='min-h-screen bg-gray-200'>
            <Toaster position="top-center" richColors={false} />
            <header className='bg-white flex items-center gap-5 p-2'>
                <img className='w-12 object-contain' src={logo} alt="" />
                <h1 className='font-semibold'>Myrtle Christian School</h1>
                <div className="relative">
                    <button onClick={toggleDropdown} className="inline-flex bg-neutral-200 px-10 py-2 text-[#2D5B60] font-semibold">Application</button>
                    {isOpen && (
                        <div className="z-10 absolute p-1 bg-white rounded-lg mt-4 shadow-lg w-72">
                            <ul>
                                <li>
                                    <button onClick={() => { setPage("personal"); handleAddNewChild(); setIsOpen(false); }} className="flex items-center gap-2 w-full p-2 hover:bg-[#2D5B60] hover:text-white">
                                        <img className='w-5' src={user} alt="" /> Enrollment Form
                                    </button>
                                </li>
                                <li>
                                    <button onClick={() => { setPage("archive"); setIsOpen(false); }} className="flex items-center gap-2 w-full p-2 hover:bg-[#2D5B60] hover:text-white">
                                        <img className='w-5' src={archive} alt="" /> Archive
                                    </button>
                                </li>
                            </ul>
                        </div>
                    )}
                </div>
                <div className="absolute right-2 flex items-center gap-3">
                    <img onClick={() => setOpen(!open)} className="w-10 h-10 rounded-full border cursor-pointer" src={userData.profilePicture || deaf} alt="" />
                    <h1>{userData.parent?.firstname} {userData.parent?.middlename} {userData.parent?.lastname}</h1>
                    {open && (
                        <div className="absolute top-12 right-0 bg-white shadow-xl border rounded p-2 w-32 z-50">
                            <button onClick={async () => { await auth.signOut(); navigate("/auth"); }} className="text-red-500 text-sm w-full text-left p-1">Logout</button>
                        </div>
                    )}
                </div>
            </header>

            <div className="min-h-screen bg-gray-100 text-gray-700 text-[15px] w-full p-5">
                <EnrollmentArchive {...{setpage, myStudents, handleAddNewChild, setChildFirst, setChildMiddle, setChildLast, setSuffix, setAge, setSex, setStudentType, setPrevSchool, setLevel, setGrade, setFiles, setPaymentMethod, setEditingStudent, setPage}} />

                {setpage === "personal" && (
                    <div className='flex flex-col gap-2'>
                        {/* --- CHILD INFORMATION (RETAINED ALL YOUR ORIGINAL INPUTS) --- */}
                        <div className="bg-white p-6 border-t-8 border-[#2D5B60] rounded shadow ">
                            <h2 className="text-xl font-semibold mb-4 text-[#2D5B60]">Enrollment Form (S.Y. {getSchoolYear()})</h2>
                            <h2 className='flex items-center text-lg gap-2 font-semibold'><img className='w-5' src={user} alt="" />Child Information</h2>
                            <div className='flex gap-5 mt-2'>
                                <div className='flex flex-col gap-1'>
                                    <label className='flex gap-1'><span className='text-red-600'>*</span>Firstname</label>
                                    <input className='rounded-lg border outline-green-800 text-neutral-600 py-1 px-6' type="text" placeholder='Juan' value={childFirst} onChange={(e)=>setChildFirst(e.target.value)} />
                                </div>
                                <div className='flex flex-col gap-1'>
                                    <label className='flex gap-1'><span className='text-red-600'>*</span>Middle</label>
                                    <input className='rounded-lg border outline-green-800 text-neutral-600 py-1 px-6' type="text" placeholder='Dela' value={childMiddle} onChange={(e)=>setChildMiddle(e.target.value)} />
                                </div>
                                <div className='flex flex-col gap-1'>
                                    <label className='flex gap-1'><span className='text-red-600'>*</span>Lastname</label>
                                    <input className='rounded-lg border outline-green-800 text-neutral-600 py-1 px-6' type="text" placeholder='Cruz' value={childLast} onChange={(e)=>setChildLast(e.target.value)} />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label>Suffix</label>
                                    <select className="border rounded px-2 py-1" value={suffix} onChange={(e)=>setSuffix(e.target.value)}>
                                        <option value="none">None</option><option value="Jr.">Jr.</option><option value="Sr.">Sr.</option>
                                    </select>
                                </div>
                            </div>

                            <div className='flex items-center mt-2 gap-5'>
                                <div className="flex gap-1 flex-col w-56">
                                    <label><span className="text-red-500">*</span>Age</label>
                                    <input type="number" className="border rounded-lg px-3 py-1" value={age} onChange={(e)=>setAge(e.target.value)} />
                                </div>
                                <div className="flex flex-col w-56">
                                    <label>Sex</label>
                                    <select className="border rounded-lg px-3 py-1" value={sex} onChange={(e)=>setSex(e.target.value)}>
                                        <option value="">Select</option><option value="Male">Male</option><option value="Female">Female</option>
                                    </select>
                                </div>
                                <div className="flex flex-col w-56">
                                    <label>Student Type</label>
                                    <select className="border rounded-lg px-3 py-1" value={studentType} onChange={(e) =>setStudentType(e.target.value)}>
                                        <option value="">Select</option><option value="New">New</option><option value="Old">Old</option><option value="Transferee">Transferee</option>
                                    </select>
                                </div>
                                {studentType === "Transferee" && (
                                    <div className="flex flex-col w-96">
                                        <label>Previous School</label>
                                        <input type="text" className="border rounded-lg px-3 py-1" value={prevSchool} onChange={(e)=>setPrevSchool(e.target.value)} />
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-5 mt-2">
                                <div className="flex flex-col w-56">
                                    <label>Level</label>
                                    <select className="border rounded-lg px-3 py-1" value={level} onChange={(e) => {setLevel(e.target.value); setGrade("");}}>
                                        <option value="">Select</option><option value="Preschool">Preschool</option><option value="Elementary">Elementary</option>
                                    </select>
                                </div>
                                <div className="flex flex-col w-56">
                                    <label>Grade</label>
                                    <select className="border rounded-lg px-3 py-1" value={grade} onChange={(e) => setGrade(e.target.value)} disabled={!level}>
                                        <option value="">Select</option>
                                        {level === "Preschool" ? <><option value="Nursery">Nursery</option><option value="Kinder">Kinder</option></> : <><option value="1">Grade 1</option><option value="2">Grade 2</option></>}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* --- REQUIREMENTS SECTION (RETAINED) --- */}
                        <div className="bg-white p-6 border-t-8 border-[#2D5B60] rounded shadow mt-2">
                            <h2 className='text-lg font-bold mb-4 uppercase'>Requirements Upload</h2>
                            <div className='grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-bold'>
                                <div><label>Birth Certificate</label><input type="file" onChange={(e)=>setFiles({...files, birthCert: e.target.files[0]})} /></div>
                                <div><label>Report Card</label><input type="file" onChange={(e)=>setFiles({...files, reportCard: e.target.files[0]})} /></div>
                                <div><label>1x1 ID Picture</label><input type="file" onChange={(e)=>setFiles({...files, idPicture: e.target.files[0]})} /></div>
                            </div>
                        </div>

                        {/* --- TUITION & CALENDAR (DITO KO PINAGSAMANG ORIGINAL AT REAL-WORLD) --- */}
                        <div className="bg-white p-6 border-t-8 border-[#2D5B60] rounded shadow mt-2">
                            <h2 className='text-lg font-bold mb-4 uppercase'>Tuition & Payment Calendar</h2>
                            {level && (
                                <>
                                    <div className='flex justify-between items-center bg-gray-50 p-4 rounded mb-4'>
                                        <span className='font-bold text-[#2D5B60]'>Initial Enrollment Fee: ₱{(Object.values(tuitionFees[level]).reduce((a,b)=> typeof b === 'number' ? a+b : a, 0)).toLocaleString()}</span>
                                        <div className='flex gap-4'>
                                            <select className='border p-1 rounded' value={paymentMethod} onChange={(e)=>setPaymentMethod(e.target.value)}>
                                                <option value="">Method</option><option value="Cash">Cash</option><option value="GCash">GCash</option>
                                            </select>
                                            {paymentMethod === "GCash" && <input type="file" className='text-[10px]' onChange={(e)=>setPaymentProof(e.target.files[0])} />}
                                        </div>
                                    </div>
                                    
                                    {/* --- REAL WORLD CALENDAR GRID --- */}
                                    <div className='grid grid-cols-5 gap-3'>
                                        {tuitionFees[level].months.map(m => (
                                            <div key={m} className='border p-2 rounded-lg text-center bg-neutral-50 shadow-sm'>
                                                <p className='text-[10px] font-bold text-gray-400'>{m}</p>
                                                <p className='font-bold text-[#2D5B60]'>₱{tuitionFees[level].monthlyRate}</p>
                                                <div className='text-[9px] bg-red-100 text-red-600 rounded mt-1 font-bold'>UNPAID</div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* --- FATHER INFO (RETAINED) --- */}
                        <div className="bg-white p-6 border-t-8 border-[#2D5B60] rounded shadow mt-2">
                            <h2 className='flex items-center text-lg gap-2 font-semibold'><img className='w-5' src={user} alt="" /> Father Information</h2>
                            <div className='flex gap-5 mt-2'>
                                <div><label>Firstname</label><input className='rounded-lg border px-3 py-1 w-56' type="text" value={userData.spouse.firstname} disabled /></div>
                                <div><label>Middlename</label><input className='rounded-lg border px-3 py-1 w-56' type="text" value={userData.spouse.middlename} disabled /></div>
                                <div><label>Lastname</label><input className='rounded-lg border px-3 py-1 w-56' type="text" value={userData.spouse.lastname} disabled /></div>
                            </div>
                        </div>

                        {/* --- MOTHER INFO (RETAINED) --- */}
                        <div className="bg-white p-6 border-t-8 border-[#2D5B60] rounded shadow mt-2">
                            <h2 className='flex items-center text-lg gap-2 font-semibold'><img className='w-5' src={user} alt="" /> Mother Information</h2>
                            <div className='flex gap-5 mt-2'>
                                <div className='w-56'><label>Firstname</label><input className='rounded-lg border px-3 py-1 w-full' type="text" value={userData.parent.firstname} disabled /></div>
                                <div className='w-56'><label>Middlename</label><input className='rounded-lg border px-3 py-1 w-full' type="text" value={userData.parent.middlename} disabled /></div>
                                <div className='w-56'><label>Lastname</label><input className='rounded-lg border px-3 py-1 w-full' type="text" value={userData.parent.lastname} disabled /></div>
                            </div>
                        </div>

                        {/* --- ADDRESS (RETAINED) --- */}
                        <div className="bg-white mt-2 p-6 border-t-8 border-[#2D5B60] rounded shadow w-full">
                            <h2 className='flex items-center text-lg gap-2 font-semibold'><img className='w-5' src={location} alt="" />Full Address</h2>
                            <div className='mt-2'><input className='rounded-lg border px-3 py-1 w-full' type="text" value={fullAddress} disabled /></div>
                        </div>

                        <div className='bg-white flex justify-end w-full p-2 mt-2'>
                            <button onClick={handleSubmitEnrollment} disabled={isSubmitting} className='bg-[#2D5B60] text-white px-10 py-2 rounded-lg font-semibold uppercase hover:bg-black transition-all'>
                                {isSubmitting ? "Processing..." : "Submit Enrollment"}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Enrollment;