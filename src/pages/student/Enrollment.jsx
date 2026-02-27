import React, { useEffect, useState } from 'react';
import { doc, getDoc, updateDoc, serverTimestamp, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../../services/firebase';
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from 'react-router-dom';
import deaf from '../../assets/default.png'
import logo from '../../assets/logo.png'
import user from '../../assets/icons/user.png'
import usericon from '../../assets/icons/usericon.png'
import archive from '../../assets/icons/archive.png'
import location from '../../assets/icons/location.png'

const Enrollment = () => {
    const [isOpen, setIsOpen] = useState(false);
    const toggleDropdown = () => setIsOpen(!isOpen);
    const [open, setOpen] = useState(false);
    const [page, setpage] = useState("personal");
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

    // --- FIX: FETCHING FROM STUDENTS COLLECTION ---
    const [myStudents, setMyStudents] = useState([]);

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
                receiptUrl: enrDoc.exists() ? enrDoc.data().payment.proofImage : "" // Dito kukuha ng image link
            };
        }));

        setMyStudents(studentList);
    } catch (error) {
        console.error("Error fetching students:", error);
    }
};
    const tuitionFees = {
        "Preschool": { registration: 1000, misc: 500, books: 1200, instructional: 500, uniform: 800, pta: 200 },
        "Elementary": { registration: 1500, misc: 800, books: 2000, instructional: 700, uniform: 1000, pta: 200 }
    };

    const uploadToCloudinary = async (file) => {
        if (!file) return "";
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
        try {
            const res = await fetch(`https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`, {
                method: "POST",
                body: formData,
            });
            const data = await res.json();
            return data.secure_url;
        } catch (err) {
            console.error(err);
            return "";
        }
    };

    const handleSubmitEnrollment = async () => {
        if (!level || !childFirst || !childLast) return alert("Please fill up Student Info.");
        setIsSubmitting(true);
        try {
            const studentID = `2026-${childLast.substring(0,1).toUpperCase()}${childFirst.substring(0,1).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

            const [birthUrl, cardUrl, picUrl, gcashUrl] = await Promise.all([
                uploadToCloudinary(files.birthCert),
                uploadToCloudinary(files.reportCard),
                uploadToCloudinary(files.idPicture),
                uploadToCloudinary(paymentProof)
            ]);

            // Save to students
            await setDoc(doc(db, "students", studentID), {
                studentID,
                parentUID: auth.currentUser.uid,
                firstname: childFirst,
                middlename: childMiddle,
                lastname: childLast,
                level, grade, age: Number(age), sex, 
                previousSchool: prevSchool,
                isEnrolled: false,
                requirements: { birthCert: birthUrl, reportCard: cardUrl, idPicture: picUrl },
                address: userData.address, 
                father: userData.spouse,   
                mother: userData.parent,   
                createdAt: serverTimestamp()
            });

            // Save to enrollments (Dagdagan natin ng parentUID para siguradong searchable rin dito)
            await setDoc(doc(db, "enrollments", `ENR-${studentID}`), {
                studentID,
                parentUID: auth.currentUser.uid, 
                schoolYear: "2025-2026",
                fees: tuitionFees[level],
                payment: { method: paymentMethod, proofImage: gcashUrl, status: "Pending", dateEnrolled: serverTimestamp() }
            });

            alert("Enrollment Successful!");
            fetchMyStudents(auth.currentUser.uid); 
            setpage("archive");
        } catch (err) {
            alert("Error: " + err.message);
        } finally { setIsSubmitting(false); }
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

    const fullAddress = `${userData.address.purok}, ${userData.address.barangay}, ${userData.address.city}, ${userData.address.province}`;

    return (
        <div className='min-h-screen bg-gray-200'>
            <header className=' bg-white flex items-center gap-5 p-2'>
                <img className='w-12 object-contain' src={logo} alt="" />
                <h1 className=' font-semibold'>Myrtle Christian School</h1>
                <h1></h1>
                
                <div className="relative">
                    <button onClick={toggleDropdown} className="inline-flex bg-neutral-200 px-10 py-2 text-[#2D5B60] font-semibold items-center justify-center">
                        Application
                        <svg className="w-4 h-4 ms-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 9-7 7-7-7" /></svg>
                    </button>
                    {isOpen && (
                        <div className="z-10 absolute p-1 bg-white rounded-lg mt-4 shadow-lg w-72">
                            <ul className="text-body font-medium">
                                <li><button onClick={() => {setpage("personal"); setIsOpen(false);}} className="flex items-center gap-2 w-full p-2 hover:bg-[#2D5B60] hover:text-white transition-all"><img className='w-5' src={user} alt="" />Enrollment Form</button></li>
                                <li><button onClick={() => {setpage("archive"); setIsOpen(false);}} className="flex items-center gap-2 w-full p-2 hover:bg-[#2D5B60] hover:text-white transition-all"><img className='w-5' src={archive} alt="" />Archive</button></li>
                            </ul>
                        </div>
                    )}
                </div>

                <div className="absolute right-2 flex items-center gap-3">
                    <img onClick={()=>setOpen(!open)} className="w-10 h-10 rounded-full border cursor-pointer" src={userData.profilePicture || deaf} alt="" />
                    {open && (
                        <div className="absolute top-12 right-0 bg-white shadow-xl border rounded p-2 w-32 z-50">
                            <button onClick={async() => {await auth.signOut(); navigate("/auth");}} className="text-red-500 text-sm w-full text-left p-1">Logout</button>
                        </div>
                    )}
                </div>
            </header>

            <div className="min-h-screen bg-gray-100 text-gray-700 text-[15px] w-full p-5">
                {page === "personal" && (
                    <div className='flex flex-col gap-2'>
                        {/* PERSONAL FORM AREA - UNTOUCHED */}
                        <div className="bg-white p-6 border-t-8 border-[#2D5B60] rounded shadow ">
                            <h2 className="text-xl font-semibold mb-4 text-[#2D5B60]">Enrollment Form (S.Y. 2025-2026)</h2>
                            <h2 className='flex items-center text-lg gap-2 font-semibold'><img className='w-5' src={user} alt="" />Child Information</h2>
                            <div className='flex gap-5 mt-2'>
                                <div className='flex flex-col gap-1'>
                                    <h1 className='flex gap-1'><span className='text-red-600'>*</span>Firstname</h1>
                                    <input className='rounded-lg border outline-green-800 text-neutral-600 py-1 px-6' type="text" placeholder='Juan' onChange={(e)=>setChildFirst(e.target.value)} />
                                </div>
                                <div className='flex flex-col gap-1'>
                                    <h1 className='flex gap-1'><span className='text-red-600'>*</span>Middle</h1>
                                    <input className='rounded-lg border outline-green-800 text-neutral-600 py-1 px-6' type="text" placeholder='Dela' onChange={(e)=>setChildMiddle(e.target.value)} />
                                </div>
                                <div className='flex flex-col gap-1'>
                                    <h1 className='flex gap-1'><span className='text-red-600'>*</span>Lastname</h1>
                                    <input className='rounded-lg border outline-green-800 text-neutral-600 py-1 px-6' type="text" placeholder='Cruz' onChange={(e)=>setChildLast(e.target.value)} />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="flex gap-1">Suffix</label>
                                    <select className="border rounded px-2 py-1" onChange={(e)=>setSuffix(e.target.value)}>
                                        <option value="none">None</option><option value="Jr.">Jr.</option><option value="Sr.">Sr.</option>
                                    </select>
                                </div>
                            </div>
                            <div className='flex items-center mt-2 gap-5'>
                                <div className="flex gap-1 flex-col w-56">
                                    <label><span className="text-red-500">*</span>Age</label>
                                    <input type="number" className="border rounded-lg px-3 py-1" onChange={(e)=>setAge(e.target.value)} />
                                </div>
                                <div className="flex flex-col w-56">
                                    <label>Sex</label>
                                    <select className="border rounded-lg px-3 py-1" onChange={(e)=>setSex(e.target.value)}>
                                        <option value="">Select</option><option value="Male">Male</option><option value="Female">Female</option>
                                    </select>
                                </div>
                                <div className="flex flex-col w-56">
                                    <label>Student Type</label>
                                    <select className="border rounded-lg px-3 py-1" value={studentType} onChange={(e) => setStudentType(e.target.value)}>
                                        <option value="">Select</option><option value="New">New</option><option value="Old">Old</option><option value="Transferee">Transferee</option>
                                    </select>
                                </div>
                                {studentType === "Transferee" && (
                                    <div className="flex flex-col w-96">
                                        <label>Previous School</label>
                                        <input type="text" className="border rounded-lg px-3 py-1" onChange={(e)=>setPrevSchool(e.target.value)} />
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

                        <div className="bg-white p-6 border-t-8 border-[#2D5B60] rounded shadow mt-2">
                            <h2 className='text-lg font-bold mb-4 uppercase'>Requirements Upload</h2>
                            <div className='grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-bold'>
                                <div><label>Birth Certificate</label><input type="file" onChange={(e)=>setFiles({...files, birthCert: e.target.files[0]})} /></div>
                                <div><label>Report Card</label><input type="file" onChange={(e)=>setFiles({...files, reportCard: e.target.files[0]})} /></div>
                                <div><label>1x1 ID Picture</label><input type="file" onChange={(e)=>setFiles({...files, idPicture: e.target.files[0]})} /></div>
                            </div>
                        </div>

                        <div className="bg-white p-6 border-t-8 border-[#2D5B60] rounded shadow mt-2">
                            <h2 className='text-lg font-bold mb-4 uppercase'>Tuition & Payment</h2>
                            {level && (
                                <div className='flex justify-between items-center bg-gray-50 p-4 rounded mb-4'>
                                    <span className='font-bold text-[#2D5B60]'>Total Fees: ₱{Object.values(tuitionFees[level]).reduce((a,b)=>a+b,0).toLocaleString()}</span>
                                    <div className='flex gap-4'>
                                        <select className='border p-1 rounded' onChange={(e)=>setPaymentMethod(e.target.value)}>
                                            <option value="">Method</option><option value="Cash">Cash</option><option value="GCash">GCash</option>
                                        </select>
                                        {paymentMethod === "GCash" && <input type="file" className='text-[10px]' onChange={(e)=>setPaymentProof(e.target.files[0])} />}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="bg-white p-6 border-t-8 border-[#2D5B60] rounded h-full shadow w-full mt-2">
                            <h2 className='flex items-center text-lg gap-2 font-semibold'><img className='w-5' src={user} alt="" /> Father Information</h2>
                            <div className='flex gap-5 mt-2'>
                                <div><h1 className='flex gap-2'><span className='text-red-600'>*</span>Firstname</h1><input className='rounded-lg border mt-1 px-3 py-1 w-56' type="text" value={userData.spouse.firstname} disabled /></div>
                                <div><h1 className='flex gap-2'><span className='text-red-600'>*</span>Middlename</h1><input className='rounded-lg mt-1 border px-3 py-1 w-56' type="text" value={userData.spouse.middlename} disabled /></div>
                                <div><h1 className='flex gap-2'><span className='text-red-600'>*</span>Lastname</h1><input className='rounded-lg mt-1 border px-3 py-1 w-56' type="text" value={userData.spouse.lastname} disabled /></div>
                            </div>
                        </div>

                        <div className="bg-white p-6 border-t-8 border-[#2D5B60] rounded h-full shadow w-full mt-2">
                            <h2 className='flex items-center text-lg gap-2 font-semibold'><img className='w-5' src={user} alt="" /> Mother Information</h2>
                            <div className='flex gap-5 mt-2'>
                                <div className='w-56'><label><span className='text-red-600'>*</span> Firstname</label><input className='rounded-lg border text-neutral-600 py-1 px-3 w-full' type="text" value={userData.parent.firstname} disabled /></div>
                                <div className='w-56'><label><span className='text-red-600'>*</span> Middlename</label><input className='rounded-lg border text-neutral-600 py-1 px-3 w-full' type="text" value={userData.parent.middlename} disabled /></div>
                                <div className='w-56'><label><span className='text-red-600'>*</span> Lastname</label><input className='rounded-lg border text-neutral-600 py-1 px-3 w-full' type="text" value={userData.parent.lastname} disabled /></div>
                            </div>
                        </div>

                        <div className="bg-white mt-2 p-6 border-t-8 border-[#2D5B60] rounded shadow w-full">
                            <h2 className='flex items-center text-lg gap-2 font-semibold'><img className='w-5' src={location} alt="" />Full Address</h2>
                            <div className='mt-2'><input className='rounded-lg border px-3 py-1 w-full' type="text" value={fullAddress} disabled /></div>
                        </div>

                        <div className=' bg-white flex justify-end w-full p-2 mt-2'>
                            <button 
                                onClick={handleSubmitEnrollment} 
                                disabled={isSubmitting}
                                className=' bg-[#2D5B60] text-white px-10 py-2 rounded-lg font-semibold uppercase hover:bg-black transition-all'
                            >
                                {isSubmitting ? "Processing..." : "Submit Enrollment"}
                            </button>
                        </div>
                    </div>
                )}

            {page === "archive" && (
    <div className="bg-white p-6 border-t-8 border-[#2D5B60] rounded shadow max-w-5xl mx-auto">
        <h2 className="text-xl font-bold mb-4 text-[#2D5B60]">ENROLLMENT ARCHIVE</h2>
        <div className="grid grid-cols-1 gap-4">
            {myStudents.map((stud, index) => (
                <div key={index} className="border p-5 rounded-lg flex flex-col md:flex-row justify-between bg-gray-50 shadow-sm gap-4">
                    <div className="flex flex-col gap-1">
                        <h3 className="font-bold text-lg uppercase text-gray-800">{stud.firstname} {stud.lastname}</h3>
                        <p className="text-sm text-gray-500">Student ID: <span className="font-semibold text-gray-700">{stud.studentID}</span></p>
                        <p className="text-xs text-gray-400 font-medium uppercase">{stud.level} - {stud.grade}</p>
                    </div>

                    <div className="flex flex-col md:items-end justify-center gap-2 border-t md:border-t-0 pt-3 md:pt-0">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-gray-500 uppercase">Payment:</span>
                            <span className="text-sm font-bold text-[#2D5B60]">
                                {stud.paymentMethod}
                            </span>
                            
                            {/* LALABAS LANG ITONG BUTTON KUNG MAY RESIBO (GCASH) */}
                            {stud.paymentMethod === "GCash" && stud.receiptUrl ? (
                                <a 
                                    href={stud.receiptUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-[10px] bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-700 transition-all font-bold uppercase"
                                >
                                    View Receipt
                                </a>
                            ) : stud.paymentMethod === "Cash" ? (
                                <span className="text-[10px] italic text-gray-400">(Pay at School)</span>
                            ) : null}
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-gray-500 uppercase">Status:</span>
                            <span className={`px-4 py-1 rounded-full text-xs font-bold ${stud.isEnrolled ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>
                                {stud.isEnrolled ? "OFFICIALLY ENROLLED" : "PENDING APPROVAL"}
                            </span>
                        </div>
                    </div>
                </div>
            ))}
            {myStudents.length === 0 && <p className="text-center py-10 text-gray-400 italic">No enrollment records found.</p>}
        </div>
    </div>
)}
            </div>
        </div>
    );
};

export default Enrollment;