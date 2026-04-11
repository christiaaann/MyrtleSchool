import React, { useEffect, useState } from "react";
import { collection, doc, deleteDoc, onSnapshot, updateDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "../../services/firebase";
import defaultPic from "../../assets/default.png";
import UsersSkeleton from "../../components/Skeleton/UsersSkeleton";
import { useOutletContext } from "react-router-dom";
import { Filter, MessageSquare, Mail, Trash2 } from "lucide-react";

const Users = () => {
  const { userData } = useOutletContext();
  const isSuperAdmin = userData?.role === "superadmin";
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedPicture, setSelectedPicture] = useState(null);
  const [studentStats, setStudentStats] = useState({ enrolled: 0, pending: 0 });
  
  const [branchFilter, setBranchFilter] = useState(isSuperAdmin ? "All" : userData?.branch);

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

  useEffect(() => {
    const getCounts = async () => {
      if (selectedUser?.id) {
        try {
          const q = query(collection(db, "students"), where("parentUID", "==", selectedUser.id));
          const snapshot = await getDocs(q);
          const students = snapshot.docs.map(doc => doc.data());
          setStudentStats({
            enrolled: students.filter(s => s.status === "Enrolled").length,
            pending: students.filter(s => s.status === "Waiting for Payment" || s.status === "Submitted for Verification").length
          });
        } catch (err) {
          console.error("Error counts:", err);
          setStudentStats({ enrolled: 0, pending: 0 });
        }
      }
    };
    getCounts();
  }, [selectedUser?.id]); 

  // FETCH USERS
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
            branch: data.branch || "", 
            profilePicture: data.profilePicture || data.photoURL || defaultPic,
            parent: data.parent || null,
            spouse: data.spouse || null,
            address: data.address || null,
            lastActive: data.lastActive || null,
          };
        })
        .filter((u) => !["admin", "superadmin", "registrar"].includes((u.role || "").toLowerCase()));

      setUsers(list);

      setSelectedUser((currentSelected) => {
        if (!currentSelected && list.length > 0) return list[0]; 
        if (currentSelected) {
          const updatedData = list.find((u) => u.id === currentSelected.id);
          return updatedData || list[0];
        }
        return null;
      });

      setTimeout(() => setLoading(false), 1000);
    });
    return () => unsub();
  }, []); 

  useEffect(() => {
    const interval = setInterval(async () => {
      if (auth.currentUser) {
        await updateDoc(doc(db, "users", auth.currentUser.uid), { lastActive: serverTimestamp() });
      }
    }, 15000); 
    return () => clearInterval(interval);
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("WARNING: Delete this parent account permanently? This action cannot be undone.")) return;
    try { 
      await deleteDoc(doc(db, "users", id)); 
      setSelectedUser(null); // Clear view
    } catch (err) { 
      alert("Failed to delete user.");
    }
  };

  const handleOpenChat = () => {
    alert("In-App Chat Module is coming soon! For now, you can email the parent directly.");
  };

  if (loading) return <UsersSkeleton/>;

  const filteredUsers = users.filter(u => branchFilter === "All" ? true : u.branch === branchFilter);

  return (
    <div className="flex h-[90vh] bg-[#F8F9FA] overflow-hidden rounded-2xl shadow-lg border">
      
      {/* LEFT SIDEBAR */}
      <div className="w-1/3 border-r bg-white flex flex-col">
        <div className="p-5 border-b bg-gray-50/50 flex justify-between items-center">
          <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[2px]">Parents</h2>
          
          {isSuperAdmin && (
            <div className="relative">
              <Filter className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" size={12}/>
              <select 
                value={branchFilter} 
                onChange={(e) => setBranchFilter(e.target.value)}
                className="pl-6 pr-2 py-1 bg-white border border-gray-200 rounded-lg text-[10px] font-bold text-[#2D5B60] outline-none cursor-pointer"
              >
                <option value="All">All Branches</option>
                <option value="Irosin">Irosin Only</option>
                <option value="Matnog">Matnog Only</option>
              </select>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredUsers.length === 0 ? (
             <p className="text-center text-xs text-gray-400 p-6 italic">No parents found for this branch.</p>
          ) : (
            filteredUsers.map((user) => {
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
                    <img 
                      src={user.profilePicture || defaultPic} 
                      onError={(e) => { e.target.src = defaultPic; }} // FALLBACK FOR BROKEN IMAGES
                      referrerPolicy="no-referrer" 
                      crossOrigin="anonymous" 
                      className="w-12 h-12 rounded-full object-cover shadow-sm border border-gray-100" 
                      alt=""
                    />
                    <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${isOnline ? "bg-green-500" : "bg-red-500"}`}></span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <p className="font-bold text-sm text-gray-800 truncate">{user.fullname}</p>
                    <p className="text-[10px] text-indigo-600 font-bold uppercase">{user.branch || "Unassigned"} Branch</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT SIDE: DETAILS */}
      <div className="flex-1 bg-[#F9FBFC] p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          {selectedUser ? (
            <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 p-10 relative overflow-hidden flex flex-col min-h-[75vh]">
              
              <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-10">
                <div className="flex gap-6 items-center">
                  <div className="relative">
                    <img 
                      src={selectedUser.profilePicture || defaultPic} 
                      onError={(e) => { e.target.src = defaultPic; }} // FALLBACK
                      referrerPolicy="no-referrer" 
                      crossOrigin="anonymous" 
                      className="w-24 h-24 rounded-[28px] object-cover shadow-md cursor-pointer hover:scale-105 transition-transform border-4 border-white" 
                      onClick={() => setSelectedPicture(selectedUser.profilePicture || defaultPic)} 
                      alt="" 
                    />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-gray-800 leading-none mb-1">{selectedUser.fullname}</h2>
                    <p className="text-gray-400 font-medium text-sm mb-2">{selectedUser.email}</p>
                    <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border border-indigo-200">{selectedUser.branch || "Unassigned"} Branch</span>
                  </div>
                </div>
              </div>

              {/* Data Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50/80 p-6 rounded-[24px] mb-10 border border-gray-100">
                <div><p className="text-[9px] text-gray-400 font-black uppercase mb-1">Occupation</p><p className="text-xs font-bold text-gray-700 truncate">{selectedUser.parent?.occupation || "N/A"}</p></div>
                <div><p className="text-[9px] text-gray-400 font-black uppercase mb-1">Children</p><p className="text-sm font-black text-gray-800">{studentStats.enrolled + studentStats.pending}</p></div>
                <div><p className="text-[9px] text-gray-400 font-black uppercase mb-1">City</p><p className="text-xs font-bold text-gray-700 truncate">{selectedUser.address?.city || "N/A"}</p></div>
                <div><p className="text-[9px] text-gray-400 font-black uppercase mb-1">Contact</p><p className="text-xs font-bold text-gray-700 truncate">{selectedUser.contact || "N/A"}</p></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 border-t pt-10">
                <div>
                  <h3 className="text-xs font-black text-gray-300 uppercase mb-5 tracking-[2px]">Family Relations</h3>
                  <div className="space-y-4">
                    <div className="bg-white border p-4 rounded-2xl shadow-sm">
                        <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Spouse</p>
                        <p className="text-sm font-black text-gray-700">{selectedUser.spouse?.firstname} {selectedUser.spouse?.lastname || "None Recorded"}</p>
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

              {/* --- ACTION BUTTONS (CHAT, EMAIL, DELETE) --- */}
              <div className="mt-auto pt-8 border-t border-gray-100 flex flex-wrap justify-end gap-3">
                 <button 
                   onClick={() => window.location.href = `mailto:${selectedUser.email}`} 
                   className="bg-white text-gray-700 border border-gray-200 px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-sm hover:bg-gray-50 transition-all"
                 >
                   <Mail size={16} /> Email
                 </button>
                 <button 
                   onClick={handleOpenChat} 
                   className="bg-[#2D5B60] text-white px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-sm hover:bg-black transition-all"
                 >
                   <MessageSquare size={16} /> Open Chat
                 </button>
                 <button 
                   onClick={() => handleDelete(selectedUser.id)} 
                   className="bg-red-50 text-red-600 border border-red-200 px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-sm hover:bg-red-100 transition-all ml-auto md:ml-4"
                 >
                   <Trash2 size={16} /> Delete Account
                 </button>
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
    </div>
  );
};

export default Users;