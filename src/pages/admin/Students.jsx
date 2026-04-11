import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, doc, updateDoc, query, orderBy, deleteDoc, getDoc, setDoc, getDocs, where } from 'firebase/firestore';
import { db } from '../../services/firebase';
import StudentsSkeleton from '../../components/Skeleton/StudentsSkeleton';
import { ChevronDown, Megaphone, Search, Eye, Trash2, FileText, CheckCircle2, ShieldAlert, Filter, ArchiveX, Archive, RefreshCw } from "lucide-react"; 
import axios from 'axios';
import { logAdminAction } from '../../services/systemLogger'; 
import { useOutletContext } from 'react-router-dom';

const Students = () => {
  const { userData } = useOutletContext();
  const isSuperAdmin = userData?.role === "superadmin";

  const [students, setStudents] = useState([]);
  const [enrollments, setEnrollments] = useState({}); 
  const [searchTerm, setSearchTerm] = useState("");
  const [branchFilter, setBranchFilter] = useState(isSuperAdmin ? "All" : userData?.branch);
  const [statusFilter, setStatusFilter] = useState("Active"); 
  
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentSY, setCurrentSY] = useState("2025-2026");
  const [showContribs, setShowContribs] = useState(null); 
  
  const monthOrder = [
    "June", "July", "August", "September", "October", "November", 
    "December", "January", "February", "March", "April", "May"
  ];

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

  useEffect(() => {
    if (!currentSY) return;
    const q = query(collection(db, "enrollments"), where("schoolYear", "==", currentSY));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const enrData = {};
      snapshot.docs.forEach(doc => {
        enrData[doc.data().studentID] = doc.data();
      });
      setEnrollments(enrData);
    });
    return () => unsubscribe();
  }, [currentSY]);

  const calculateBalance = (enr) => {
    if (!enr || !enr.fees) return null; 
    
    const fees = enr.fees || {};
    const allKeys = ['registration', 'misc', 'books', 'instructional', 'uniform', 'pta'];
    const totalInitial = allKeys.reduce((s, k) => s + Number(fees[k] || 0), 0);
    const paidKeys = enr.paidInitialFees || [];
    const basePaid = paidKeys.reduce((s, k) => s + Number(fees[k] || 0), 0);
    const customPaid = Number(enr.customInitialPayment || 0);
    const unpaidInitial = totalInitial - (basePaid + customPaid);

    const monthlyRate = Number(fees.monthlyRate || 0);
    let paidMonthly = 0;
    if (enr.monthlyTracking) {
      Object.values(enr.monthlyTracking).forEach(m => {
        const mPaid = m.amountPaid !== undefined ? Number(m.amountPaid) : (m.status === "Paid" ? monthlyRate : 0);
        paidMonthly += mPaid;
      });
    }
    const unpaidMonthly = (monthlyRate * 10) - paidMonthly;

    let unpaidContribs = 0;
    if (enr.contributions) {
      Object.values(enr.contributions).forEach(c => {
        const amtPaid = c.amountPaid || 0;
        unpaidContribs += (Number(c.amount || 0) - amtPaid);
      });
    }

    const grandTotal = unpaidInitial + unpaidMonthly + unpaidContribs;
    return grandTotal > 0 ? grandTotal : 0;
  };

  const handleMarkAsPaid = async (month, currentStatus, expectedAmount, receiptImage, currentPaid) => {
    if (!selectedStudent) return;
    const studentName = `${selectedStudent.firstname} ${selectedStudent.lastname}`;
    const monthlyRate = Number(expectedAmount || 0);
    
    if (currentStatus === "Pending Approval") {
      const action = window.prompt(
        `Tuition for ${month} is Pending Approval.\n\nType 'V' to View Receipt\nType 'A' to Approve Payment\nType 'R' to Reject Payment`,
        "V"
      );

      if (!action) return;
      const choice = action.toUpperCase();

      if (choice === 'V') {
        if (receiptImage) window.open(receiptImage, "_blank");
        else alert("No receipt attached.");
        return; 
      } else if (choice === 'A') {
        await updateFirestoreData(month, "Paid", monthlyRate, monthlyRate);
        await logAdminAction("PAYMENT_APPROVED", `Approved tuition payment for ${month} (₱${monthlyRate}) for ${studentName}`);
        return;
      } else if (choice === 'R') {
        await updateFirestoreData(month, "Unpaid", monthlyRate, 0);
        await logAdminAction("PAYMENT_REJECTED", `Rejected tuition payment for ${month} for ${studentName}`);
        return;
      }
      return;
    }

    const action = window.prompt(`Enter the total amount paid by the parent for ${month}\n(Monthly Tuition is ₱${monthlyRate}):`, currentPaid);
    if (action === null || action.trim() === "") return;

    const newPaid = Number(action);
    if (isNaN(newPaid) || newPaid < 0) return alert("Please enter a valid positive number.");

    let newStatus = "Unpaid";
    if (newPaid >= monthlyRate) newStatus = "Paid";
    else if (newPaid > 0) newStatus = "Balance Due";

    if(window.confirm(`Update ${month} to ${newStatus.toUpperCase()} with ₱${newPaid} paid?`)) {
      await updateFirestoreData(month, newStatus, monthlyRate, newPaid);
      await logAdminAction("TUITION_UPDATED", `Set ${month} tuition to ${newStatus} (₱${newPaid} paid) for ${studentName}`); 
    }
  };

  const updateFirestoreData = async (month, status, expectedAmount, amountPaid) => {
    try {
      const targetSY = selectedStudent.paymentInfo?.schoolYear || currentSY;
      const enrRef = doc(db, "enrollments", `ENR-${targetSY}-${selectedStudent.studentID}`);
      const timestamp = new Date().toISOString(); 
      
      await updateDoc(enrRef, {
        [`monthlyTracking.${month}.status`]: status,
        [`monthlyTracking.${month}.amount`]: expectedAmount,
        [`monthlyTracking.${month}.amountPaid`]: amountPaid,
        [`monthlyTracking.${month}.dateSubmitted`]: timestamp 
      });
      
      setSelectedStudent(prev => ({
        ...prev,
        paymentInfo: {
          ...prev.paymentInfo,
          monthlyTracking: {
            ...prev.paymentInfo.monthlyTracking,
            [month]: { ...prev.paymentInfo.monthlyTracking[month], status: status, amount: expectedAmount, amountPaid: amountPaid, dateSubmitted: timestamp }
          }
        }
      }));
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
        const timestamp = new Date().toISOString();

        await updateDoc(enrRef, { customInitialPayment: newCustomPaid, "initialFeeTracking.status": "Approved", "initialFeeTracking.dateSubmitted": timestamp });
        
        setSelectedStudent(prev => ({
          ...prev, paymentInfo: {
            ...prev.paymentInfo, customInitialPayment: newCustomPaid, initialFeeTracking: { ...trackingData, status: "Approved", dateSubmitted: timestamp }
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
    const timestamp = new Date().toISOString(); 

    if (cData.status === "Pending Approval") {
      const action = window.prompt(`${cData.title} is Pending Approval (₱${cData.amount}).\n\nType 'V' to View Receipt\nType 'A' to Approve Payment\nType 'R' to Reject Payment`, "V");

      if (!action) return;
      const choice = action.toUpperCase();

      if (choice === 'V') {
        if (cData.receiptImage) window.open(cData.receiptImage, "_blank");
        else alert("No receipt attached.");
      } else if (choice === 'A') {
        try {
          await updateDoc(enrRef, { [`contributions.${cId}.status`]: "Paid", [`contributions.${cId}.amountPaid`]: cData.amount, [`contributions.${cId}.dateSubmitted`]: timestamp });
          setSelectedStudent(prev => ({
            ...prev, paymentInfo: { ...prev.paymentInfo, contributions: { ...prev.paymentInfo.contributions, [cId]: { ...cData, status: "Paid", amountPaid: cData.amount, dateSubmitted: timestamp } } }
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
          await updateDoc(enrRef, { [`contributions.${cId}.status`]: "Paid", [`contributions.${cId}.amountPaid`]: cData.amount, [`contributions.${cId}.paymentMethod`]: "Admin-Cash", [`contributions.${cId}.dateSubmitted`]: timestamp });
          setSelectedStudent(prev => ({
            ...prev, paymentInfo: { ...prev.paymentInfo, contributions: { ...prev.paymentInfo.contributions, [cId]: { ...cData, status: "Paid", amountPaid: cData.amount, paymentMethod: "Admin-Cash", dateSubmitted: timestamp } } }
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
         
  const handleDelete = async (st) => {
    if (window.confirm(`WARNING: You are about to permanently delete the record for ${st.firstname} ${st.lastname}.\n\nThis will also permanently delete ALL their associated financial records, tuition tracking, and receipts from the financial ledger.\n\nAre you absolutely sure? This cannot be undone.`)) {
      try { 
        await deleteDoc(doc(db, "students", st.id)); 
        
        const targetSY = st.schoolYear || currentSY;
        await deleteDoc(doc(db, "enrollments", `ENR-${targetSY}-${st.studentID}`));
        
        await logAdminAction("STUDENT_DELETED", `Permanently deleted student and financial records for ID: ${st.studentID}`); 
        alert("Student and all associated financial records have been deleted.");
      } catch (error) { 
        console.error("Deletion Error:", error);
        alert("Failed to delete record."); 
      }
    }
  };

  // --- NEW: QUICK ARCHIVE FUNCTION ---
  const handleQuickArchive = async (id, currentStatus, studentName) => {
    const isArchived = ["Dropped", "Transferred", "Archived", "Graduated"].includes(currentStatus);
    
    if (isArchived) {
      if (window.confirm(`Restore ${studentName} to 'Enrolled' status?`)) {
        try {
          await updateDoc(doc(db, "students", id), { status: "Enrolled" });
          await logAdminAction("STATUS_RESTORED", `Restored student ${studentName} to Active Enrolled list`);
          alert("Student restored to Active list.");
        } catch (error) {
          alert("Failed to restore: " + error.message);
        }
      }
    } else {
      if (window.confirm(`Move ${studentName} to the Archive?`)) {
        try {
          await updateDoc(doc(db, "students", id), { status: "Archived" });
          await logAdminAction("STUDENT_ARCHIVED", `Archived student ${studentName}`);
          alert("Student moved to Archive.");
        } catch (error) {
          alert("Failed to archive: " + error.message);
        }
      }
    }
  };

  const handleStatusChange = async (studentId, newStatus) => {
    if (window.confirm(`Are you sure you want to change this student's status to ${newStatus}?`)) {
      try {
        await updateDoc(doc(db, "students", studentId), { status: newStatus });
        await logAdminAction("STATUS_CHANGED", `Changed student status to ${newStatus} for ID: ${studentId}`);
        setSelectedStudent(prev => ({...prev, status: newStatus}));
        alert(`Status successfully updated to ${newStatus}.`);
      } catch (error) {
        alert("Failed to update status: " + error.message);
      }
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

  const handlePrintForm = () => {
    if (!selectedStudent) return;
    
    const win = window.open('', '_blank');
    win.document.write(`
      <html>
      <head>
        <title>Student Profile - ${selectedStudent.studentID}</title>
        <style>
          body { font-family: 'Arial', sans-serif; padding: 40px; color: #333; max-width: 800px; margin: auto; }
          .header { text-align: center; border-bottom: 2px solid #2D5B60; padding-bottom: 20px; margin-bottom: 20px; }
          .header h2 { color: #2D5B60; margin: 0; font-size: 24px; text-transform: uppercase; }
          .header p { margin: 5px 0 0 0; color: #666; font-size: 12px; letter-spacing: 2px; }
          .section-title { font-size: 14px; font-weight: bold; color: #2D5B60; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-top: 30px; margin-bottom: 15px; text-transform: uppercase; }
          .row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 14px; border-bottom: 1px solid #f0f0f0; padding-bottom: 5px; }
          .row strong { color: #555; width: 40%; }
          .row span { width: 60%; text-transform: uppercase; font-weight: bold; color: #222; }
          .footer { text-align: center; margin-top: 50px; font-size: 10px; color: #999; border-top: 1px dashed #ccc; padding-top: 20px;}
        </style>
      </head>
      <body>
        <div class="header">
          <h2>Myrtle Christian School</h2>
          <p>Official Student Profile Form</p>
        </div>

        <div class="section-title">Academic Information</div>
        <div class="row"><strong>School Year:</strong> <span>${selectedStudent.paymentInfo?.schoolYear || currentSY}</span></div>
        <div class="row"><strong>Student ID:</strong> <span>${selectedStudent.studentID || 'N/A'}</span></div>
        <div class="row"><strong>Enrollment Status:</strong> <span>${selectedStudent.status}</span></div>
        <div class="row"><strong>Level & Grade:</strong> <span>${selectedStudent.level} - Grade ${selectedStudent.grade}</span></div>

        <div class="section-title">Personal Information</div>
        <div class="row"><strong>Full Name:</strong> <span>${selectedStudent.lastname}, ${selectedStudent.firstname} ${selectedStudent.middlename || ''}</span></div>
        <div class="row"><strong>Age / Sex:</strong> <span>${selectedStudent.age} years old / ${selectedStudent.sex}</span></div>
        <div class="row"><strong>Student Type:</strong> <span>${selectedStudent.studentType}</span></div>

        <div class="section-title">Family & Contact</div>
        <div class="row"><strong>Father's Name:</strong> <span>${selectedStudent.father?.firstname || 'N/A'} ${selectedStudent.father?.lastname || ''}</span></div>
        <div class="row"><strong>Mother's Name:</strong> <span>${selectedStudent.mother?.firstname || 'N/A'} ${selectedStudent.mother?.lastname || ''}</span></div>
        <div class="row"><strong>Address:</strong> <span>${selectedStudent.address?.purok || ''}, ${selectedStudent.address?.barangay || ''}, ${selectedStudent.address?.city || ''}, ${selectedStudent.address?.province || ''}</span></div>

        <div class="footer">
          Generated by Myrtle Christian School Management System<br/>
          Date Printed: ${new Date().toLocaleDateString()}
        </div>
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `);
    win.document.close();
  };

  if (loading) return <StudentsSkeleton/>;

  const filteredStudents = students.filter(st => {
    const matchesSearch = st.lastname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          st.firstname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          st.studentID?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesBranch = branchFilter === "All" ? true : (st.branch === branchFilter || !st.branch);
    
    const isArchivedStatus = ["Dropped", "Transferred", "Archived", "Graduated"].includes(st.status);
    let matchesStatus = true;
    if (statusFilter === "Active") matchesStatus = !isArchivedStatus;
    if (statusFilter === "Archived") matchesStatus = isArchivedStatus;
    
    return matchesSearch && matchesBranch && matchesStatus;
  });

  return (
    <div className='bg-gray-50 p-4 md:p-8 shadow-sm rounded-2xl min-h-screen'>
      {/* HEADER & SEARCH BAR */}
      <div className='flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100'>
        <div>
          <h2 className="text-2xl font-black text-[#2D5B60] tracking-tight">Student Management</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            <p className='text-xs text-gray-500 font-medium'>
              Viewing Data for <span className="font-bold text-gray-800">S.Y. {currentSY}</span>
            </p>
          </div>
        </div>
        
        <div className='flex gap-3 w-full lg:w-auto'>
          
          <div className="relative w-44">
             <ArchiveX className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
             <select 
               value={statusFilter} 
               onChange={(e) => setStatusFilter(e.target.value)}
               className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-[#2D5B60] text-sm font-bold text-gray-600 cursor-pointer"
             >
               <option value="Active">Active Students</option>
               <option value="Archived">Archived / Dropped</option>
               <option value="All">All Records</option>
             </select>
          </div>

          {isSuperAdmin && (
             <div className="relative w-40">
               <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
               <select 
                 value={branchFilter} 
                 onChange={(e) => setBranchFilter(e.target.value)}
                 className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-[#2D5B60] text-sm font-bold text-gray-600 cursor-pointer"
               >
                 <option value="All">All Branches</option>
                 <option value="Irosin">Irosin Only</option>
                 <option value="Matnog">Matnog Only</option>
               </select>
             </div>
          )}
          
          <div className='relative flex-1 lg:w-80 group'>
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#2D5B60] transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search name or ID..." 
              className='border border-gray-200 rounded-xl pl-11 pr-4 py-3 w-full outline-none focus:ring-2 focus:ring-[#2D5B60]/20 focus:border-[#2D5B60] transition-all text-sm font-medium bg-gray-50 focus:bg-white shadow-inner inset-0'
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>


      {/* STUDENT TABLE */}
      <div className='overflow-hidden bg-white rounded-2xl shadow-sm border border-gray-200'>
        <div className="overflow-x-auto">
          <table className='w-full text-left border-collapse'>
            <thead className='bg-gray-50/80 text-gray-500 text-[10px] uppercase font-black tracking-widest border-b border-gray-200'>
              <tr>
                <th className='px-6 py-5 whitespace-nowrap'>Student Information</th>
                <th className='px-6 py-5 whitespace-nowrap'>Level / Grade</th>
                <th className='px-6 py-5 whitespace-nowrap'>Documents</th>
                <th className='px-6 py-5 whitespace-nowrap text-center'>Balance</th>
                <th className='px-6 py-5 whitespace-nowrap text-center'>Status</th>
                <th className='px-6 py-5 whitespace-nowrap text-right'>Actions</th>
              </tr>
            </thead>
            <tbody className='text-sm divide-y divide-gray-100'>
              {filteredStudents.length === 0 ? (
                 <tr><td colSpan="6" className="text-center py-10 text-gray-400 italic font-medium">No students found matching your search.</td></tr>
              ) : (
                filteredStudents.map((st) => (
                <tr key={st.id} className={`transition-colors group ${["Dropped", "Transferred", "Archived", "Graduated"].includes(st.status) ? "bg-red-50 hover:bg-red-100/50 opacity-80" : "hover:bg-[#2D5B60]/5"}`}>
                  <td className='px-6 py-4'>
                    <div className={`font-black uppercase tracking-tight ${["Dropped", "Transferred", "Archived", "Graduated"].includes(st.status) ? "text-red-800" : "text-gray-800"}`}>{st.lastname}, {st.firstname}</div>
                    <div className='text-[10px] text-gray-500 font-bold tracking-widest mt-0.5'>{st.studentID || "PENDING ID"}</div>
                  </td>
                  <td className='px-6 py-4'>
                    <div className='font-bold text-[#2D5B60] text-sm'>{st.level}</div>
                    <div className='text-xs text-gray-500 font-medium'>Grade {st.grade}</div>
                  </td>
                  <td className='px-6 py-4'>
                    <div className='flex flex-col gap-2'>
                      {st.requirements?.birthCert && (
                        <a href={st.requirements.birthCert} target="_blank" rel="noreferrer" className='inline-flex items-center gap-1.5 text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider hover:bg-blue-100 transition-colors w-max'>
                          <FileText size={12} /> Birth Cert
                        </a>
                      )}
                      {st.requirements?.reportCard && (
                        <a href={st.requirements.reportCard} target="_blank" rel="noreferrer" className='inline-flex items-center gap-1.5 text-purple-600 bg-purple-50 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider hover:bg-purple-100 transition-colors w-max'>
                          <FileText size={12} /> Report Card
                        </a>
                      )}
                    </div>
                  </td>
                  
                  <td className='px-6 py-4 text-center'>
                    {(() => {
                      const enr = enrollments[st.studentID];
                      
                      if (st.status === "Submitted for Verification") {
                         return <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Pending Check</span>;
                      }
                      if (!enr) {
                         return <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Not Enrolled</span>;
                      }
                      
                      const balance = calculateBalance(enr);
                      
                      if (balance === null) {
                         return <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Assessing</span>;
                      }
                      
                      if (balance === 0) {
                         return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm bg-green-100 text-green-700 border border-green-200">Fully Paid</span>;
                      }
                      
                      return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm bg-red-50 text-red-600 border border-red-200">₱{balance.toLocaleString()} Due</span>;
                    })()}
                  </td>

                  <td className='px-6 py-4 text-center'>
                    <span className={`inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest w-28 ${
                      st.status === "Enrolled" ? 'bg-green-50 text-green-700 border border-green-200' : 
                      st.status === "Waiting for Payment" ? 'bg-orange-50 text-orange-600 border border-orange-200' :
                      st.status === "Payment Submitted" ? 'bg-blue-50 text-blue-600 border border-blue-200' :
                      ["Dropped", "Transferred", "Archived", "Graduated"].includes(st.status) ? 'bg-red-800 text-white border border-red-900 shadow-md' :
                      'bg-gray-100 text-gray-600 border border-gray-200'
                    }`}>
                      {st.status || 'Pending'}
                    </span>
                  </td>
                  <td className='px-6 py-4 text-right'>
                      <div className='flex justify-end items-center gap-2'>
                        
                        {st.status === "Submitted for Verification" && (
                          <>
                            <button onClick={() => handleVerifyRequirements(st.id, st.studentID)} className='bg-yellow-500 text-white px-3 py-2 rounded-lg text-[10px] font-bold hover:bg-yellow-600 shadow-sm flex items-center gap-1'>
                              <CheckCircle2 size={14}/> Verify Docs
                            </button>
                            <button onClick={() => handleReject(st.id, st.studentID)} className='bg-white text-red-600 px-3 py-2 rounded-lg text-[10px] font-bold border border-red-200 hover:bg-red-50 flex items-center gap-1'>
                              Reject
                            </button>
                          </>
                        )}

                        {st.status === "Waiting for Payment" && (
                          <span className='px-3 py-2 rounded-lg text-[9px] font-black text-orange-500 uppercase tracking-wider flex items-center gap-1 bg-orange-50'>
                            <ShieldAlert size={14}/> Awaiting Pay
                          </span>
                        )}

                        {st.status === "Payment Submitted" && (
                          <button onClick={() => handleApprove(st.id, st.studentID)} className='bg-[#2D5B60] text-white px-3 py-2 rounded-lg text-[10px] font-bold hover:bg-black shadow-sm flex items-center gap-1'>
                             <CheckCircle2 size={14}/> Approve Pay
                          </button>
                        )}

                        <button onClick={() => handleViewDetails(st)} className='bg-[#2D5B60] text-white px-4 py-2 rounded-lg text-[10px] font-bold shadow-sm hover:bg-[#1a383b] transition-colors flex items-center gap-1.5'>
                          <Eye size={14} /> Details
                        </button>

                        {/* --- NEW: QUICK ARCHIVE/RESTORE BUTTON --- */}
                        {["Dropped", "Transferred", "Archived", "Graduated"].includes(st.status) ? (
                          <button onClick={() => handleQuickArchive(st.id, st.status, `${st.firstname} ${st.lastname}`)} className='bg-blue-50 text-blue-600 px-3 py-2 rounded-lg text-[10px] font-bold hover:bg-blue-100 shadow-sm flex items-center gap-1' title="Restore to Active">
                            <RefreshCw size={14} /> Restore
                          </button>
                        ) : (
                          <button onClick={() => handleQuickArchive(st.id, st.status, `${st.firstname} ${st.lastname}`)} className='bg-gray-100 text-gray-600 px-3 py-2 rounded-lg text-[10px] font-bold hover:bg-gray-200 shadow-sm flex items-center gap-1' title="Move to Archive">
                            <Archive size={14} /> Archive
                          </button>
                        )}

                        <button onClick={() => handleDelete(st)} className='text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors' title="Delete Student">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                </tr>
              ))
              )}
            </tbody>
          </table>
        </div>
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

                    <div className='flex items-center justify-between mt-4 pt-3 border-t border-gray-200'>
                      <span className='text-gray-400 font-bold text-[10px] uppercase'>Update Status:</span>
                      <select
                        value={selectedStudent.status}
                        onChange={(e) => handleStatusChange(selectedStudent.id, e.target.value)}
                        className={`font-black text-[10px] uppercase tracking-widest px-2 py-1 rounded outline-none border cursor-pointer ${
                          selectedStudent.status === "Enrolled" ? "bg-green-100 text-green-700 border-green-200" :
                          ["Dropped", "Transferred", "Archived", "Graduated"].includes(selectedStudent.status) ? "bg-red-100 text-red-700 border-red-200" :
                          "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200"
                        }`}
                      >
                        <option value="Submitted for Verification">Submitted for Verification</option>
                        <option value="Waiting for Payment">Waiting for Payment</option>
                        <option value="Payment Submitted">Payment Submitted</option>
                        <option value="Enrolled">Enrolled</option>
                        <option disabled>──────────</option>
                        <option value="Dropped">Dropped</option>
                        <option value="Transferred">Transferred</option>
                        <option value="Archived">Archived</option>
                        <option value="Graduated">Graduated</option>
                      </select>
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
                                        isCBalance ? "bg-red-50 border-red-300 shadow-sm hover:bg-red-100" :
                                        "bg-red-50 border-red-200 hover:bg-red-100 shadow-sm"
                                      }`}
                                   >
                                      {cData.receiptImage && isCPending && (
                                        <div className="absolute -top-2 -right-2 bg-blue-600 text-white text-[8px] font-black px-2 py-1 rounded-full shadow-lg border-2 border-white">RECEIPT</div>
                                      )}
                                      <div>
                                        <div className="flex justify-between items-start mb-1">
                                          <p className={`text-[10px] font-bold uppercase leading-tight pr-2 ${isCPaid ? "text-green-800" : isCPending ? "text-yellow-800" : isCRefund ? "text-teal-800" : "text-red-800"}`}>{cData.title}</p>
                                          <p className={`text-sm font-black ${isCPaid ? "text-green-900" : isCPending ? "text-yellow-900" : isCRefund ? "text-teal-900" : "text-red-900"}`}>₱{displayAmount}</p>
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
                                      <p className={`text-[8px] text-center font-black uppercase mt-3 pt-2 border-t border-dashed ${isCPaid ? "border-green-200 text-green-600" : isCPending ? "border-yellow-300 text-yellow-600" : isCRefund ? "border-teal-300 text-teal-600" : isCBalance ? "border-red-300 text-red-600" : "border-red-200 text-red-600"}`}>
                                        {isCPaid ? "PAID" : isCPending ? "FOR APPROVAL" : isCRefund ? "SETTLE REFUND" : isCBalance ? `₱${balanceDue} DUE` : "ENTER PAYMENT"}
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
                                    isInitPending ? "bg-yellow-50 border-yellow-500 animate-pulse shadow-md" : "bg-red-50 border-red-300 shadow-sm hover:bg-red-100"
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
                              monthOrder.map((month) => {
                                const dbMonthKey = month.substring(0, 3).toUpperCase();
                                const data = selectedStudent.paymentInfo.monthlyTracking[dbMonthKey];
                                if (!data) return null;

                                const isPending = data.status === "Pending Approval";
                                
                                const monthlyRate = Number(selectedStudent.paymentInfo?.fees?.monthlyRate || data.amount || 0);
                                const amtPaid = data.amountPaid !== undefined ? Number(data.amountPaid) : (data.status === "Paid" ? monthlyRate : 0);
                                const balanceDue = monthlyRate - amtPaid;

                                const isPaid = data.status === "Paid" || amtPaid >= monthlyRate;
                                const isBalance = data.status === "Balance Due" || (amtPaid > 0 && amtPaid < monthlyRate);

                                let cardClass = "bg-gray-50 border-gray-200";
                                let textClass = "text-gray-700";
                                let tagClass = "bg-gray-400";
                                let tagText = data.status || "UNPAID";
                                let displayAmount = monthlyRate;

                                if (isPaid) {
                                  cardClass = "bg-green-50 border-green-500 shadow-sm";
                                  textClass = "text-green-700";
                                  tagClass = "bg-green-600";
                                  tagText = "PAID";
                                } else if (isPending) {
                                  cardClass = "bg-yellow-50 border-yellow-500 animate-pulse shadow-md";
                                  textClass = "text-yellow-700";
                                  tagClass = "bg-yellow-500";
                                  tagText = "FOR APPROVAL";
                                } else if (isBalance) {
                                  cardClass = "bg-red-50 border-red-300 shadow-sm group-hover:bg-red-100";
                                  textClass = "text-red-700";
                                  tagClass = "bg-red-500 group-hover:bg-red-600";
                                  tagText = `₱${balanceDue} DUE`;
                                  displayAmount = balanceDue;
                                } else {
                                  tagText = "ENTER PAYMENT";
                                }
                                
                                return (
                                  <div 
                                    key={month} 
                                    onClick={() => handleMarkAsPaid(dbMonthKey, data.status, monthlyRate, data.receiptImage, amtPaid)}
                                    className={`cursor-pointer border p-3 rounded-xl text-center relative transition-all hover:scale-[1.02] group ${cardClass}`}
                                  >
                                    {data.receiptImage && isPending && (
                                      <div className="absolute -top-2 -right-2 bg-blue-600 text-white text-[8px] font-black px-2 py-1 rounded-full shadow-lg border-2 border-white">RECEIPT</div>
                                    )}
                                    <p className='text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1'>{month.substring(0, 3)}</p>
                                    <p className={`text-lg font-black ${textClass}`}>₱{displayAmount}</p>
                                    <span className={`text-[8px] px-2 py-1 rounded-md font-black text-white uppercase tracking-wider mt-2 inline-block transition-colors ${tagClass}`}>
                                      {tagText}
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
                <button onClick={handlePrintForm} className="bg-gray-800 text-white px-8 py-3 rounded-xl font-black text-[10px] tracking-widest uppercase hover:bg-black transition-colors">Print Form</button>
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