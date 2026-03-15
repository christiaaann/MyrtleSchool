import React, { useEffect, useState } from 'react';
// Nagdagdag ng getDocs at where para sa history search
import { collection, onSnapshot, doc, updateDoc, query, orderBy, deleteDoc, getDoc, setDoc, getDocs, where } from 'firebase/firestore';
import { db } from '../../services/firebase';
import UsersSkeleton from '../../components/Skeleton/UsersSkeleton';
import StudentsSkeleton from '../../components/Skeleton/StudentsSkeleton';
const Students = () => {
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [loading, setLoading] = useState(true);


useEffect(() => {
  const q = query(collection(db, "students"), orderBy("createdAt", "desc"));
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setStudents(data);
        setTimeout(() => {
    setLoading(false);
  }, 1000); // <-- loading false after data fetch
  });
  return () => unsubscribe();
}, []);
  const [currentSY, setCurrentSY] = useState("2025-2026");

  useEffect(() => {
    const settingsRef = doc(db, "settings", "schoolYear");
    const unsubSY = onSnapshot(settingsRef, (snap) => {
      if (snap.exists()) {
        setCurrentSY(snap.data().active || "2025-2026");
      }
    });
    return () => unsubSY();
  }, []);

  useEffect(() => {
    const q = query(collection(db, "students"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStudents(data);
    });
    return () => unsubscribe();
  }, []);

  const handleMarkAsPaid = async (month, currentStatus, currentAmount, receiptImage) => {
    if (!selectedStudent) return;
    
    if (receiptImage && currentStatus === "Pending Approval") {
      const viewReceipt = window.confirm(`Parent submitted a receipt for ${month}.\n\nClick OK to VIEW the receipt image.`);
      if (viewReceipt) {
        window.open(receiptImage, "_blank");
        const approveNow = window.confirm(`Is the receipt valid?\n\nClick OK to mark ${month} as PAID.`);
        if (approveNow) {
          await updateFirestoreData(month, "Paid", currentAmount);
          return;
        }
      }
    }

    const action = window.prompt(
      `Set status for ${month}:\nType 'P' for PAID\nType 'U' for UNPAID\nType 'O' for OPEN (to let parents pay)\nType 'A' for PENDING`, 
      currentStatus === "Paid" ? "P" : (currentStatus === "Open" ? "O" : "U")
    );

    if (action === null) return;

    let newStatus = currentStatus;
    const choice = action.toUpperCase();
    if (choice === 'P') newStatus = "Paid";
    else if (choice === 'U') newStatus = "Unpaid";
    else if (choice === 'O') newStatus = "Open";
    else if (choice === 'A') newStatus = "Pending Approval"; 
    else {
      alert("Invalid choice. Please type P, U, O, or A.");
      return;
    }
    
    const inputAmount = window.prompt(`Update amount for ${month}? (Current: ₱${currentAmount})`, currentAmount);
    if (inputAmount === null) return;
    
    const newAmount = Number(inputAmount);

    if(window.confirm(`Update ${month} to ${newStatus.toUpperCase()} with amount ₱${newAmount}?`)) {
      await updateFirestoreData(month, newStatus, newAmount);
    }
  };

  const updateFirestoreData = async (month, status, amount) => {
    try {
      // Gumagamit ng schoolYear na naka-attach sa paymentInfo para sigurado kung anong taon ang ini-update
      const targetSY = selectedStudent.paymentInfo?.schoolYear || currentSY;
      const enrRef = doc(db, "enrollments", `ENR-${targetSY}-${selectedStudent.studentID}`);
      
      await updateDoc(enrRef, {
        [`monthlyTracking.${month}.status`]: status,
        [`monthlyTracking.${month}.amount`]: amount
      });
      
      setSelectedStudent(prev => ({
        ...prev,
        paymentInfo: {
          ...prev.paymentInfo,
          monthlyTracking: {
            ...prev.paymentInfo.monthlyTracking,
            [month]: { 
              ...prev.paymentInfo.monthlyTracking[month], 
              status: status,
              amount: amount 
            }
          }
        }
      }));
      alert("Update successful!");
    } catch (error) {
      alert("Update failed: " + error.message);
    }
  };
 if (loading) return <StudentsSkeleton/>;
  const handleApprove = async (id, studentID) => {
    if(window.confirm(`Approve enrollment for SY ${currentSY}?`)) {
        try {
            await updateDoc(doc(db, "students", id), { isEnrolled: true, status: "Enrolled" });
            const enrRef = doc(db, "enrollments", `ENR-${currentSY}-${studentID}`);
            const enrSnap = await getDoc(enrRef);
            
            if(enrSnap.exists()) {
                await updateDoc(enrRef, { "payment.status": "Approved" });
            } else {
                await setDoc(enrRef, {
                  studentID: studentID,
                  schoolYear: currentSY,
                  payment: { status: "Approved", method: "Admin-Set" },
                  monthlyTracking: {
                    "JUN": { status: "Open", amount: 1100 },
                    "JUL": { status: "Locked", amount: 1100 },
                    "AUG": { status: "Locked", amount: 1100 },
                    "SEP": { status: "Locked", amount: 1100 },
                    "OCT": { status: "Locked", amount: 1100 },
                    "NOV": { status: "Locked", amount: 1100 },
                    "DEC": { status: "Locked", amount: 1100 },
                    "JAN": { status: "Locked", amount: 1100 },
                    "FEB": { status: "Locked", amount: 1100 },
                    "MAR": { status: "Locked", amount: 1100 }
                  }
                });
            }
            alert("Student Enrolled Successfully!");
        } catch (error) { 
            console.error("Approval Error:", error); 
            alert("Error: " + error.message);
        }
    }
  };

  const handleReject = async (id, studentID) => {
    if(window.confirm("Reject this enrollment?")) {
        try {
            await updateDoc(doc(db, "students", id), { isEnrolled: false, status: "Rejected" });
            const enrRef = doc(db, "enrollments", `ENR-${currentSY}-${studentID}`);
            const enrSnap = await getDoc(enrRef);
            if(enrSnap.exists()) {
                await updateDoc(enrRef, { "payment.status": "Rejected" });
            }
            alert("Student Enrollment Rejected!");
        } catch (error) {
            console.error("Reject Error:", error);
            alert("Error: " + error.message);
        }
    }
  };

  const handleDelete = async (id) => {
    if(window.confirm("Are you sure you want to delete this record?")) {
      try {
        await deleteDoc(doc(db, "students", id));
      } catch (error) { console.error("Delete Error:", error); }
    }
  };

  // BINAGO: Ito ang kukuha ng lahat ng lumang records
  const handleViewDetails = async (student) => {
    setLoadingDetails(true);
    setSelectedStudent(student);
    setShowModal(true);
    try {
      // 1. Kunin ang Current SY Enrollment
      const enrRef = doc(db, "enrollments", `ENR-${currentSY}-${student.studentID}`);
      const enrSnap = await getDoc(enrRef);
      
      // 2. Kunin ang Lahat ng Records (History) ng bata gamit ang studentID
      const historyQ = query(collection(db, "enrollments"), where("studentID", "==", student.studentID));
      const historySnap = await getDocs(historyQ);
      const historyList = historySnap.docs.map(d => ({ id: d.id, ...d.data() }));

      setSelectedStudent(prev => ({
        ...prev,
        paymentInfo: enrSnap.exists() ? enrSnap.data() : null,
        enrollmentHistory: historyList 
      }));
    } catch (error) {
      console.error("Error fetching enrollment details:", error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const filteredStudents = students.filter(st => 
    st.lastname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    st.firstname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    st.studentID?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className='bg-gray-50 p-6 shadow-sm rounded-lg min-h-screen'>
      {/* HEADER & SEARCH BAR */}
      <div className='flex flex-col md:flex-row justify-between items-center mb-6 gap-4'>
        <div>
          <h2 className="text-2xl font-bold text-[#2D5B60]">Student Management</h2>
          <p className='text-sm text-gray-500 uppercase tracking-widest font-bold'>
            CURRENT VIEW: <span className="text-red-600">{currentSY}</span>
          </p>
        </div>
        <div className='relative w-full md:w-80'>
          <input 
            type="text" 
            placeholder="Search student or ID..." 
            className='border border-gray-300 rounded-lg px-4 py-2 w-full outline-[#2D5B60] shadow-sm'
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* STUDENT TABLE */}
      <div className='overflow-x-auto bg-white rounded-lg shadow'>
        <table className='w-full text-left border-collapse'>
          <thead className='bg-gray-100 text-neutral-600 text-[11px] uppercase font-bold'>
            <tr>
              <th className='px-4 py-4 border-b'>Student Information</th>
              <th className='px-4 py-4 border-b'>Level / Grade</th>
              <th className='px-4 py-4 border-b'>Documents</th>
              <th className='px-4 py-4 border-b text-center'>Payment</th>
              <th className='px-4 py-4 border-b text-center'>Status</th>
              <th className='px-4 py-4 border-b text-center'>Actions</th>
            </tr>
          </thead>
          <tbody className='text-[14px]'>
            {filteredStudents.map((st) => (
              <tr key={st.id} className='hover:bg-gray-50 border-b transition-all'>
                <td className='px-4 py-4'>
                  <div className='font-bold text-gray-800 uppercase'>{st.lastname}, {st.firstname}</div>
                  <div className='text-[11px] text-[#2D5B60] font-bold'>{st.studentID}</div>
                </td>
                <td className='px-4 py-4'>
                  <div className='font-semibold text-gray-700'>{st.level}</div>
                  <div className='text-xs text-gray-500'>Grade {st.grade}</div>
                </td>
                <td className='px-4 py-4'>
                  <div className='flex flex-col gap-1'>
                    {st.requirements?.birthCert && (
                      <a href={st.requirements.birthCert} target="_blank" rel="noreferrer" className='text-blue-600 text-[10px] font-bold'>📄 BIRTH CERT</a>
                    )}
                    {st.requirements?.reportCard && (
                      <a href={st.requirements.reportCard} target="_blank" rel="noreferrer" className='text-purple-600 text-[10px] font-bold'>📄 REPORT CARD</a>
                    )}
                  </div>
                </td>
                <td className='px-4 py-4 text-center'>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                    st.status === "Enrolled" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                  }`}>
                    {st.status === "Enrolled" ? "PAID" : "PENDING"}
                  </span>
                </td>
                <td className='px-4 py-4 text-center'>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                    st.status === "Enrolled" ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                  }`}>
                    {st.status || 'Pending'}
                  </span>
                </td>
                <td className='px-4 py-4 text-center'>
                  <div className='flex justify-center gap-2'>
                    {st.status !== "Enrolled" && st.status !== "Rejected" && (
                      <>
                        <button onClick={() => handleApprove(st.id, st.studentID)} className='bg-[#2D5B60] text-white px-3 py-1 rounded text-[11px] font-bold hover:bg-black'>Approve</button>
                        <button onClick={() => handleReject(st.id, st.studentID)} className='bg-red-50 text-red-600 px-3 py-1 rounded text-[11px] font-bold border border-red-200'>Reject</button>
                      </>
                    )}
                    <button onClick={() => handleViewDetails(st)} className='bg-blue-50 text-blue-700 px-3 py-1 rounded text-[11px] font-bold border border-blue-200'>Details</button>
                    <button onClick={() => handleDelete(st.id)} className='bg-red-50 text-red-600 px-3 py-1 rounded text-[11px] font-bold border border-red-200'>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- MODAL POPUP --- */}
      {showModal && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl relative">
            <div className='bg-[#2D5B60] p-4 text-white flex justify-between items-center sticky top-0 z-10'>
              <h2 className="text-lg font-bold uppercase tracking-wider">Student Profile Detail ({selectedStudent.paymentInfo?.schoolYear || currentSY})</h2>
              <button onClick={() => setShowModal(false)} className="text-2xl font-bold">&times;</button>
            </div>
            
            <div className="p-8">
              {loadingDetails ? <p className='text-center animate-pulse py-10'>Fetching records...</p> : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                  <section className='bg-gray-50 p-4 rounded-lg border'>
                    <h3 className="text-[#2D5B60] font-black uppercase text-xs mb-3 border-b pb-2">1. Child Information</h3>
                    <div className='space-y-1 uppercase'>
                      <p><span className='text-gray-500'>Full Name:</span> <span className='font-bold'>{selectedStudent.firstname} {selectedStudent.middlename} {selectedStudent.lastname}</span></p>
                      <p><span className='text-gray-500'>Age / Sex:</span> <span className='font-bold'>{selectedStudent.age} / {selectedStudent.sex}</span></p>
                      <p><span className='text-gray-500'>Level:</span> <span className='font-bold'>{selectedStudent.level} - Grade {selectedStudent.grade}</span></p>
                      <p><span className='text-gray-500'>Type:</span> <span className='font-bold'>{selectedStudent.studentType}</span></p>
                    </div>
                  </section>

                  <section className='bg-yellow-50 p-4 rounded-lg border border-yellow-200'>
                    <h3 className="text-yellow-700 font-black uppercase text-xs mb-3 border-b border-yellow-200 pb-2">2. Initial Payment Proof</h3>
                    <div className='space-y-2'>
                      <p><span className='text-gray-500'>Method:</span> <span className='font-bold text-yellow-800 uppercase'>{selectedStudent.paymentInfo?.payment?.method || "Not Set"}</span></p>
                      {selectedStudent.paymentInfo?.payment?.proofImage && (
                        <div>
                          <a href={selectedStudent.paymentInfo.payment.proofImage} target="_blank" rel="noreferrer">
                            <img src={selectedStudent.paymentInfo.payment.proofImage} className='w-full h-32 object-contain border bg-white rounded mt-1 shadow-sm' alt="Receipt" />
                          </a>
                        </div>
                      )}
                    </div>
                  </section>

                  {/* --- HISTORY SELECTOR (NEW) --- */}
                  <section className='bg-blue-50 p-3 rounded-lg border border-blue-200 col-span-1 md:col-span-2'>
                    <h3 className="text-blue-800 font-black uppercase text-[10px] mb-2">View Records From Other Years:</h3>
                    <div className='flex flex-wrap gap-2'>
                        {selectedStudent.enrollmentHistory?.map(history => (
                            <button 
                                key={history.id}
                                onClick={() => setSelectedStudent(prev => ({ ...prev, paymentInfo: history }))}
                                className={`px-3 py-1 rounded-full text-[10px] font-bold border ${selectedStudent.paymentInfo?.schoolYear === history.schoolYear ? 'bg-blue-600 text-white' : 'bg-white text-blue-600'}`}
                            >
                                SY {history.schoolYear}
                            </button>
                        ))}
                    </div>
                  </section>

                  <section className='bg-white p-4 rounded-lg border col-span-1 md:col-span-2 shadow-sm'>
                    <h3 className="text-[#2D5B60] font-black uppercase text-xs mb-4 border-b pb-2">3. Monthly Tuition Tracker ({selectedStudent.paymentInfo?.schoolYear})</h3>
                    <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3'>
                      {selectedStudent.paymentInfo?.monthlyTracking ? (
                        Object.keys(selectedStudent.paymentInfo.monthlyTracking).map((month) => {
                          const data = selectedStudent.paymentInfo.monthlyTracking[month];
                          const isPending = data.status === "Pending Approval";
                          
                          return (
                            <div 
                              key={month} 
                              onClick={() => handleMarkAsPaid(month, data.status, data.amount, data.receiptImage)}
                              className={`cursor-pointer border p-3 rounded-xl text-center relative transition-all hover:scale-105 ${
                                data.status === "Paid" ? "bg-green-50 border-green-500 shadow-sm" : 
                                isPending ? "bg-yellow-50 border-yellow-500 animate-pulse shadow-md" :
                                data.status === "Open" ? "bg-orange-50 border-orange-300" : "bg-red-50 border-red-200"
                              }`}
                            >
                              {data.receiptImage && isPending && (
                                <div className="absolute -top-1 -right-1 bg-blue-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full shadow-lg">RECEIPT</div>
                              )}
                              <p className='text-[10px] font-bold text-gray-500 uppercase mb-1'>{month}</p>
                              <p className={`text-lg font-black ${
                                data.status === "Paid" ? "text-green-700" : 
                                isPending ? "text-yellow-700" : "text-red-700"
                              }`}>₱{data.amount}</p>
                              <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold text-white uppercase mt-1 inline-block ${
                                data.status === "Paid" ? "bg-green-600" : 
                                isPending ? "bg-yellow-500" :
                                data.status === "Open" ? "bg-orange-500" : "bg-red-600"
                              }`}>
                                {isPending ? "FOR APPROVAL" : data.status}
                              </span>
                            </div>
                          );
                        })
                      ) : <p className='text-gray-400 italic text-xs col-span-5 text-center py-5'>No monthly record found.</p>}
                    </div>
                  </section>

                  <section className='bg-blue-50/40 p-4 rounded-lg border border-blue-100'>
                    <h3 className="text-blue-700 font-black uppercase text-xs mb-3 border-b border-blue-200 pb-2">4. Father Information</h3>
                    <p className='uppercase'><span className='text-gray-500'>Name:</span> <span className='font-bold'>{selectedStudent.father?.firstname} {selectedStudent.father?.lastname}</span></p>
                  </section>
                  <section className='bg-pink-50/40 p-4 rounded-lg border border-pink-100'>
                    <h3 className="text-pink-700 font-black uppercase text-xs mb-3 border-b border-pink-200 pb-2">5. Mother Information</h3>
                    <p className='uppercase'><span className='text-gray-500'>Name:</span> <span className='font-bold'>{selectedStudent.mother?.firstname} {selectedStudent.mother?.lastname}</span></p>
                  </section>

                  <section className='bg-gray-50 p-4 rounded-lg border col-span-1 md:col-span-2'>
                    <h3 className="text-[#2D5B60] font-black uppercase text-xs mb-3 border-b pb-2">6. Address</h3>
                    <p className='italic uppercase text-gray-700 font-medium'>{selectedStudent.address?.purok}, {selectedStudent.address?.barangay}, {selectedStudent.address?.city}, {selectedStudent.address?.province}</p>
                  </section>
                </div>
              )}

              <div className="mt-8 pt-4 border-t flex justify-end gap-3">
                <button onClick={() => window.print()} className="bg-gray-800 text-white px-6 py-2 rounded-lg font-bold text-xs hover:bg-black transition-colors">PRINT FORM</button>
                <button onClick={() => setShowModal(false)} className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-bold text-xs hover:bg-gray-300 transition-colors">CLOSE</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Students;