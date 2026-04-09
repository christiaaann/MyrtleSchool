import React, { useState, useEffect, useRef } from "react"; 
import { doc, onSnapshot, updateDoc, deleteDoc ,collection, query, where } from "firebase/firestore"; 
import { db, auth } from "../../services/firebase"; 
import { ChevronDown, Megaphone } from "lucide-react"; 
import { logAdminAction } from "../../services/systemLogger";

const EnrollmentArchive = ({
  setpage,
  myStudents: propsStudents,
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
  setPage 
}) => {
  const [students, setStudents] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [expandedContribs, setExpandedContribs] = useState({}); 
  const [currentSY, setCurrentSY] = useState(""); 
  const [showHistory, setShowHistory] = useState({}); 
  const [cart, setCart] = useState({ student: null, items: [], type: "" }); 
  
  const [showPayModal, setShowPayModal] = useState(false);
  const [payMethod, setPayMethod] = useState(""); 
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const schoolMonths = ["June", "July", "August", "September", "October", "November", "December", "January", "February", "March"];

  useEffect(() => {
    const unsubSettings = onSnapshot(doc(db, "settings", "schoolYear"), (snap) => {
      if (snap.exists()) setCurrentSY(snap.data().active);
    });
    return () => unsubSettings();
  }, []);

  useEffect(() => {
    if (!currentSY || !auth.currentUser) return;
    const q = query(collection(db, "students"), where("parentUID", "==", auth.currentUser.uid));
    const unsub = onSnapshot(q, (snap) => {
      setStudents(snap.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    });
    return () => unsub();
  }, [currentSY, auth.currentUser?.uid]);

  useEffect(() => {
    if (!students?.length || !currentSY) return;
    const unsubscribes = students.map((stud) => {
      return onSnapshot(doc(db, "enrollments", `ENR-${currentSY}-${stud.studentID}`), (snap) => {
        if (snap.exists()) {
          setStudents(prev => prev.map(s => s.studentID === stud.studentID ? { ...s, ...snap.data() } : s));
        }
      });
    });
    return () => unsubscribes.forEach(u => u());
  }, [students.length, currentSY]); 

  const formatSchoolID = (stud) => {
    if (!stud?.studentID) return "";
    const raw = String(stud.studentID).replace(/\D/g, "");
    const last4 = raw.slice(-4).padStart(4, "0");
    const year = stud.schoolYear ? stud.schoolYear.split("-")[1] : new Date().getFullYear();
    return `MCS-${year}-${last4}`;
  };

  const groupedStudents = (students || []).reduce((acc, current) => {
    const fullName = `${current.firstname}-${current.lastname}`.toLowerCase();
    if (!acc[fullName] || current.schoolYear > acc[fullName].schoolYear) {
      acc[fullName] = current;
    }
    return acc;
  }, {});
  
  const uniqueStudentList = Object.values(groupedStudents);

  const handleDelete = async (stud) => {
    if (window.confirm(`Sigurado ka bang buburahin ang application ni ${stud.firstname}?`)) {
      try {
        await deleteDoc(doc(db, "students", stud.studentID));
        await deleteDoc(doc(db, "enrollments", `ENR-${stud.schoolYear}-${stud.studentID}`));
      } catch (error) { 
        console.error(error); 
      }
    }
  };

  const handleReEnroll = (stud) => {
    setChildFirst(stud.firstname); 
    setChildMiddle(stud.middlename || ""); 
    setChildLast(stud.lastname);
    setSuffix(stud.suffix || "none"); 
    setAge(stud.age); 
    setSex(stud.sex); 
    setStudentType("Old"); 
    setPrevSchool(""); 
    setLevel(""); 
    setGrade(""); 
    setFiles({ birthCert: null, reportCard: null, idPicture: null });
    setPaymentMethod(""); 
    setEditingStudent(null); 
    setPage("personal"); 
  };

  const handleProceedToPayment = (stud) => {
    setChildFirst(stud.firstname); 
    setChildMiddle(stud.middlename || ""); 
    setChildLast(stud.lastname);
    setSuffix(stud.suffix || "none"); 
    setAge(stud.age); 
    setSex(stud.sex); 
    setStudentType(stud.studentType); 
    setPrevSchool(stud.previousSchool || ""); 
    setLevel(stud.level); 
    setGrade(stud.grade);
    setFiles({ birthCert: null, reportCard: null, idPicture: null }); 
    setPaymentMethod(stud.paymentMethod || ""); 
    setEditingStudent(stud); 
    setPage("personal"); 
  };

  const generateReceipt = (stud, amount, description, breakdownItems = null) => {
    let breakdownHTML = '';
    
    if (description === "Initial Enrollment Fees") {
      breakdownHTML += `<div style="margin-top: 30px; padding-top: 15px; border-top: 2px dashed #ccc;">`;
      breakdownHTML += `<strong style="font-size: 12px; color: #2D5B60; text-transform: uppercase; letter-spacing: 1px;">Itemized Breakdown:</strong><br/><br/>`;
      const safePaidInitials = Array.isArray(stud.paidInitialFees) ? stud.paidInitialFees : [];
      safePaidInitials.forEach(key => {
        const feeName = key === 'misc' ? 'Miscellaneous' : key;
        const feeAmount = stud.fees?.[key] || 0;
        breakdownHTML += `<div class="row" style="border: none; margin-bottom: 5px;"><span style="text-transform: uppercase; font-size: 12px; color: #666;">• ${feeName}</span> <span style="font-size: 12px; font-weight: bold;">₱${feeAmount.toLocaleString()}</span></div>`;
      });
      const customPaid = Number(stud.customInitialPayment || 0);
      if (customPaid > 0) {
         breakdownHTML += `<div class="row" style="border: none; margin-bottom: 5px;"><span style="text-transform: uppercase; font-size: 12px; color: #666;">• Additional Payment (Admin)</span> <span style="font-size: 12px; font-weight: bold;">₱${customPaid.toLocaleString()}</span></div>`;
      }
      breakdownHTML += `</div>`;
    } 
    else if (breakdownItems && breakdownItems.length > 0) {
      breakdownHTML += `<div style="margin-top: 30px; padding-top: 15px; border-top: 2px dashed #ccc;">`;
      breakdownHTML += `<strong style="font-size: 12px; color: #2D5B60; text-transform: uppercase; letter-spacing: 1px;">Itemized Breakdown:</strong><br/><br/>`;
      breakdownItems.forEach(item => {
         breakdownHTML += `<div class="row" style="border: none; margin-bottom: 5px;"><span style="text-transform: uppercase; font-size: 12px; color: #666;">• ${item.name}</span> <span style="font-size: 12px; font-weight: bold;">₱${Number(item.amount).toLocaleString()}</span></div>`;
      });
      breakdownHTML += `</div>`;
    }

    const win = window.open('', '_blank');
    win.document.write(`
      <html>
      <head>
        <title>Receipt - ${stud.studentID}</title>
        <style>
          body { font-family: 'Arial', sans-serif; padding: 40px; color: #333; max-width: 600px; margin: auto; }
          .header { text-align: center; border-bottom: 2px solid #2D5B60; padding-bottom: 20px; margin-bottom: 20px; }
          .header h2 { color: #2D5B60; margin: 0; font-size: 24px; text-transform: uppercase; }
          .header p { margin: 5px 0 0 0; color: #666; font-size: 12px; letter-spacing: 2px; }
          .row { display: flex; justify-content: space-between; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 5px; font-size: 14px; }
          .total { font-size: 24px; font-weight: 900; color: #2D5B60; text-align: right; margin-top: 20px; border-top: 2px solid #2D5B60; padding-top: 15px; }
          .footer { text-align: center; margin-top: 50px; font-size: 10px; color: #999; border-top: 1px dashed #ccc; padding-top: 20px;}
        </style>
      </head>
      <body>
        <div class="header">
          <h2>Myrtle Christian School</h2>
          <p>Official Acknowledgement Receipt</p>
        </div>
        <div class="row"><strong>Date Printed:</strong> <span>${new Date().toLocaleDateString()}</span></div>
        <div class="row"><strong>Student Name:</strong> <span style="text-transform: uppercase;">${stud.firstname} ${stud.lastname}</span></div>
        <div class="row"><strong>Student ID:</strong> <span>${formatSchoolID(stud)}</span></div>
        <div class="row"><strong>Payment For:</strong> <span style="text-transform: uppercase;">${description}</span></div>
        
        ${breakdownHTML}
        
        <div class="total">TOTAL PAID: ₱${amount.toLocaleString()}</div>
        
        <div class="footer">
          This is a system-generated digital receipt and does not require a physical signature.<br/>
          Valid for S.Y. ${currentSY}
        </div>
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `);
    win.document.close();
  };

  const handleToggleCart = (student, itemKey, amount, type = "monthly") => {
    if (cart.student && cart.student.studentID !== student.studentID) {
      setCart({ student, items: [{ key: itemKey, amount }], type });
      return;
    }
    if (cart.type !== type && cart.items.length > 0) {
       alert("Please process tuitions, initial fees, and special contributions in separate transactions.");
       return;
    }
    const exists = cart.items.find(i => i.key === itemKey);
    if (exists) setCart({ student, items: cart.items.filter(i => i.key !== itemKey), type });
    else setCart({ student, items: [...cart.items, { key: itemKey, amount }], type });
  };

  const handleConfirmPayment = async () => {
    if (!payMethod) return alert("Please select a payment method.");
    const file = fileInputRef.current?.files[0];
    if (payMethod === "GCash" && !file) return alert("Please upload your GCash receipt.");

    setIsUploading(true);
    try {
      let receiptUrl = "";
      if (payMethod === "GCash" && file) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
        const res = await fetch(`https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`, {
          method: "POST", body: formData,
        });
        const cloudData = await res.json();
        receiptUrl = cloudData.secure_url;
      }

      const enrRef = doc(db, "enrollments", `ENR-${currentSY}-${cart.student.studentID}`);
      const updates = {};
      
      cart.items.forEach((item) => {
        if (cart.type === "monthly") {
          const shortMonth = item.key.substring(0, 3).toUpperCase();
          updates[`monthlyTracking.${shortMonth}.status`] = "Pending Approval";
          updates[`monthlyTracking.${shortMonth}.paymentMethod`] = payMethod;
          updates[`monthlyTracking.${shortMonth}.receiptImage`] = receiptUrl;
          updates[`monthlyTracking.${shortMonth}.dateSubmitted`] = new Date().toISOString();
        } else if (cart.type === "contribution") {
          updates[`contributions.${item.key}.status`] = "Pending Approval";
          updates[`contributions.${item.key}.paymentMethod`] = payMethod;
          updates[`contributions.${item.key}.receiptImage`] = receiptUrl;
        } else if (cart.type === "initial") {
          updates[`initialFeeTracking.status`] = "Pending Approval";
          updates[`initialFeeTracking.amount`] = item.amount;
          updates[`initialFeeTracking.paymentMethod`] = payMethod;
          updates[`initialFeeTracking.receiptImage`] = receiptUrl;
          updates[`initialFeeTracking.dateSubmitted`] = new Date().toISOString();
        }
      });

      await updateDoc(enrRef, updates);
      
      const totalCartValue = cart.items.reduce((sum, i) => sum + i.amount, 0);
      const studentName = `${cart.student.firstname} ${cart.student.lastname}`;
      await logAdminAction("PAYMENT_SUBMITTED", `Parent submitted ₱${totalCartValue} payment via ${payMethod} for ${studentName}`);
      
      alert("Payment submitted! Please wait for admin approval.");
      setShowPayModal(false);
      setCart({ student: null, items: [], type: "" }); 
    } catch (error) {
      console.error(error);
      alert("Something went wrong.");
    } finally {
      setIsUploading(false);
    }
  };

  if (setpage !== "archive") return null;

  return (
    <div className="min-h-screen p-5 w-full">  
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-col">
          <h2 className="text-2xl dark:text-neutral-500">Records</h2>
          <p className="text-[10px] font-bold text-gray-400 dark:text-neutral-500">CURRENT SY: {currentSY || "Loading..."}</p>
        </div>
        <button onClick={handleAddNewChild} className="bg-gray-200 text-black/50 px-5 py-2 rounded-xl text-[10px] text-nowrap font-bold hover:bg-green-100 transition-all">
          + Add New Child
        </button>
      </div>

      <div className="relative mt-2">
        <div className="grid grid-cols-1 gap-6">
          {uniqueStudentList && uniqueStudentList.length > 0 ? (
            uniqueStudentList.map((stud) => {
              const history = (students || []).filter(s => s.firstname === stud.firstname && s.lastname === stud.lastname).sort((a, b) => b.schoolYear.localeCompare(a.schoolYear));
              const isAppliedThisYear = stud.schoolYear === currentSY;

              const paymentRecord = stud.monthlyTracking ?? {};
              const monthlyRate = Number(stud.fees?.monthlyRate || 0);
              
              const totalPaidMonthly = Object.values(paymentRecord).filter(i => i?.status === "Paid").reduce((acc, i) => acc + Number(i?.amount || 0), 0);
              const unpaidMonthlyBalance = (monthlyRate * 10) - totalPaidMonthly;

              const allInitialFeeKeys = ['registration', 'misc', 'books', 'instructional', 'uniform', 'pta'];
              const totalInitialFees = allInitialFeeKeys.reduce((sum, key) => sum + Number(stud.fees?.[key] || 0), 0);
              const safePaidInitials = Array.isArray(stud.paidInitialFees) ? stud.paidInitialFees : [];
              const basePaidInitial = safePaidInitials.reduce((sum, key) => sum + Number(stud.fees?.[key] || 0), 0);
              const customPaidInitial = Number(stud.customInitialPayment || 0);
              const totalPaidInitial = basePaidInitial + customPaidInitial;
              const unpaidInitialBalance = totalInitialFees - totalPaidInitial;

              const remainingBalance = unpaidMonthlyBalance + unpaidInitialBalance;
              const isStudentCartActive = cart.student?.studentID === stud.studentID && cart.items.length > 0;

              return (
                <div key={stud.studentID} className={`border rounded-xl bg-white dark:bg-neutral-900 shadow-sm overflow-hidden dark:border-neutral-700 transition-all ${isStudentCartActive ? "ring-2 ring-[#2D5B60] border-transparent" : "border-gray-200"}`}>
                  <div className="p-5 flex flex-col md:flex-row justify-between items-center gap-4 bg-gray-50/50 dark:bg-neutral-900">
                    <div className="flex gap-4 items-center w-full">
                      <img className="w-16 h-16 object-cover rounded-full border-2 border-white shadow-md" src={stud.requirements?.idPicture || "/default-avatar.png"} alt="Student" />
                      <div>
                        <h3 className="font-semibold text-lg dark:text-neutral-400 leading-tight">{stud.firstname} {stud.middlename} {stud.lastname}</h3>  
                        <p className="text-[11px] font-bold text-gray-400 uppercase dark:text-neutral-400 tracking-tighter"> ID: {formatSchoolID(stud)} • {stud.level} - Grade {stud.grade}</p>
                        <div className="flex gap-3 mt-1">
                          <button onClick={() => setShowHistory(prev => ({...prev, [stud.studentID]: !prev[stud.studentID]}))} className="text-[#2D5B60] text-[10px] font-bold underline uppercase">
                            {showHistory[stud.studentID] ? "Hide History" : "View Academic History"}
                          </button>
                          <button onClick={() => setExpandedId(expandedId === stud.studentID ? null : stud.studentID)} className="text-gray-400 text-[10px] font-bold underline uppercase">
                            {expandedId === stud.studentID ? "Hide Info" : "View Info"}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 w-full md:w-auto justify-end items-center">
                      {!isAppliedThisYear && (
                        <button onClick={() => handleReEnroll(stud)} className="px-3 py-1.5 rounded-lg text-[9px] font-black bg-[#2D5B60] text-white hover:bg-black shadow-sm">
                          RE-ENROLL<br/>FOR {currentSY}
                        </button>
                      )}
                      {isAppliedThisYear && !stud.isEnrolled && stud.status === "Waiting for Payment" && (
                        <button onClick={() => handleProceedToPayment(stud)} className="px-3 py-1.5 rounded-lg text-[9px] font-black bg-yellow-500 text-white hover:bg-yellow-600 shadow-md animate-pulse">
                          PROCEED TO<br/>PAYMENT
                        </button>
                      )}
                      <div className={`px-3 py-1.5 rounded-lg text-center min-w-[100px] flex flex-col justify-center border ${stud.isEnrolled ? "bg-green-50 border-green-200" : "bg-orange-50 border-orange-200"}`}>
                          <p className={`text-[8px] font-bold uppercase ${stud.isEnrolled ? "text-green-700" : "text-orange-700"}`}>Status</p>
                          <p className={`text-[10px] font-black ${stud.isEnrolled ? "text-green-600" : "text-orange-600"}`}>
                              {isAppliedThisYear ? (stud.isEnrolled ? "ENROLLED" : (stud.status?.toUpperCase() || "PENDING")) : (stud.isEnrolled ? "COMPLETED" : "NOT ENROLLED")}
                          </p>
                      </div>
                      <div className="bg-white border border-gray-200 py-1.5 px-3 rounded-lg text-center min-w-[100px]">
                        <p className="text-[8px] text-gray-400 font-bold uppercase">Balance</p>
                        <p className={`text-sm font-black leading-none mt-0.5 ${isAppliedThisYear && stud.fees ? "text-red-600" : "text-gray-300"}`}>
                          {isAppliedThisYear && stud.fees ? `₱${remainingBalance.toLocaleString()}` : "---"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {showHistory[stud.studentID] && (
                      <div className="p-4 bg-white dark:bg-neutral-800 border-t dark:border-t-neutral-700 space-y-2 animate-in slide-in-from-top-2 duration-200">
                          <p className="text-[9px] font-bold text-gray-400 uppercase">School Year Records:</p>
                          {history.map(record => (
                              <div key={record.studentID} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-neutral-950 rounded border border-gray-100">
                                  <div className="flex flex-col">
                                      <span className="text-[11px] font-black text-gray-700 uppercase dark:text-neutral-400">SY {record.schoolYear}</span>
                                      <span className="text-[9px] text-gray-500 dark:text-neutral-400">{record.level} - Grade {record.grade}</span>
                                  </div>
                                  <div className="flex gap-2 items-center">
                                      <span className={`text-[9px] font-black px-2 py-1 rounded ${record.isEnrolled ? "bg-green-200 text-green-700" : "bg-orange-200 text-orange-700"}`}>
                                          {record.schoolYear === currentSY ? (record.isEnrolled ? "ACTIVE" : record.status?.toUpperCase()) : (record.isEnrolled ? "COMPLETED" : "NOT ENROLLED")}
                                      </span>
                                  </div>
                              </div>
                          ))}
                      </div>
                  )}

                  {expandedId === stud.studentID && (
                    <div className="p-5 border-t bg-gray-50/50">
                      <h4 className="text-[10px] font-black text-gray-500 uppercase mb-3 tracking-widest">Initial Enrollment Summary</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                            <div className="flex justify-between items-center mb-4">
                                <p className="text-[9px] font-bold text-gray-400 uppercase">Paid Fees Breakdown</p>
                                {totalPaidInitial > 0 && (
                                    <button onClick={() => generateReceipt(stud, totalPaidInitial, "Initial Enrollment Fees")} className="text-[9px] font-black text-[#2D5B60] underline">Download Receipt</button>
                                )}
                            </div>
                            
                            {safePaidInitials.length > 0 ? (
                            <ul className="space-y-2">
                              {safePaidInitials.map(feeKey => (
                                <li key={feeKey} className="flex justify-between text-xs font-bold text-gray-600">
                                  <span className="uppercase">{feeKey === 'misc' ? 'Miscellaneous' : feeKey}</span>
                                  <span>₱{stud.fees?.[feeKey]?.toLocaleString() || 0}</span>
                                </li>
                              ))}
                              
                              {customPaidInitial > 0 && (
                                <li className="flex justify-between text-[11px] font-bold text-green-600 pt-2 border-t border-gray-100">
                                  <span className="uppercase">+ Additional Paid</span>
                                  <span>₱{customPaidInitial.toLocaleString()}</span>
                                </li>
                              )}

                              <li className="flex justify-between text-sm font-black text-[#2D5B60] pt-2 border-t mt-2">
                                <span>TOTAL PAID INITIAL FEES</span>
                                <span>₱{totalPaidInitial.toLocaleString()}</span>
                              </li>
                              
                              {unpaidInitialBalance > 0 && (
                                <>
                                  <li className="flex justify-between text-xs font-bold text-red-500 pt-3 border-t mt-3">
                                    <span>UNPAID INITIAL FEES BALANCE</span>
                                    <span>₱{unpaidInitialBalance.toLocaleString()}</span>
                                  </li>
                                  {(() => {
                                      let remainingCustom = customPaidInitial;
                                      const unpaidKeys = allInitialFeeKeys.filter(k => !safePaidInitials.includes(k));
                                      const adjustedList = [];
                                      
                                      unpaidKeys.forEach(k => {
                                          let amt = Number(stud.fees?.[k] || 0);
                                          if (remainingCustom >= amt) {
                                              remainingCustom -= amt;
                                          } else if (remainingCustom > 0) {
                                              adjustedList.push({ key: k, amount: amt - remainingCustom });
                                              remainingCustom = 0;
                                          } else {
                                              adjustedList.push({ key: k, amount: amt });
                                          }
                                      });

                                      return adjustedList.map(fee => (
                                        <li key={`unpaid-${fee.key}`} className="flex justify-between text-[10px] font-bold text-red-400 pl-2">
                                          <span className="uppercase">- {fee.key === 'misc' ? 'Miscellaneous' : fee.key}</span>
                                          <span>₱{fee.amount.toLocaleString()}</span>
                                        </li>
                                      ));
                                  })()}
                                </>
                              )}
                            </ul>
                            ) : <p className="text-xs text-gray-400 italic">No initial payment breakdown available.</p>}
                        </div>

                        {stud.payment?.method && (
                          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col">
                            <p className="text-[9px] font-bold text-gray-400 uppercase mb-2">Transaction Details</p>
                            <div className="space-y-1 mb-3">
                               <p className="text-xs font-bold text-gray-600 uppercase">Method: <span className="text-[#2D5B60]">{stud.payment.method}</span></p>
                               <p className="text-xs font-bold text-gray-600 uppercase">Status: <span className={stud.payment.status === "Approved" ? "text-green-600" : "text-orange-500"}>{stud.payment.status}</span></p>
                            </div>
                            {stud.payment.proofImage && (
                              <div className="mt-auto">
                                <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">Receipt Attached</p>
                                <a href={stud.payment.proofImage} target="_blank" rel="noreferrer">
                                  <img src={stud.payment.proofImage} alt="Receipt" className="h-20 w-auto rounded border hover:opacity-80 transition-opacity object-cover" />
                                </a>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Monthly Tracker & Contributions */}
                  {stud.isEnrolled && isAppliedThisYear && (
                    <div className="p-5 border-t bg-white">
                      
                      {/* ADD-ON CONTRIBUTIONS ACCORDION SECTION */}
                      {stud.contributions && Object.keys(stud.contributions).length > 0 && (() => {
                          const contribList = Object.entries(stud.contributions);
                          
                          // --- FIX: Check if there are any unpaid ones to determine banner color and default state ---
                          const hasUnpaid = contribList.some(([_, c]) => c.status !== "Paid");
                          const isOpen = expandedContribs[stud.studentID] !== undefined ? expandedContribs[stud.studentID] : hasUnpaid;

                          return (
                            <div className="mb-6 pb-6 border-b border-dashed">
                              <button 
                                 onClick={() => setExpandedContribs(prev => ({...prev, [stud.studentID]: !isOpen}))}
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
                                     const cInCart = cart.student?.studentID === stud.studentID && cart.items.some(i => i.key === cId);
                                     const canCPay = (!isCPaid && !isCPending && !isCRefund);
                                     
                                     const displayAmount = isCBalance ? balanceDue : (isCRefund ? Math.abs(balanceDue) : cData.amount);

                                     return (
                                       <div key={cId} onClick={() => {
                                            if (isCPaid || isCRefund) generateReceipt(stud, amountPaid, cData.title, cData.breakdown);
                                            else if (canCPay) handleToggleCart(stud, cId, displayAmount, "contribution");
                                          }}
                                          className={`p-4 rounded-xl border flex flex-col justify-between cursor-pointer transition-all duration-200 ${
                                            isCPaid ? "bg-green-50 border-green-200 shadow-sm" :
                                            isCPending ? "bg-yellow-50 border-yellow-300 animate-pulse shadow-sm" :
                                            isCRefund ? "bg-teal-50 border-teal-300 shadow-sm" :
                                            isCBalance && !cInCart ? "bg-orange-50 border-orange-300 shadow-sm" :
                                            cInCart ? "bg-red-600 border-red-600 text-white shadow-lg scale-[1.02]" :
                                            "bg-red-50 border-red-200 hover:bg-red-100 shadow-sm"
                                          }`}
                                       >
                                          <div>
                                            <div className="flex justify-between items-start mb-1">
                                              <p className={`text-[10px] font-bold uppercase leading-tight pr-2 ${cInCart ? "text-red-100" : isCPaid ? "text-green-800" : "text-red-800"}`}>{cData.title}</p>
                                              <p className={`text-sm font-black ${cInCart ? "text-white" : isCRefund ? "text-teal-700" : isCBalance ? "text-orange-600" : isCPaid ? "text-green-900" : "text-red-900"}`}>₱{displayAmount}</p>
                                            </div>
                                            
                                            {/* Breakdown */}
                                            {cData.breakdown && cData.breakdown.length > 0 && !isCBalance && !isCRefund && (
                                              <div className={`mt-2 pt-2 border-t space-y-1 ${cInCart ? "border-red-400" : isCPaid ? "border-green-200" : "border-red-200"}`}>
                                                {cData.breakdown.map((item, idx) => (
                                                  <div key={idx} className={`flex justify-between text-[8px] uppercase tracking-wider ${cInCart ? "text-red-100" : "text-gray-500"}`}>
                                                    <span className="truncate pr-2">• {item.name}</span>
                                                    <span className="font-bold">₱{item.amount}</span>
                                                  </div>
                                                ))}
                                              </div>
                                            )}
                                          </div>
                                          
                                          <p className={`text-[8px] text-center font-black uppercase mt-3 pt-2 border-t border-dashed ${cInCart ? "border-red-400" : ""} ${isCPaid ? "text-green-600 underline" : isCPending ? "text-yellow-600" : isCRefund ? "text-teal-600" : isCBalance ? "text-orange-600" : cInCart ? "text-white" : "text-red-600"}`}>
                                            {isCPaid || isCRefund ? "DOWNLOAD RECEIPT" : isCPending ? "VERIFICATION PENDING" : isCBalance && !cInCart ? "BALANCE DUE" : isCRefund ? "REFUND DUE" : cInCart ? "SELECTED FOR PAYMENT" : "PAY NOW"}
                                          </p>
                                       </div>
                                     );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                      })()}

                      {/* STANDARD TUITION GRID */}
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Monthly Tuition & Balances</h4>
                      <div className="grid grid-cols-5 md:grid-cols-10 gap-1">
                        
                        {/* --- CLICKABLE UNPAID INITIAL BALANCE CARD --- */}
                        {(() => {
                           const initFeeTracking = stud.initialFeeTracking || {};
                           const initFeePending = initFeeTracking.status === "Pending Approval";
                           const initFeeInCart = cart.student?.studentID === stud.studentID && cart.items.some(i => i.key === "Initial Fees");

                           if (unpaidInitialBalance > 0) {
                             return (
                               <div 
                                 onClick={() => {
                                   if (!initFeePending) handleToggleCart(stud, "Initial Fees", unpaidInitialBalance, "initial");
                                 }}
                                 className={`text-center py-2 rounded transition-all flex flex-col justify-center cursor-pointer ${
                                   initFeePending ? "bg-yellow-400 border-yellow-500 text-white animate-pulse shadow-sm" :
                                   initFeeInCart ? "bg-[#2D5B60] border-[#2D5B60] text-white shadow-lg scale-105" :
                                   "bg-red-50 border-red-200 text-red-600 shadow-sm hover:bg-red-100 border-dashed"
                                 }`}
                               >
                                 <p className={`text-[7px] font-bold uppercase ${initFeeInCart || initFeePending ? "text-white" : "text-red-400"}`}>Init. Fees</p>
                                 <p className="text-[9px] font-black">₱{unpaidInitialBalance.toLocaleString()}</p>
                                 <p className={`text-[7px] font-bold uppercase mt-0.5 ${initFeeInCart || initFeePending ? "text-white" : "text-red-500"}`}>
                                   {initFeePending ? "PENDING" : initFeeInCart ? "SELECTED" : "PAY NOW"}
                                 </p>
                               </div>
                             );
                           }
                           return null;
                        })()}

                        {schoolMonths.map((month) => {
                          const dbMonthKey = month.substring(0, 3).toUpperCase();
                          const data = paymentRecord[dbMonthKey] || { status: "Unpaid", amount: monthlyRate };
                          const isPaid = data.status === "Paid";
                          const isPending = data.status === "Pending Approval";
                          const canPay = !isPaid && !isPending; 
                          
                          const isInCart = cart.student?.studentID === stud.studentID && cart.items.some(i => i.key === month);

                          return (
                            <div 
                              key={month} 
                              onClick={() => {
                                if (isPaid) generateReceipt(stud, data.amount, `Tuition Fee: ${month}`);
                                else if (canPay) handleToggleCart(stud, month, data.amount, "monthly");
                              }}
                              className={`text-center py-2 rounded transition-all flex flex-col justify-center ${
                                isPaid ? "bg-green-50 border-green-200 text-green-700 cursor-pointer hover:bg-green-100" : 
                                isPending ? "bg-yellow-400 border-yellow-500 text-white animate-pulse" :
                                isInCart ? "bg-[#2D5B60] border-[#2D5B60] text-white shadow-lg scale-105" :
                                canPay ? "bg-orange-50 border-orange-200 text-orange-600 cursor-pointer hover:bg-orange-100 border-dashed" : 
                                "bg-gray-50 border-gray-100 text-gray-300"
                              }`}
                            >
                              <p className={`text-[8px] font-bold uppercase ${isInCart ? "text-white" : ""}`}>{month.substring(0, 3)}</p>
                              <p className={`text-[9px] font-black ${isInCart ? "text-white" : "text-gray-800"}`}>₱{data.amount}</p>
                              <p className={`text-[7px] font-bold uppercase mt-0.5 ${isPaid ? "underline" : ""}`}>
                                {isPaid ? "RECEIPT" : isPending ? "PENDING" : isInCart ? "SELECTED" : "PAY NOW"}
                              </p>
                            </div>
                          );
                        })}
                      </div>

                      {/* --- THE CHECKOUT BAR --- */}
                      {isStudentCartActive && (
                        <div className="mt-6 p-4 bg-[#2D5B60]/5 border border-[#2D5B60]/20 rounded-xl flex flex-col md:flex-row justify-between items-center gap-4 animate-in fade-in slide-in-from-bottom-2">
                          <div>
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Selected for Payment ({cart.type})</p>
                            <p className="text-sm font-black text-[#2D5B60] uppercase">{cart.items.map(i => {
                              if (cart.type === "contribution") return stud.contributions?.[i.key]?.title || i.key;
                              return i.key;
                            }).join(", ")}</p>
                          </div>
                          <div className="flex items-center gap-4 w-full md:w-auto">
                            <div className="text-right hidden md:block">
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Total Amount</p>
                                <p className="text-xl font-black text-gray-800">₱{cart.items.reduce((sum, i) => sum + i.amount, 0).toLocaleString()}</p>
                            </div>
                            <button onClick={() => setShowPayModal(true)} className="bg-[#2D5B60] w-full md:w-auto text-white px-8 py-3 rounded-xl font-black uppercase text-xs hover:bg-black transition-colors shadow-lg">
                              Proceed to Pay ₱{cart.items.reduce((sum, i) => sum + i.amount, 0).toLocaleString()}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-20 bg-gray-50 rounded-xl border-2 border-dashed">
               <p className="text-gray-400 italic">No enrollment records found.</p>
            </div>
          )}
        </div>

        {/* MULTI-MONTH PAYMENT MODAL */}
        {showPayModal && cart.items.length > 0 && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[999] p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200">
              <div className="bg-[#2D5B60] p-4 text-white font-bold flex justify-between items-center">
                <span className="uppercase tracking-widest text-xs">Payment Submission</span>
                <button onClick={() => setShowPayModal(false)} className="text-2xl leading-none hover:text-gray-300">&times;</button>
              </div>
              <div className="p-6 space-y-5">
                
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-2">Items Included:</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {cart.items.map(i => (
                        <span key={i.key} className="bg-white border border-gray-200 text-gray-600 px-3 py-1 rounded-lg text-xs font-bold shadow-sm">
                          {cart.type === "contribution" ? cart.student.contributions?.[i.key]?.title : i.key}
                        </span>
                    ))}
                  </div>
                  <div className="flex justify-between items-end border-t pt-3">
                    <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Total Amount Due</p>
                    <h3 className="text-3xl font-black text-[#2D5B60] leading-none">₱{cart.items.reduce((sum, i) => sum + i.amount, 0).toLocaleString()}</h3>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button onClick={() => setPayMethod("GCash")} className={`flex-1 py-3 rounded-xl border-2 font-bold transition-all ${payMethod === "GCash" ? "border-blue-500 bg-blue-50 text-blue-600 shadow-sm" : "border-gray-100 text-gray-400 hover:bg-gray-50"}`}>GCash</button>
                  <button onClick={() => setPayMethod("Cash")} className={`flex-1 py-3 rounded-xl border-2 font-bold transition-all ${payMethod === "Cash" ? "border-green-500 bg-green-50 text-green-600 shadow-sm" : "border-gray-100 text-gray-400 hover:bg-gray-50"}`}>Cash</button>
                </div>
                
                {payMethod === "GCash" && (
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 space-y-2 animate-in slide-in-from-top-2">
                    <p className="text-[10px] font-bold text-blue-800 uppercase tracking-widest">Upload Receipt</p>
                    <input type="file" ref={fileInputRef} accept="image/*" className="text-xs w-full bg-white p-2 rounded-lg border border-blue-200" />
                  </div>
                )}

                <button disabled={isUploading || !payMethod} onClick={handleConfirmPayment} className="w-full bg-[#2D5B60] text-white py-4 rounded-xl font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg disabled:bg-gray-300 disabled:shadow-none">
                  {isUploading ? "Uploading..." : "Submit Payment"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnrollmentArchive;