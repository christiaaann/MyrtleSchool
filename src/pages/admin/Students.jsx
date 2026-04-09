import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, doc, updateDoc, query, orderBy, deleteDoc, getDoc, setDoc, getDocs, where } from 'firebase/firestore';
import { db } from '../../services/firebase';
import StudentsSkeleton from '../../components/Skeleton/StudentsSkeleton';
import { ChevronDown, Megaphone } from "lucide-react"; 
import axios from 'axios';
import { logAdminAction } from '../../services/systemLogger'; 

const Students = () => {
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentSY, setCurrentSY] = useState("2025-2026");
  const [showContribs, setShowContribs] = useState(null); 

  useEffect(() => {
    const settingsRef = doc(db, "settings", "schoolYear");
    const unsubSY = onSnapshot(settingsRef, (snap) => {
      if (snap.exists()) setCurrentSY(snap.data().active || "2025-2026");
    });
    return () => unsubSY();
  }, []);

  useEffect(() => {
    const q = query(collection(db, "students"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStudents(data);
      setTimeout(() => setLoading(false), 800);
    });
    return () => unsubscribe();
  }, []);

  const handleMarkAsPaid = async (month, currentStatus, currentAmount, receiptImage) => {
    if (!selectedStudent) return;
    const studentName = `${selectedStudent.firstname} ${selectedStudent.lastname}`;
    
    if (currentStatus === "Pending Approval") {
      const action = window.prompt(
        `Tuition for ${month} is Pending Approval (₱${currentAmount}).\n\nType 'V' to View Receipt\nType 'A' to Approve Payment\nType 'R' to Reject Payment`,
        "V"
      );

      if (!action) return;
      const choice = action.toUpperCase();

      if (choice === 'V') {
        if (receiptImage) window.open(receiptImage, "_blank");
        else alert("No receipt attached.");
        return; 
      } else if (choice === 'A') {
        await updateFirestoreData(month, "Paid", currentAmount);
        await logAdminAction("PAYMENT_APPROVED", `Approved tuition payment for ${month} (₱${currentAmount}) for ${studentName}`);
        return;
      } else if (choice === 'R') {
        await updateFirestoreData(month, "Unpaid", currentAmount);
        await logAdminAction("PAYMENT_REJECTED", `Rejected tuition payment for ${month} for ${studentName}`);
        return;
      }
    }

    const action = window.prompt(`Set status for ${month}:\nType 'P' for PAID\nType 'U' for UNPAID\nType 'A' for PENDING`, currentStatus === "Paid" ? "P" : "U");
    if (action === null) return;

    let newStatus = currentStatus;
    const choice = action.toUpperCase();
    if (choice === 'P') newStatus = "Paid";
    else if (choice === 'U') newStatus = "Unpaid";
    else if (choice === 'A') newStatus = "Pending Approval"; 
    else return alert("Invalid choice.");
    
    const inputAmount = window.prompt(`Update amount for ${month}? (Current: ₱${currentAmount})`, currentAmount);
    if (inputAmount === null) return;
    const newAmount = Number(inputAmount);

    if(window.confirm(`Update ${month} to ${newStatus.toUpperCase()} with amount ₱${newAmount}?`)) {
      await updateFirestoreData(month, newStatus, newAmount);
      await logAdminAction("TUITION_UPDATED", `Set ${month} tuition to ${newStatus} (₱${newAmount}) for ${studentName}`); 
    }
  };

  const updateFirestoreData = async (month, status, amount) => {
    try {
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
            [month]: { ...prev.paymentInfo.monthlyTracking[month], status: status, amount: amount }
          }
        }
      }));
      alert("Update successful!");
    } catch (error) { alert("Update failed: " + error.message); }
  };

  const handlePayInitialBalance = async (unpaidAmount) => {
    if (!selectedStudent) return;
    const studentName = `${selectedStudent.firstname} ${selectedStudent.lastname}`;
    
    const inputAmount = window.prompt(`Remaining initial balance is ₱${unpaidAmount.toLocaleString()}.\n\nEnter the amount paid by the parent:`);
    if (inputAmount === null || inputAmount.trim() === "") return;

    const amountToPay = Number(inputAmount);
    if (isNaN(amountToPay) || amountToPay <= 0) return alert("Please enter a valid amount.");
    if (amountToPay > unpaidAmount) return alert("Amount entered is greater than the remaining balance.");

    if(window.confirm(`Confirm payment of ₱${amountToPay.toLocaleString()} towards the initial balance?`)) {
      try {
        const targetSY = selectedStudent.paymentInfo?.schoolYear || currentSY;
        const enrRef = doc(db, "enrollments", `ENR-${targetSY}-${selectedStudent.studentID}`);
        
        const currentCustomPaid = selectedStudent.paymentInfo.customInitialPayment || 0;
        const newCustomPaid = currentCustomPaid + amountToPay;
        
        await updateDoc(enrRef, { customInitialPayment: newCustomPaid });
        
        setSelectedStudent(prev => ({
          ...prev, paymentInfo: { ...prev.paymentInfo, customInitialPayment: newCustomPaid }
        }));
        
        await logAdminAction("MANUAL_PAYMENT", `Logged manual initial payment of ₱${amountToPay} for ${studentName}`); 
        alert("Payment successfully recorded!");
      } catch (error) { alert("Update failed: " + error.message); }
    }
  };

  const handleApproveInitialFeeReceipt = async (unpaidAmount, trackingData) => {
    const studentName = `${selectedStudent.firstname} ${selectedStudent.lastname}`;
    const action = window.prompt(
      `Initial Fees Pending Approval (₱${trackingData.amount.toLocaleString()}).\n\nType 'V' to View Receipt\nType 'A' to Approve Payment\nType 'R' to Reject Payment`,
      "V"
    );

    if (!action) return;
    const choice = action.toUpperCase();

    if (choice === 'V') {
      if (trackingData.receiptImage) window.open(trackingData.receiptImage, "_blank");
      else alert("No receipt attached.");
    } else if (choice === 'A') {
      try {
        const targetSY = selectedStudent.paymentInfo?.schoolYear || currentSY;
        const enrRef = doc(db, "enrollments", `ENR-${targetSY}-${selectedStudent.studentID}`);
        
        const currentCustomPaid = selectedStudent.paymentInfo.customInitialPayment || 0;
        const newCustomPaid = currentCustomPaid + trackingData.amount;
        
        await updateDoc(enrRef, { customInitialPayment: newCustomPaid, "initialFeeTracking.status": "Approved" });
        
        setSelectedStudent(prev => ({
          ...prev, paymentInfo: {
            ...prev.paymentInfo, customInitialPayment: newCustomPaid, initialFeeTracking: { ...trackingData, status: "Approved" }
          }
        }));
        await logAdminAction("PAYMENT_APPROVED", `Approved initial fee receipt of ₱${trackingData.amount} for ${studentName}`); 
        alert("Initial Fee Payment Approved!");
      } catch (error) { alert("Update failed: " + error.message); }
    } else if (choice === 'R') {
        const targetSY = selectedStudent.paymentInfo?.schoolYear || currentSY;
        const enrRef = doc(db, "enrollments", `ENR-${targetSY}-${selectedStudent.studentID}`);
        await updateDoc(enrRef, { "initialFeeTracking.status": "Rejected" });
        
        setSelectedStudent(prev => ({
          ...prev, paymentInfo: { ...prev.paymentInfo, initialFeeTracking: { ...trackingData, status: "Rejected" } }
        }));
        await logAdminAction("PAYMENT_REJECTED", `Rejected initial fee receipt of ₱${trackingData.amount} for ${studentName}`); 
        alert("Payment Rejected!");
    }
  };

  const handleApproveContribution = async (cId, cData) => {
    const targetSY = selectedStudent.paymentInfo?.schoolYear || currentSY;
    const enrRef = doc(db, "enrollments", `ENR-${targetSY}-${selectedStudent.studentID}`);
    const studentName = `${selectedStudent.firstname} ${selectedStudent.lastname}`;

    if (cData.status === "Pending Approval") {
      const action = window.prompt(`${cData.title} is Pending Approval (₱${cData.amount}).\n\nType 'V' to View Receipt\nType 'A' to Approve Payment\nType 'R' to Reject Payment`, "V");

      if (!action) return;
      const choice = action.toUpperCase();

      if (choice === 'V') {
        if (cData.receiptImage) window.open(cData.receiptImage, "_blank");
        else alert("No receipt attached.");
      } else if (choice === 'A') {
        try {
          await updateDoc(enrRef, { [`contributions.${cId}.status`]: "Paid", [`contributions.${cId}.amountPaid`]: cData.amount });
          setSelectedStudent(prev => ({
            ...prev, paymentInfo: { ...prev.paymentInfo, contributions: { ...prev.paymentInfo.contributions, [cId]: { ...cData, status: "Paid", amountPaid: cData.amount } } }
          }));
          await logAdminAction("PAYMENT_APPROVED", `Approved receipt for ${cData.title} (₱${cData.amount}) for ${studentName}`); 
          alert("Contribution Approved!");
        } catch (error) { alert("Error: " + error.message); }
      } else if (choice === 'R') {
         await updateDoc(enrRef, { [`contributions.${cId}.status`]: "Unpaid", [`contributions.${cId}.receiptImage`]: "" });
        setSelectedStudent(prev => ({
          ...prev, paymentInfo: { ...prev.paymentInfo, contributions: { ...prev.paymentInfo.contributions, [cId]: { ...cData, status: "Unpaid", receiptImage: "" } } }
        }));
        await logAdminAction("PAYMENT_REJECTED", `Rejected receipt for ${cData.title} for ${studentName}`); 
        alert("Contribution Rejected!");
      }
    } else if (cData.status === "Unpaid" || cData.status === "Balance Due") {
      const balance = cData.amount - (cData.amountPaid || 0);
      if (window.confirm(`Manually mark balance of ₱${balance} for ${cData.title} as Paid via Cash?`)) {
        try {
          await updateDoc(enrRef, { [`contributions.${cId}.status`]: "Paid", [`contributions.${cId}.amountPaid`]: cData.amount, [`contributions.${cId}.paymentMethod`]: "Admin-Cash" });
          setSelectedStudent(prev => ({
            ...prev, paymentInfo: { ...prev.paymentInfo, contributions: { ...prev.paymentInfo.contributions, [cId]: { ...cData, status: "Paid", amountPaid: cData.amount, paymentMethod: "Admin-Cash" } } }
          }));
          await logAdminAction("MANUAL_PAYMENT", `Manually logged payment of ₱${balance} for ${cData.title} (${studentName})`); 
          alert("Contribution Marked as Paid!");
        } catch (error) { alert("Error: " + error.message); }
      }
    } else if (cData.status === "Refund Due") {
      const refund = (cData.amountPaid || 0) - cData.amount;
      if (window.confirm(`Have you returned the excess ₱${refund} to the parent? Click OK to settle the account.`)) {
        try {
          await updateDoc(enrRef, { [`contributions.${cId}.status`]: "Paid", [`contributions.${cId}.amountPaid`]: cData.amount });
          setSelectedStudent(prev => ({
            ...prev, paymentInfo: { ...prev.paymentInfo, contributions: { ...prev.paymentInfo.contributions, [cId]: { ...cData, status: "Paid", amountPaid: cData.amount } } }
          }));
          await logAdminAction("REFUND_SETTLED", `Settled refund of ₱${refund} for ${cData.title} (${studentName})`); 
          alert("Refund Settled!");
        } catch (error) { alert("Error: " + error.message); }
      }
    }
  };

  const handleVerifyRequirements = async (id, studentID) => {
    if (window.confirm("Approve requirements and send assessment to parent?")) {
      try {
        const enrRef = doc(db, "enrollments", `ENR-${currentSY}-${studentID}`);
        await updateDoc(enrRef, { verificationStatus: "Approved" });
        await updateDoc(doc(db, "students", id), { status: "Waiting for Payment" });
        await logAdminAction("DOCS_VERIFIED", `Verified enrollment documents for student ID: ${studentID}`); 
        alert("Requirements verified! Parent can now proceed to payment.");
      } catch (error) { alert("Error: " + error.message); }
    }
  };

  const handleApprove = async (id, studentID) => {
    if(window.confirm(`Approve payment and officially enroll for SY ${currentSY}?`)) {
        try {
            await updateDoc(doc(db, "students", id), { isEnrolled: true, status: "Enrolled" });
            const enrRef = doc(db, "enrollments", `ENR-${currentSY}-${studentID}`);
            const enrSnap = await getDoc(enrRef);
            
            if(enrSnap.exists()) {
                await updateDoc(enrRef, { "payment.status": "Approved" });
            } else {
                await setDoc(enrRef, {
                  studentID: studentID, schoolYear: currentSY, payment: { status: "Approved", method: "Admin-Set" },
                  monthlyTracking: {
                    "JUN": { status: "Unpaid", amount: 1100 }, "JUL": { status: "Unpaid", amount: 1100 },
                    "AUG": { status: "Unpaid", amount: 1100 }, "SEP": { status: "Unpaid", amount: 1100 },
                    "OCT": { status: "Unpaid", amount: 1100 }, "NOV": { status: "Unpaid", amount: 1100 },
                    "DEC": { status: "Unpaid", amount: 1100 }, "JAN": { status: "Unpaid", amount: 1100 },
                    "FEB": { status: "Unpaid", amount: 1100 }, "MAR": { status: "Unpaid", amount: 1100 }
                  }
                });
            }
            await logAdminAction("ENROLLMENT_APPROVED", `Officially enrolled student ID: ${studentID} for SY ${currentSY}`); 
            alert("Student Enrolled Successfully!");
            try { await axios.post("https://myrtlebackend.vercel.app/send-enrollment", { studentID }); } 
            catch(emailError) { console.error("Email failed:", emailError); }
        } catch (error) { alert("Error: " + error.message); }
    }
  };
        
  const handleReject = async (id, studentID) => {
    if(window.confirm("Reject this enrollment?")) {
        try {
            await updateDoc(doc(db, "students", id), { isEnrolled: false, status: "Rejected" });
            const enrRef = doc(db, "enrollments", `ENR-${currentSY}-${studentID}`);
            const enrSnap = await getDoc(enrRef);
            if(enrSnap.exists()) await updateDoc(enrRef, { "payment.status": "Rejected" });
            await logAdminAction("ENROLLMENT_REJECTED", `Rejected enrollment application for student ID: ${studentID}`); 
            alert("Student Enrollment Rejected!");
        } catch (error) { console.error(error); }
    }
  };
         
  const handleDelete = async (id) => {
    if(window.confirm("Are you sure you want to delete this record?")) {
      try { 
        await deleteDoc(doc(db, "students", id)); 
        await logAdminAction("STUDENT_DELETED", `Deleted student record (ID inside database: ${id})`); 
      } catch (error) { console.error(error); }
    }
  };

  const handleViewDetails = async (student) => {
    setLoadingDetails(true);
    setSelectedStudent(student);
    setShowModal(true);
    try {
      const enrRef = doc(db, "enrollments", `ENR-${currentSY}-${student.studentID}`);
      const enrSnap = await getDoc(enrRef);
      
      const historyQ = query(collection(db, "enrollments"), where("studentID", "==", student.studentID));
      const historySnap = await getDocs(historyQ);
      const historyList = historySnap.docs.map(d => ({ id: d.id, ...d.data() }));

      setSelectedStudent(prev => ({
        ...prev,
        paymentInfo: enrSnap.exists() ? enrSnap.data() : null,
        enrollmentHistory: historyList 
      }));
    } catch (error) { console.error(error); } 
    finally { setLoadingDetails(false); }
  };

  if (loading) return <StudentsSkeleton/>;

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
            className='border border-gray-300 rounded-lg px-4 py-3 w-full outline-[#2D5B60] shadow-sm font-medium'
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* STUDENT TABLE */}
      <div className='overflow-x-auto bg-white rounded-lg shadow-sm border border-gray-200'>
        <table className='w-full text-left border-collapse'>
          <thead className='bg-gray-100 text-neutral-600 text-[10px] uppercase font-black tracking-wider'>
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
              <tr key={st.id} className='hover:bg-gray-50 border-b border-gray-100 transition-all'>
                <td className='px-4 py-4'>
                  <div className='font-bold text-gray-800 uppercase'>{st.lastname}, {st.firstname}</div>
                  <div className='text-[11px] text-[#2D5B60] font-bold'>{st.studentID}</div>
                </td>
                <td className='px-4 py-4'>
                  <div className='font-semibold text-gray-700 text-sm'>{st.level}</div>
                  <div className='text-xs text-gray-500 font-medium'>Grade {st.grade}</div>
                </td>
                <td className='px-4 py-4'>
                  <div className='flex flex-col gap-1'>
                    {st.requirements?.birthCert && (
                      <a href={st.requirements.birthCert} target="_blank" rel="noreferrer" className='text-blue-600 text-[9px] font-black uppercase tracking-wider hover:underline'>📄 Birth Cert</a>
                    )}
                    {st.requirements?.reportCard && (
                      <a href={st.requirements.reportCard} target="_blank" rel="noreferrer" className='text-purple-600 text-[9px] font-black uppercase tracking-wider hover:underline'>📄 Report Card</a>
                    )}
                  </div>
                </td>
                <td className='px-4 py-4 text-center'>
                  <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                    st.status === "Enrolled" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                  }`}>
                    {st.status === "Enrolled" ? "PAID" : "PENDING"}
                  </span>
                </td>
                <td className='px-4 py-4 text-center'>
                  <span className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider ${
                    st.status === "Enrolled" ? 'bg-green-50 text-green-700 border border-green-200' : 
                    st.status === "Waiting for Payment" ? 'bg-orange-50 text-orange-600 border border-orange-200' :
                    st.status === "Payment Submitted" ? 'bg-blue-50 text-blue-600 border border-blue-200' :
                    'bg-gray-100 text-gray-600 border border-gray-200'
                  }`}>
                    {st.status || 'Pending'}
                  </span>
                </td>
                <td className='px-4 py-4 text-center'>
                    <div className='flex justify-center items-center gap-2'>
                      {st.status === "Submitted for Verification" && (
                        <>
                          <button onClick={() => handleVerifyRequirements(st.id, st.studentID)} className='bg-yellow-500 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold hover:bg-yellow-600 shadow-sm'>Verify Docs</button>
                          <button onClick={() => handleReject(st.id, st.studentID)} className='bg-white text-red-600 px-3 py-1.5 rounded-lg text-[10px] font-bold border border-red-200 hover:bg-red-50'>Reject</button>
                        </>
                      )}
                      {st.status === "Waiting for Payment" && (
                        <span className='px-3 py-1.5 rounded-lg text-[9px] font-black text-orange-500 uppercase tracking-wider'>Awaiting Payment</span>
                      )}
                      {st.status === "Payment Submitted" && (
                        <button onClick={() => handleApprove(st.id, st.studentID)} className='bg-[#2D5B60] text-white px-3 py-1.5 rounded-lg text-[10px] font-bold hover:bg-black shadow-sm'>Approve Payment</button>
                      )}
                      <button onClick={() => handleViewDetails(st)} className='bg-gray-50 text-gray-700 px-3 py-1.5 rounded-lg text-[10px] font-bold border border-gray-200 hover:bg-gray-100'>Details</button>
                      <button onClick={() => handleDelete(st.id)} className='bg-white text-red-400 px-3 py-1.5 rounded-lg text-[10px] font-bold border border-red-100 hover:bg-red-50 hover:text-red-600'>Delete</button>
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
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl relative animate-in zoom-in-95 duration-200">
            <div className='bg-[#2D5B60] p-5 text-white flex justify-between items-center sticky top-0 z-10'>
              <h2 className="text-lg font-black uppercase tracking-wider">Student Profile ({selectedStudent.paymentInfo?.schoolYear || currentSY})</h2>
              <button onClick={() => setShowModal(false)} className="text-3xl font-light hover:text-gray-300 leading-none">&times;</button>
            </div>
            
            <div className="p-8">
              {loadingDetails ? <p className='text-center animate-pulse py-10 font-bold text-gray-400'>Fetching records...</p> : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                  
                  <section className='bg-gray-50 p-4 rounded-xl border border-gray-200'>
                    <h3 className="text-[#2D5B60] font-black uppercase text-[10px] tracking-widest mb-3 border-b border-gray-200 pb-2">1. Child Information</h3>
                    <div className='space-y-1.5 uppercase text-xs'>
                      <p><span className='text-gray-400 font-bold'>Full Name:</span> <span className='font-black text-gray-700'>{selectedStudent.firstname} {selectedStudent.middlename} {selectedStudent.lastname}</span></p>
                      <p><span className='text-gray-400 font-bold'>Age / Sex:</span> <span className='font-black text-gray-700'>{selectedStudent.age} / {selectedStudent.sex}</span></p>
                      <p><span className='text-gray-400 font-bold'>Level:</span> <span className='font-black text-gray-700'>{selectedStudent.level} - Grade {selectedStudent.grade}</span></p>
                      <p><span className='text-gray-400 font-bold'>Type:</span> <span className='font-black text-gray-700'>{selectedStudent.studentType}</span></p>
                    </div>
                  </section>

                  <section className='bg-yellow-50 p-4 rounded-xl border border-yellow-200'>
                    <h3 className="text-yellow-700 font-black uppercase text-[10px] tracking-widest mb-3 border-b border-yellow-200 pb-2">2. Initial Payment Proof</h3>
                    <div className='space-y-2 text-xs'>
                      <p><span className='text-yellow-600 font-bold uppercase'>Method:</span> <span className='font-black text-yellow-800 uppercase'>{selectedStudent.paymentInfo?.payment?.method || "Not Set"}</span></p>
                      
                      {selectedStudent.paymentInfo?.paidInitialFees && selectedStudent.paymentInfo.paidInitialFees.length > 0 && (
                        <div className="my-3 pt-2 border-t border-yellow-200/50">
                          <p className="text-yellow-600 font-bold uppercase text-[9px] mb-2">Paid Initial Fees:</p>
                          <ul className="space-y-1">
                            {selectedStudent.paymentInfo.paidInitialFees.map(feeKey => (
                              <li key={feeKey} className="flex justify-between text-yellow-800 font-bold text-[10px]">
                                <span className="uppercase">{feeKey === 'misc' ? 'Miscellaneous' : feeKey}</span>
                                <span>₱{selectedStudent.paymentInfo.fees?.[feeKey]?.toLocaleString() || 0}</span>
                              </li>
                            ))}
                            
                            {(() => {
                              const fees = selectedStudent.paymentInfo.fees || {};
                              const paidKeys = selectedStudent.paymentInfo.paidInitialFees || [];
                              const allKeys = ['registration', 'misc', 'books', 'instructional', 'uniform', 'pta'];
                              
                              const totalInitial = allKeys.reduce((s, k) => s + Number(fees[k] || 0), 0);
                              const basePaid = paidKeys.reduce((s, k) => s + Number(fees[k] || 0), 0);
                              const customPaid = Number(selectedStudent.paymentInfo.customInitialPayment || 0);
                              const totalPaid = basePaid + customPaid;
                              const unpaidBalance = totalInitial - totalPaid;

                              let remainingCustom = customPaid;
                              const unpaidKeys = allKeys.filter(k => !paidKeys.includes(k));
                              const adjustedUnpaidList = [];
                              
                              unpaidKeys.forEach(k => {
                                  let amt = Number(fees[k] || 0);
                                  if (remainingCustom >= amt) {
                                      remainingCustom -= amt;
                                  } else if (remainingCustom > 0) {
                                      adjustedUnpaidList.push({ key: k, amount: amt - remainingCustom });
                                      remainingCustom = 0;
                                  } else {
                                      adjustedUnpaidList.push({ key: k, amount: amt });
                                  }
                              });

                              return (
                                <>
                                  {customPaid > 0 && (
                                    <li className="flex justify-between text-green-700 font-bold text-[10px] pt-2 border-t border-yellow-200">
                                      <span className="uppercase">+ ADDITIONAL PAID</span>
                                      <span>₱{customPaid.toLocaleString()}</span>
                                    </li>
                                  )}

                                  <li className="flex justify-between text-yellow-900 font-black text-xs pt-2 border-t border-yellow-300 mt-2">
                                    <span>TOTAL PAID NOW</span>
                                    <span>₱{totalPaid.toLocaleString()}</span>
                                  </li>
                                  
                                  {unpaidBalance > 0 && (
                                    <>
                                      <li className="flex justify-between text-red-600 font-black text-xs pt-3 mt-2 border-t border-red-200/50">
                                        <span>UNPAID INITIAL BALANCE</span>
                                        <span>₱{unpaidBalance.toLocaleString()}</span>
                                      </li>
                                      {adjustedUnpaidList.map(fee => (
                                          <li key={`unpaid-${fee.key}`} className="flex justify-between text-red-400 font-bold text-[10px] pl-2">
                                            <span className="uppercase">- {fee.key === 'misc' ? 'Miscellaneous' : fee.key}</span>
                                            <span>₱{fee.amount.toLocaleString()}</span>
                                          </li>
                                      ))}
                                    </>
                                  )}
                                </>
                              );
                            })()}
                          </ul>
                        </div>
                      )}

                      {selectedStudent.paymentInfo?.payment?.proofImage && (
                        <div className="pt-2">
                          <p className="text-yellow-600 font-bold uppercase text-[9px] mb-1">Receipt:</p>
                          <a href={selectedStudent.paymentInfo.payment.proofImage} target="_blank" rel="noreferrer">
                            <img src={selectedStudent.paymentInfo.payment.proofImage} className='w-full h-32 object-contain border border-yellow-300 bg-white rounded-lg shadow-sm hover:opacity-80 transition-opacity' alt="Receipt" />
                          </a>
                        </div>
                      )}
                    </div>
                  </section>

                  {/* HISTORY SELECTOR */}
                  <section className='bg-blue-50 p-4 rounded-xl border border-blue-200 col-span-1 md:col-span-2'>
                    <h3 className="text-blue-800 font-black uppercase text-[10px] tracking-widest mb-3">View Records From Other Years:</h3>
                    <div className='flex flex-wrap gap-2'>
                        {selectedStudent.enrollmentHistory?.map(history => (
                            <button 
                                key={history.id}
                                onClick={() => setSelectedStudent(prev => ({ ...prev, paymentInfo: history }))}
                                className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border transition-all ${selectedStudent.paymentInfo?.schoolYear === history.schoolYear ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-100'}`}
                            >
                                SY {history.schoolYear}
                            </button>
                        ))}
                    </div>
                  </section>

                  {/* --- ADMIN: ADD-ON CONTRIBUTIONS SECTION --- */}
                  {selectedStudent.paymentInfo?.contributions && Object.keys(selectedStudent.paymentInfo.contributions).length > 0 && (() => {
                      const contribList = Object.entries(selectedStudent.paymentInfo.contributions);
                      const hasUnpaid = contribList.some(([_, c]) => c.status !== "Paid");
                      const isOpen = showContribs !== null ? showContribs : hasUnpaid;

                      return (
                        <section className='bg-white p-5 rounded-xl border border-gray-200 col-span-1 md:col-span-2 shadow-sm'>
                          <button 
                             onClick={() => setShowContribs(!isOpen)}
                             className={`w-full flex justify-between items-center p-3 rounded-xl border font-black uppercase tracking-widest text-[10px] transition-colors mb-3 ${
                               hasUnpaid ? "bg-red-50 border-red-200 text-red-700" : "bg-green-50 border-green-200 text-green-700"
                             }`}
                          >
                             <span className="flex items-center gap-2">
                                <Megaphone size={14} /> School Contributions & Activities
                             </span>
                             <div className="flex items-center gap-3">
                                {hasUnpaid ? <span className="bg-red-500 text-white px-2 py-0.5 rounded-full">UNPAID DUES</span> : <span className="bg-green-500 text-white px-2 py-0.5 rounded-full">ALL PAID</span>}
                                <ChevronDown size={16} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                             </div>
                          </button>

                          {isOpen && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 animate-in fade-in slide-in-from-top-2">
                              {contribList.map(([cId, cData]) => {
                                 const amountPaid = cData.amountPaid || 0;
                                 const balanceDue = cData.amount - amountPaid;
                                 
                                 const isCPaid = cData.status === "Paid";
                                 const isCPending = cData.status === "Pending Approval";
                                 const isCBalance = cData.status === "Balance Due";
                                 const isCRefund = cData.status === "Refund Due";
                                 
                                 const displayAmount = isCBalance ? balanceDue : (isCRefund ? Math.abs(balanceDue) : cData.amount);

                                 return (
                                   <div key={cId} onClick={() => handleApproveContribution(cId, cData)}
                                      className={`p-4 rounded-xl border flex flex-col justify-between cursor-pointer transition-all hover:scale-[1.02] relative ${
                                        isCPaid ? "bg-green-50 border-green-200" :
                                        isCPending ? "bg-yellow-50 border-yellow-300 animate-pulse shadow-md" :
                                        isCRefund ? "bg-teal-50 border-teal-300 shadow-sm" :
                                        isCBalance ? "bg-orange-50 border-orange-300 shadow-sm" :
                                        "bg-red-50 border-red-200 hover:bg-red-100 shadow-sm"
                                      }`}
                                   >
                                      {cData.receiptImage && isCPending && (
                                        <div className="absolute -top-2 -right-2 bg-blue-600 text-white text-[8px] font-black px-2 py-1 rounded-full shadow-lg border-2 border-white">RECEIPT</div>
                                      )}
                                      <div>
                                        <div className="flex justify-between items-start mb-1">
                                          <p className={`text-[10px] font-bold uppercase leading-tight pr-2 ${isCPaid ? "text-green-800" : isCPending ? "text-yellow-800" : isCRefund ? "text-teal-800" : isCBalance ? "text-orange-800" : "text-red-800"}`}>{cData.title}</p>
                                          <p className={`text-sm font-black ${isCPaid ? "text-green-900" : isCPending ? "text-yellow-900" : isCRefund ? "text-teal-900" : isCBalance ? "text-orange-900" : "text-red-900"}`}>₱{displayAmount}</p>
                                        </div>
                                        {cData.breakdown && cData.breakdown.length > 0 && !isCBalance && !isCRefund && (
                                          <div className={`mt-2 pt-2 border-t space-y-1 ${isCPaid ? "border-green-200" : isCPending ? "border-yellow-200" : "border-red-200"}`}>
                                            {cData.breakdown.map((item, idx) => (
                                              <div key={idx} className="flex justify-between text-[8px] uppercase tracking-wider text-gray-500">
                                                <span className="truncate pr-2">• {item.name}</span>
                                                <span className="font-bold">₱{item.amount}</span>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                      <p className={`text-[8px] text-center font-black uppercase mt-3 pt-2 border-t border-dashed ${isCPaid ? "border-green-200 text-green-600" : isCPending ? "border-yellow-300 text-yellow-600" : isCRefund ? "border-teal-300 text-teal-600" : isCBalance ? "border-orange-300 text-orange-600" : "border-red-200 text-red-600"}`}>
                                        {isCPaid ? "PAID" : isCPending ? "FOR APPROVAL" : isCRefund ? "SETTLE REFUND" : isCBalance ? "ENTER BALANCE" : "ENTER PAYMENT"}
                                      </p>
                                   </div>
                                 );
                              })}
                            </div>
                          )}
                        </section>
                      );
                  })()}

                  <section className='bg-white p-5 rounded-xl border border-gray-200 col-span-1 md:col-span-2 shadow-sm'>
                    <h3 className="text-[#2D5B60] font-black uppercase text-[10px] tracking-widest mb-4 border-b border-gray-100 pb-3">3. Monthly Tuition Tracker ({selectedStudent.paymentInfo?.schoolYear})</h3>
                    
                    {(() => {
                        const fees = selectedStudent.paymentInfo?.fees || {};
                        const paidKeys = selectedStudent.paymentInfo?.paidInitialFees || [];
                        const allKeys = ['registration', 'misc', 'books', 'instructional', 'uniform', 'pta'];
                        const totalInitial = allKeys.reduce((s, k) => s + Number(fees[k] || 0), 0);
                        const basePaid = paidKeys.reduce((s, k) => s + Number(fees[k] || 0), 0);
                        const customPaid = Number(selectedStudent.paymentInfo?.customInitialPayment || 0);
                        const totalPaid = basePaid + customPaid;
                        const unpaidInitialBalance = totalInitial - totalPaid;

                        return (
                          <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3'>
                            
                            {unpaidInitialBalance > 0 && (() => {
                              const initFeeTracking = selectedStudent.paymentInfo?.initialFeeTracking;
                              const isInitPending = initFeeTracking?.status === "Pending Approval";

                              return (
                                <div 
                                  onClick={() => {
                                    if (isInitPending) handleApproveInitialFeeReceipt(unpaidInitialBalance, initFeeTracking);
                                    else handlePayInitialBalance(unpaidInitialBalance);
                                  }}
                                  className={`cursor-pointer border p-3 rounded-xl text-center relative transition-all hover:scale-[1.02] flex flex-col justify-center group ${
                                    isInitPending ? "bg-yellow-50 border-yellow-500 animate-pulse shadow-md" : "bg-red-50 border-red-300 shadow-sm"
                                  }`}
                                >
                                  {initFeeTracking?.receiptImage && isInitPending && (
                                    <div className="absolute -top-2 -right-2 bg-blue-600 text-white text-[8px] font-black px-2 py-1 rounded-full shadow-lg border-2 border-white">RECEIPT</div>
                                  )}
                                  <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${isInitPending ? 'text-yellow-600' : 'text-red-400'}`}>INIT. FEES</p>
                                  <p className={`text-lg font-black ${isInitPending ? 'text-yellow-700' : 'text-red-700'}`}>₱{unpaidInitialBalance.toLocaleString()}</p>
                                  <span className={`text-[8px] px-2 py-1 rounded-md font-black text-white uppercase tracking-wider mt-2 inline-block transition-colors ${
                                    isInitPending ? "bg-yellow-500" : "bg-red-500 group-hover:bg-red-600"
                                  }`}>
                                    {isInitPending ? "FOR APPROVAL" : "ENTER PAYMENT"}
                                  </span>
                                </div>
                              );
                            })()}

                            {selectedStudent.paymentInfo?.monthlyTracking ? (
                              Object.keys(selectedStudent.paymentInfo.monthlyTracking).map((month) => {
                                const data = selectedStudent.paymentInfo.monthlyTracking[month];
                                const isPending = data.status === "Pending Approval";
                                
                                return (
                                  <div 
                                    key={month} 
                                    onClick={() => handleMarkAsPaid(month, data.status, data.amount, data.receiptImage)}
                                    className={`cursor-pointer border p-3 rounded-xl text-center relative transition-all hover:scale-[1.02] ${
                                      data.status === "Paid" ? "bg-green-50 border-green-500 shadow-sm" : 
                                      isPending ? "bg-yellow-50 border-yellow-500 animate-pulse shadow-md" :
                                      data.status === "Open" ? "bg-orange-50 border-orange-300" : "bg-gray-50 border-gray-200"
                                    }`}
                                  >
                                    {data.receiptImage && isPending && (
                                      <div className="absolute -top-2 -right-2 bg-blue-600 text-white text-[8px] font-black px-2 py-1 rounded-full shadow-lg border-2 border-white">RECEIPT</div>
                                    )}
                                    <p className='text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1'>{month}</p>
                                    <p className={`text-lg font-black ${
                                      data.status === "Paid" ? "text-green-700" : 
                                      isPending ? "text-yellow-700" : "text-gray-700"
                                    }`}>₱{data.amount}</p>
                                    <span className={`text-[8px] px-2 py-1 rounded-md font-black text-white uppercase tracking-wider mt-2 inline-block ${
                                      data.status === "Paid" ? "bg-green-600" : 
                                      isPending ? "bg-yellow-500" :
                                      data.status === "Open" ? "bg-orange-500" : "bg-gray-400"
                                    }`}>
                                      {isPending ? "FOR APPROVAL" : data.status}
                                    </span>
                                  </div>
                                );
                              })
                            ) : <p className='text-gray-400 italic text-xs col-span-5 text-center py-5'>No monthly record found.</p>}
                          </div>
                        );
                    })()}
                  </section>

                  <section className='bg-gray-50 p-4 rounded-xl border border-gray-200'>
                    <h3 className="text-gray-500 font-black uppercase text-[10px] tracking-widest mb-3 border-b border-gray-200 pb-2">4. Father Information</h3>
                    <p className='uppercase text-xs'><span className='text-gray-400 font-bold'>Name:</span> <span className='font-black text-gray-700'>{selectedStudent.father?.firstname} {selectedStudent.father?.lastname}</span></p>
                  </section>
                  <section className='bg-gray-50 p-4 rounded-xl border border-gray-200'>
                    <h3 className="text-gray-500 font-black uppercase text-[10px] tracking-widest mb-3 border-b border-gray-200 pb-2">5. Mother Information</h3>
                    <p className='uppercase text-xs'><span className='text-gray-400 font-bold'>Name:</span> <span className='font-black text-gray-700'>{selectedStudent.mother?.firstname} {selectedStudent.mother?.lastname}</span></p>
                  </section>

                  <section className='bg-gray-50 p-4 rounded-xl border border-gray-200 col-span-1 md:col-span-2'>
                    <h3 className="text-[#2D5B60] font-black uppercase text-[10px] tracking-widest mb-3 border-b border-gray-200 pb-2">6. Address</h3>
                    <p className='uppercase text-gray-700 font-bold text-xs'>{selectedStudent.address?.purok}, {selectedStudent.address?.barangay}, {selectedStudent.address?.city}, {selectedStudent.address?.province}</p>
                  </section>
                </div>
              )}

              <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end gap-3">
                <button onClick={() => window.print()} className="bg-gray-800 text-white px-8 py-3 rounded-xl font-black text-[10px] tracking-widest uppercase hover:bg-black transition-colors">Print Form</button>
                <button onClick={() => setShowModal(false)} className="bg-gray-100 text-gray-700 px-8 py-3 rounded-xl font-black text-[10px] tracking-widest uppercase border border-gray-200 hover:bg-gray-200 transition-colors">Close Profile</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Students;