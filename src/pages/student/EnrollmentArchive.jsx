import React, { useState, useEffect, useRef } from "react"; 
import { doc, onSnapshot, updateDoc } from "firebase/firestore"; 
import { db } from "../../services/firebase"; 

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

  // --- MGA STATE PARA SA CLOUDINARY AT MODAL ---
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedPay, setSelectedPay] = useState(null);
  const [payMethod, setPayMethod] = useState(""); 
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const schoolMonths = [
    "June", "July", "August", "September", "October", 
    "November", "December", "January", "February", "March"
  ];

  useEffect(() => {
    setStudents(propsStudents);
  }, [propsStudents]);

  useEffect(() => {
    if (!students?.length) return;
    const unsubscribes = [];
    students.forEach((stud) => {
      const enrRef = doc(db, "enrollments", `ENR-${stud.studentID}`);
      const unsub = onSnapshot(enrRef, (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setStudents(prev => prev.map(s => 
            s.studentID === stud.studentID ? { ...s, ...data } : s
          ));
        }
      });
      unsubscribes.push(unsub);
    });
    return () => unsubscribes.forEach(u => u());
  }, [students]);

  // --- IBINALIK NA EDIT LOGIC MULA SA LUMA MONG CODE ---
  const handleEditRejected = (stud) => {
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
    // Reset files para mapilitan mag-upload ulit kung rejected
    setFiles({ birthCert: null, reportCard: null, idPicture: null });
    setPaymentMethod(stud.paymentMethod || ""); 
    setEditingStudent(stud); 
    setPage("personal"); // Balik sa first step ng form
  };

  const handlePaymentClick = (student, month, amount) => {
    setSelectedPay({ student, month, amount });
    setPayMethod("");
    setShowPayModal(true);
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
          method: "POST",
          body: formData,
        });
        const cloudData = await res.json();
        receiptUrl = cloudData.secure_url;
      }

      const shortMonth = selectedPay.month.substring(0, 3).toUpperCase();
      const enrRef = doc(db, "enrollments", `ENR-${selectedPay.student.studentID}`);
      await updateDoc(enrRef, {
        [`monthlyTracking.${shortMonth}.status`]: "Pending Approval",
        [`monthlyTracking.${shortMonth}.paymentMethod`]: payMethod,
        [`monthlyTracking.${shortMonth}.receiptImage`]: receiptUrl,
        [`monthlyTracking.${shortMonth}.dateSubmitted`]: new Date().toISOString()
      });

      alert("Payment submitted! Please wait for admin approval.");
      setShowPayModal(false);
    } catch (error) {
      console.error(error);
      alert("Something went wrong.");
    } finally {
      setIsUploading(false);
    }
  };

  if (setpage !== "archive") return null;

  return (
    <div className="bg-white p-6 border-t-8 border-[#2D5B60] rounded shadow max-w-5xl mx-auto relative">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-[#2D5B60]">ENROLLMENT ARCHIVE</h2>
        <button onClick={handleAddNewChild} className="bg-green-600 text-white px-5 py-2 rounded text-sm font-bold hover:bg-black transition-all">
          + Add New Child
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {students && students.length > 0 ? (
          students.map((stud) => {
            const paymentRecord = stud.monthlyTracking ?? {};
            const monthlyRate = Number(stud.fees?.monthlyRate ?? 1100);
            const totalPaid = Object.values(paymentRecord)
              .filter(i => i?.status === "Paid")
              .reduce((acc, i) => acc + Number(i?.amount || 0), 0);
            const totalTuition = monthlyRate * 10;
            const remainingBalance = totalTuition - totalPaid;

            return (
              <div key={stud.studentID} className="border rounded-xl bg-white shadow-sm overflow-hidden border-gray-200">
                <div className="p-5 flex flex-col md:flex-row justify-between items-center gap-4 bg-gray-50/50">
                  <div className="flex gap-4 items-center w-full">
                    <img className="w-16 h-16 object-cover rounded-full border-2 border-white shadow-md" src={stud.requirements?.idPicture} alt="Student" />
                    <div>
                      <h3 className="font-black text-lg uppercase text-gray-800 leading-tight">{stud.firstname} {stud.middlename} {stud.lastname}</h3>  
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-tighter">ID: {stud.studentID} • {stud.level} - Grade {stud.grade}</p>
                      
                      <div className="flex gap-3 mt-1">
                        <button onClick={() => setExpandedId(expandedId === stud.studentID ? null : stud.studentID)} className="text-[#2D5B60] text-[10px] font-bold underline uppercase">
                          {expandedId === stud.studentID ? "Hide Info" : "View Info"}
                        </button>
                        
                        {/* --- ETO YUNG LUMANG LOGIC MO NA IBINALIK KO --- */}
                        {stud.status === "Rejected" && (
                          <button 
                            onClick={() => handleEditRejected(stud)} 
                            className="text-orange-600 text-[10px] font-bold underline uppercase"
                          >
                            Edit Rejected Form
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 w-full md:w-auto justify-end">
                    <div className={`px-3 py-2 rounded-lg text-center min-w-[100px] flex flex-col justify-center ${stud.isEnrolled ? "bg-green-100" : "bg-orange-100"}`}>
                        <p className={`text-[8px] font-bold uppercase ${stud.isEnrolled ? "text-green-700" : "text-orange-700"}`}>Status</p>
                        <p className={`text-[10px] font-black ${stud.isEnrolled ? "text-green-600" : "text-orange-600"}`}>
                            {stud.isEnrolled ? "ENROLLED" : stud.status?.toUpperCase()}
                        </p>
                    </div>
                    <div className="bg-white border border-gray-200 p-2 rounded-lg text-center min-w-[100px]">
                      <p className="text-[8px] text-gray-400 font-bold uppercase">Balance</p>
                      <p className="text-sm font-black text-red-600">₱{remainingBalance.toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                {/* MONTHLY TRACKER */}
                <div className="p-5 border-t">
                  <div className="grid grid-cols-5 md:grid-cols-10 gap-1">
                    {schoolMonths.map((month) => {
                      const dbMonthKey = Object.keys(paymentRecord).find(key => 
                        key.toUpperCase() === month.toUpperCase() || key.toUpperCase() === month.substring(0, 3).toUpperCase()
                      );
                      const data = paymentRecord[dbMonthKey] || { status: "Unpaid", amount: monthlyRate };
                      const isPaid = data.status === "Paid";
                      const isOpen = data.status === "Open";
                      const isPending = data.status === "Pending Approval";

                      return (
                        <div 
                          key={month} 
                          onClick={() => isOpen && handlePaymentClick(stud, month, data.amount)}
                          className={`text-center py-2 rounded border transition-all ${
                            isPaid ? "bg-green-500 border-green-600 text-white" : 
                            isPending ? "bg-yellow-400 border-yellow-500 text-white" :
                            isOpen ? "bg-orange-50 border-orange-400 text-orange-600 cursor-pointer animate-pulse" : 
                            "bg-gray-50 border-gray-100 text-gray-300"
                          }`}
                        >
                          <p className="text-[8px] font-bold uppercase">{month.substring(0, 3)}</p>
                          <p className="text-[9px] font-black">₱{data.amount}</p>
                          <p className="text-[7px] font-bold uppercase">
                            {isPaid ? "PAID" : isPending ? "PENDING" : isOpen ? "PAY NOW" : "LOCKED"}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-20 bg-gray-50 rounded-xl border-2 border-dashed">
             <p className="text-gray-400 italic">No enrollment records found.</p>
          </div>
        )}
      </div>

      {/* --- PAYMENT MODAL --- */}
      {showPayModal && selectedPay && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[999] p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200">
            <div className="bg-[#2D5B60] p-4 text-white font-bold flex justify-between items-center">
              <span>PAYMENT: {selectedPay.month.toUpperCase()}</span>
              <button onClick={() => setShowPayModal(false)} className="text-2xl">&times;</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="text-center">
                <p className="text-gray-400 text-xs font-bold uppercase">Amount</p>
                <h3 className="text-3xl font-black text-[#2D5B60]">₱{selectedPay.amount}</h3>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setPayMethod("GCash")} className={`flex-1 py-3 rounded-xl border-2 font-bold transition-all ${payMethod === "GCash" ? "border-blue-500 bg-blue-50 text-blue-600" : "border-gray-100 text-gray-400"}`}>GCash</button>
                <button onClick={() => setPayMethod("Cash")} className={`flex-1 py-3 rounded-xl border-2 font-bold transition-all ${payMethod === "Cash" ? "border-green-500 bg-green-50 text-green-600" : "border-gray-100 text-gray-400"}`}>Cash</button>
              </div>
              {payMethod === "GCash" && (
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 space-y-2">
                  <input type="file" ref={fileInputRef} accept="image/*" className="text-xs w-full" />
                </div>
              )}
              <button disabled={isUploading || !payMethod} onClick={handleConfirmPayment} className="w-full bg-[#2D5B60] text-white py-4 rounded-xl font-bold uppercase hover:bg-black transition-all disabled:bg-gray-300">
                {isUploading ? "Uploading..." : "Submit Payment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnrollmentArchive;