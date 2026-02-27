import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, doc, updateDoc, query, orderBy, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';

const Students = () => {
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // --- 1. REAL-TIME DATA FETCHING (Students List) ---
  useEffect(() => {
    const q = query(collection(db, "students"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStudents(data);
    });
    return () => unsubscribe();
  }, []);

  // --- 2. APPROVE ENROLLMENT (Updates 2 Collections) ---
  const handleApprove = async (id, studentID) => {
    if(window.confirm("Approve this enrollment and payment?")) {
      try {
        // Update status sa students
        await updateDoc(doc(db, "students", id), { isEnrolled: true });
        
        // Update status sa enrollments (kung may record)
        const enrRef = doc(db, "enrollments", `ENR-${studentID}`);
        const enrSnap = await getDoc(enrRef);
        if(enrSnap.exists()) {
          await updateDoc(enrRef, { "payment.status": "Approved" });
        }
        
        alert("Student Enrolled Successfully!");
      } catch (error) { 
        console.error("Approval Error:", error); 
        alert("Error: " + error.message);
      }
    }
  };

  // --- 3. DELETE STUDENT ---
  const handleDelete = async (id) => {
    if(window.confirm("Are you sure you want to delete this record?")) {
      try {
        await deleteDoc(doc(db, "students", id));
      } catch (error) { console.error("Delete Error:", error); }
    }
  };

  // --- 4. SHOW DETAILS LOGIC (Fills the N/A fields) ---
  const handleViewDetails = async (student) => {
    setLoadingDetails(true);
    setSelectedStudent(student);
    setShowModal(true);

    try {
      // Kunin ang data mula sa enrollments gamit ang studentID
      const enrRef = doc(db, "enrollments", `ENR-${student.studentID}`);
      const enrSnap = await getDoc(enrRef);

      if (enrSnap.exists()) {
        // Pagsamahin ang student data + enrollment data
        setSelectedStudent(prev => ({
          ...prev,
          paymentInfo: enrSnap.data()
        }));
      }
    } catch (error) {
      console.error("Error fetching enrollment details:", error);
    } finally {
      setLoadingDetails(false);
    }
  };

  // --- 5. SEARCH FILTER ---
  const filteredStudents = students.filter(st => 
    st.lastname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    st.firstname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    st.studentID?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className='bg-white p-6 shadow-sm rounded-lg min-h-screen'>
      {/* HEADER & SEARCH BAR */}
      <div className='flex flex-col md:flex-row justify-between items-center mb-6 gap-4'>
        <div>
          <h2 className="text-2xl font-bold text-[#2D5B60]">Student Management</h2>
          <p className='text-sm text-gray-500 uppercase tracking-widest'>S.Y. 2025-2026 List</p>
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
      <div className='overflow-x-auto'>
        <table className='w-full text-left border-collapse'>
          <thead className='bg-gray-100 text-neutral-600 text-[11px] uppercase font-bold'>
            <tr>
              <th className='px-4 py-4 border-b'>Student Information</th>
              <th className='px-4 py-4 border-b'>Level / Grade</th>
              <th className='px-4 py-4 border-b'>Documents</th>
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
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${st.isEnrolled ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                    {st.isEnrolled ? 'Enrolled' : 'Pending'}
                  </span>
                </td>
                <td className='px-4 py-4 text-center'>
                  <div className='flex justify-center gap-2'>
                    {!st.isEnrolled && (
                      <button onClick={() => handleApprove(st.id, st.studentID)} className='bg-[#2D5B60] text-white px-3 py-1 rounded text-[11px] font-bold hover:bg-black'>Approve</button>
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
              <h2 className="text-lg font-bold uppercase tracking-wider">Student Profile Detail</h2>
              <button onClick={() => setShowModal(false)} className="text-2xl font-bold">&times;</button>
            </div>
            
            <div className="p-8">
              {loadingDetails ? <p className='text-center animate-pulse'>Fetching payment records...</p> : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                  
                  {/* Child Info */}
                  <section className='bg-gray-50 p-4 rounded-lg border'>
                    <h3 className="text-[#2D5B60] font-black uppercase text-xs mb-3 border-b pb-2">1. Child Information</h3>
                    <div className='space-y-1'>
                      <p><span className='text-gray-500'>Full Name:</span> <span className='font-bold uppercase'>{selectedStudent.firstname} {selectedStudent.middlename} {selectedStudent.lastname}</span></p>
                      <p><span className='text-gray-500'>Age / Sex:</span> <span className='font-bold'>{selectedStudent.age} / {selectedStudent.sex}</span></p>
                      <p><span className='text-gray-500'>Level:</span> <span className='font-bold'>{selectedStudent.level} - Grade {selectedStudent.grade}</span></p>
                    </div>
                  </section>

                  {/* Payment Verification (FIXED N/A) */}
                  <section className='bg-yellow-50 p-4 rounded-lg border border-yellow-200'>
                    <h3 className="text-yellow-700 font-black uppercase text-xs mb-3 border-b border-yellow-200 pb-2">2. Payment Verification</h3>
                    <div className='space-y-2'>
                      <p><span className='text-gray-500'>Method:</span> <span className='font-bold text-yellow-800 uppercase'>{selectedStudent.paymentInfo?.payment?.method || "Not Set"}</span></p>
                      <p><span className='text-gray-500'>Status:</span> <span className='font-bold text-orange-600 uppercase'>{selectedStudent.paymentInfo?.payment?.status || "Pending"}</span></p>
                      {selectedStudent.paymentInfo?.payment?.proofImage && (
                        <div>
                          <p className='text-[10px] font-bold text-gray-500'>RECEIPT IMAGE:</p>
                          <a href={selectedStudent.paymentInfo.payment.proofImage} target="_blank" rel="noreferrer">
                            <img src={selectedStudent.paymentInfo.payment.proofImage} className='w-full h-32 object-contain border bg-white rounded mt-1' alt="Receipt" />
                          </a>
                        </div>
                      )}
                    </div>
                  </section>

                  {/* Father & Mother Info */}
                  <section className='bg-blue-50/30 p-4 rounded-lg border border-blue-100'>
                    <h3 className="text-blue-700 font-black uppercase text-xs mb-3 border-b border-blue-200 pb-2">3. Father Information</h3>
                    <p>Name: <span className='font-bold'>{selectedStudent.father?.firstname} {selectedStudent.father?.lastname}</span></p>
                    <p>Contact: <span className='font-bold'>{selectedStudent.father?.contact || "N/A"}</span></p>
                  </section>

                  <section className='bg-pink-50/30 p-4 rounded-lg border border-pink-100'>
                    <h3 className="text-pink-700 font-black uppercase text-xs mb-3 border-b border-pink-200 pb-2">4. Mother Information</h3>
                    <p>Name: <span className='font-bold'>{selectedStudent.mother?.firstname} {selectedStudent.mother?.lastname}</span></p>
                    <p>Contact: <span className='font-bold'>{selectedStudent.mother?.contact || "N/A"}</span></p>
                  </section>

                  {/* Address */}
                  <section className='bg-gray-50 p-4 rounded-lg border col-span-1 md:col-span-2'>
                    <h3 className="text-[#2D5B60] font-black uppercase text-xs mb-3 border-b pb-2">5. Address</h3>
                    <p className='italic'>{selectedStudent.address?.purok}, {selectedStudent.address?.barangay}, {selectedStudent.address?.city}, {selectedStudent.address?.province}</p>
                  </section>
                </div>
              )}

              <div className="mt-8 pt-4 border-t flex justify-end gap-3">
                <button onClick={() => window.print()} className="bg-gray-800 text-white px-6 py-2 rounded-lg font-bold text-xs">PRINT FORM</button>
                <button onClick={() => setShowModal(false)} className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-bold text-xs">CLOSE</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Students;