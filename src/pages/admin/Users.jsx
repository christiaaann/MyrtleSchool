import React, { useEffect, useState } from "react";
import { collection, doc, deleteDoc, onSnapshot, updateDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "../../services/firebase";
import defaultPic from "../../assets/default.png";
import UsersSkeleton from "../../components/Skeleton/UsersSkeleton";
const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedPicture, setSelectedPicture] = useState(null);
  const [studentStats, setStudentStats] = useState({ enrolled: 0, pending: 0 });
  

  function getLastSeen(ts) {
    if (!ts) return "Offline";
    const now = Date.now();
    const last = ts.toDate().getTime();
    const diff = Math.floor((now - last) / 1000);
    if (diff < 60) return "Active Now";
    if (diff < 3600) return Math.floor(diff / 60) + "m ago";
    if (diff < 86400) return Math.floor(diff / 3600) + "h ago";
    return Math.floor(diff / 86400) + "d ago";
  }

  // fetch users
  useEffect(() => {
    const getCounts = async () => {
      if (selectedUser?.id) {
        try {
          const q = query(collection(db, "students"), where("parentUID", "==", selectedUser.id));
          const snapshot = await getDocs(q);
          const students = snapshot.docs.map(doc => doc.data());
          setStudentStats({
            enrolled: students.filter(s => s.status === "Enrolled").length,
            pending: students.filter(s => s.status === "Pending").length
          });
        } catch (err) {
          console.error("Error counts:", err);
          setStudentStats({ enrolled: 0, pending: 0 });
        }
      }
    };
    getCounts();
  }, [selectedUser?.id]); 

  //  FETCH USERS
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "users"), (snapshot) => {
      const list = snapshot.docs
        .map((docu) => {
          const data = docu.data();
          return {
            id: docu.id,
            fullname: `${data.parent?.firstname || ""} ${data.parent?.middlename || ""} ${data.parent?.lastname || ""}`.trim() || data.fullname || data.name || "No Name",
            email: data.email,
            contact: data.parent?.contact || "",
            role: data.role,
            profilePicture: data.profilePicture || data.photoURL || defaultPic,
            parent: data.parent || null,
            spouse: data.spouse || null,
            address: data.address || null,
            lastActive: data.lastActive || null,
          };
        })
        .filter((u) => (u.role || "").toLowerCase() !== "admin");

      setUsers(list);

      //selected user
      setSelectedUser((currentSelected) => {
        if (!currentSelected && list.length > 0) return list[0]; 
        if (currentSelected) {
        
          const updatedData = list.find((u) => u.id === currentSelected.id);
          return updatedData || list[0];
        }
        return null;
      });

       setTimeout(() => {
    setLoading(false);
  }, 1000);
    });
    return () => unsub();
  }, []); 

  //  HEARTBEAT ---
  useEffect(() => {
    const interval = setInterval(async () => {
      if (auth.currentUser) {
        await updateDoc(doc(db, "users", auth.currentUser.uid), {
          lastActive: serverTimestamp(),
        });
      }
    }, 15000); 
    return () => clearInterval(interval);
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this user? This action cannot be undone.")) return;
    try {
      await deleteDoc(doc(db, "users", id));
     
    } catch (err) { console.error("Delete error:", err); }
  };

 if (loading) return <UsersSkeleton/>;

  return (
    <div className="flex h-[90vh] bg-[#F8F9FA] overflow-hidden rounded-2xl shadow-lg border">
      
      {/* LEFT SIDEBAR */}
      <div className="w-1/3 border-r bg-white flex flex-col">
        <div className="p-5 border-b bg-gray-50/50">
          <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[2px]">Parents</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {users.map((user) => {
            const isOnline = user.lastActive?.toDate && Date.now() - user.lastActive.toDate().getTime() < 60000;
            return (
              <div 
                key={user.id} 
                onClick={() => setSelectedUser(user)}
                className={`flex items-center gap-3 p-4 cursor-pointer border-b border-gray-50 transition-all ${
                  selectedUser?.id === user.id ? "bg-[#F0F7F7] border-l-4 border-[#2D5B60]" : "hover:bg-gray-50"
                }`}
              >
                <div className="relative flex-shrink-0">
                  <img src={user.profilePicture} className="w-12 h-12 rounded-full object-cover shadow-sm border border-gray-100"
                   alt="User Profile"
                   referrerPolicy="no-referrer" 
                   crossOrigin="anonymous"
                   />
                  <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${isOnline ? "bg-green-500" : "bg-red-500"}`}></span>
                </div>
                <div className="flex flex-col min-w-0">
                  <p className="font-bold text-sm text-gray-800 truncate">{user.fullname}</p>
                  <p className="text-[11px] text-gray-400 truncate">{user.email}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT SIDE: DETAILS */}
      <div className="flex-1 bg-[#F9FBFC] p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-black text-gray-800">Profile Information</h1>
           
          </div>

          {selectedUser ? (
            <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 p-10 relative overflow-hidden">
              {/* Header */}
              <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-10">
                <div className="flex gap-6 items-center">
                  <div className="relative">
                    <img src={selectedUser.profilePicture} className="w-24 h-24 rounded-[28px] object-cover shadow-md cursor-pointer hover:scale-105 transition-transform border-4 border-white" onClick={() => setSelectedPicture(selectedUser.profilePicture)} alt="" />
                    <span className={`absolute -top-2 -right-2 w-6 h-6 rounded-full border-4 border-white flex items-center justify-center ${getLastSeen(selectedUser.lastActive) === "Active Now" ? "bg-green-500" : "bg-red-500"}`}>
                        <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                    </span>
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-gray-800 leading-none mb-1">{selectedUser.fullname}</h2>
                    <p className="text-gray-400 font-medium text-sm">{selectedUser.email}</p>
                    <div className="flex gap-2 mt-4">
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border border-green-200">{studentStats.enrolled} Enrolled</span>
                      {studentStats.pending > 0 && <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border border-orange-200 animate-pulse">{studentStats.pending} For Approval</span>}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                   <div className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-black mb-2 uppercase border shadow-sm ${getLastSeen(selectedUser.lastActive) === "Active Now" ? "bg-green-50 text-green-700 border-green-100" : "bg-gray-50 text-gray-500 border-gray-100"}`}>
                        {getLastSeen(selectedUser.lastActive) === "Active Now" && <span className="w-2 h-2 bg-green-500 rounded-full animate-ping"></span>}
                        {getLastSeen(selectedUser.lastActive)}
                   </div>
                   <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">User Status</p>
                </div>
              </div>

              {/* Data Grid */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 bg-gray-50/80 p-6 rounded-[24px] mb-10 border border-gray-100">
                <div><p className="text-[9px] text-gray-400 font-black uppercase mb-1">Occupation</p><p className="text-xs font-bold text-gray-700 truncate">{selectedUser.parent?.occupation || "N/A"}</p></div>
                <div><p className="text-[9px] text-gray-400 font-black uppercase mb-1">Total Children</p><p className="text-sm font-black text-gray-800">{studentStats.enrolled + studentStats.pending}</p></div>
                <div><p className="text-[9px] text-gray-400 font-black uppercase mb-1">City</p><p className="text-xs font-bold text-gray-700 truncate">{selectedUser.address?.city || "N/A"}</p></div>
                <div><p className="text-[9px] text-gray-400 font-black uppercase mb-1">Contact</p><p className="text-xs font-bold text-gray-700 truncate">{selectedUser.contact || "N/A"}</p></div>
                <div><p className="text-[9px] text-gray-400 font-black uppercase mb-1">Account</p><p className="text-xs font-black text-[#2D5B60] uppercase tracking-tighter">Verified</p></div>
              </div>

              {/* Family & Address */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 border-t pt-10">
                <div>
                  <h3 className="text-xs font-black text-gray-300 uppercase mb-5 tracking-[2px]">Family Relations</h3>
                  <div className="space-y-4">
                    <div className="bg-white border p-4 rounded-2xl shadow-sm">
                        <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Father / Spouse</p>
                        <p className="text-sm font-black text-gray-700">{selectedUser.spouse?.firstname} {selectedUser.spouse?.lastname || "None Recorded"}</p>
                    </div>
                    <div className="bg-white border p-4 rounded-2xl shadow-sm">
                        <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Mother / Parent</p>
                        <p className="text-sm font-black text-gray-700">{selectedUser.parent?.firstname} {selectedUser.parent?.lastname}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-xs font-black text-gray-300 uppercase mb-5 tracking-[2px]">Primary Address</h3>
                  <div className="bg-[#F8F9FB] p-6 rounded-[24px] border border-dashed border-gray-200">
                    <p className="text-sm text-gray-600 leading-relaxed font-medium">
                      {selectedUser.address ? `${selectedUser.address.purok || ""}, ${selectedUser.address.barangay}, ${selectedUser.address.city}, ${selectedUser.address.province}` : "No detailed address provided."}
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="mt-12 pt-8 border-t flex justify-between items-center">
                 <div className="flex gap-4">
                    <button className="bg-black text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase shadow-lg shadow-black/20 hover:scale-105 transition-all">Open Chat</button>
                    <button className="border border-gray-200 px-6 py-2.5 rounded-xl text-xs font-black uppercase hover:bg-gray-50 transition-all">Enrollment Files</button>
                 </div>
                 <button onClick={() => handleDelete(selectedUser.id)} className="text-red-500 font-black text-[10px] uppercase tracking-widest hover:underline">Delete Member</button>
              </div>

            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-300 gap-4 mt-20">
               <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center italic text-4xl">👤</div>
               <p className="font-bold uppercase tracking-widest text-[10px]">Select a parent to view profile</p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL */}
      {selectedPicture && (
        <div className="fixed inset-0 backdrop-blur-md bg-black/60 flex justify-center items-center z-50 p-6" onClick={() => setSelectedPicture(null)}>
          <img src={selectedPicture} alt="" className="max-w-full max-h-full rounded-[32px] shadow-2xl border-4 border-white object-contain" />
        </div>
      )}
    </div>
  );
};

export default Users;