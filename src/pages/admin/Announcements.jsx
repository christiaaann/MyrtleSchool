import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, onSnapshot, doc, setDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { db } from "../../services/firebase";
import { Megaphone, Plus, Search, Calendar, MapPin, X, Star, History, Edit2, Zap, Palette, MapPinned } from "lucide-react";
import logo from '../../assets/logo.png';
import defaultPic from '../../assets/default.png';
import { logAdminAction } from '../../services/systemLogger';
import { sileo } from 'sileo';
import { useOutletContext } from 'react-router-dom';

const Announcements = () => {
  const { userData } = useOutletContext();
  const [currentSY, setCurrentSY] = useState("2025-2026");
  const [activeTab, setActiveTab] = useState("all"); 

  const isSuperAdmin = userData?.role === "superadmin";
  const [activeBranch, setActiveBranch] = useState(isSuperAdmin ? "Irosin" : userData?.branch);

  const [pastAnnouncements, setPastAnnouncements] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  const [newAnnouncement, setNewAnnouncement] = useState({
    title: "", content: "",
    targetAudience: activeBranch, type: "General"
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "schoolYear"), (snap) => {
      if (snap.exists()) setCurrentSY(snap.data().active);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!currentSY || !activeBranch) return;
    setLoading(true);

    const q = isSuperAdmin && activeBranch === "All"
      ? query(collection(db, "announcements"), where("schoolYear", "==", currentSY))
      : query(collection(db, "announcements"), 
          where("schoolYear", "==", currentSY), 
          where("targetAudience", "==", activeBranch));
          
    const unsub = onSnapshot(q, (snap) => {
      const fetched = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      fetched.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds);
      setPastAnnouncements(fetched);
      setLoading(false);
    });
    return () => unsub();
  }, [currentSY, activeBranch, isSuperAdmin]);

  const validate = () => {
    if (!newAnnouncement.title.trim() || !newAnnouncement.content.trim()) {
      alert("Title and content are required.");
      return false;
    }
    return true;
  };

  const handleCreateOrUpdate = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    if (window.confirm(`${editingId ? "Update" : "Publish"} this announcement for ${activeBranch}?`)) {
      setIsSubmitting(true);
      try {
        const docId = editingId || Date.now().toString();
        const data = {
          ...newAnnouncement,
          targetAudience: activeBranch, 
          schoolYear: currentSY,
          updatedAt: serverTimestamp()
        };
        if (!editingId) data.createdAt = serverTimestamp();

        await setDoc(doc(db, "announcements", docId), data, { merge: true });
        
        await logAdminAction(editingId ? "ANNOUNCEMENT_UPDATED" : "ANNOUNCEMENT_CREATED", `${editingId ? "Updated" : "Created"} announcement: ${newAnnouncement.title}`);
        alert(`Announcement ${editingId ? "updated" : "published"} successfully!`);
        cancelEdit();
      } catch (error) {
        console.error(error);
        alert("Failed to process.");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleDelete = async (id, title) => {
    if (window.confirm(`Delete announcement "${title}"? This cannot be undone.`)) {
      try {
        await deleteDoc(doc(db, "announcements", id));
        await logAdminAction("ANNOUNCEMENT_DELETED", `Deleted announcement: ${title}`);
        alert("Announcement deleted.");
      } catch (error) {
        console.error(error);
        alert("Failed to delete.");
      }
    }
  };

  const handleEditClick = (ann) => {
    setEditingId(ann.id);
    setNewAnnouncement({
      title: ann.title, content: ann.content,
      targetAudience: ann.targetAudience, type: ann.type
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setNewAnnouncement({ title: "", content: "", targetAudience: activeBranch, type: "General" });
  };

  const filteredAnnouncements = pastAnnouncements.filter(ann => {
    const searchMatch = ann.title.toLowerCase().includes(searchTerm.toLowerCase()) || ann.content.toLowerCase().includes(searchTerm.toLowerCase());
    const tabMatch = activeTab === "all" || ann.type === activeTab;
    return searchMatch && tabMatch;
  });

  if (loading) return <div className="p-10 text-center animate-pulse font-bold text-gray-400">Loading Announcements...</div>;

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      
      {/* HEADER & BRANCH SELECT */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-[#2D5B60] tracking-tight flex items-center gap-2">
            <Megaphone size={24} /> Announcements & Events
          </h2>
          <p className="text-sm text-gray-500 mt-1">Manage school-wide and branch announcements.</p>
        </div>

        {isSuperAdmin && (
          <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-200">
            <button onClick={() => setActiveBranch("Irosin")} className={`flex items-center gap-2 px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeBranch === "Irosin" ? "bg-[#2D5B60] text-white shadow-md" : "text-gray-500 hover:bg-gray-100"}`}>
              <MapPinned size={14}/> Irosin
            </button>
            <button onClick={() => setActiveBranch("Matnog")} className={`flex items-center gap-2 px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeBranch === "Matnog" ? "bg-[#2D5B60] text-white shadow-md" : "text-gray-500 hover:bg-gray-100"}`}>
              <MapPinned size={14}/> Matnog
            </button>
            <button onClick={() => setActiveBranch("All")} className={`flex items-center gap-2 px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeBranch === "All" ? "bg-amber-500 text-white shadow-md" : "text-gray-500 hover:bg-gray-100"}`}>
              <Palette size={14}/> All
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
        
        {/* CREATE/EDIT FORM */}
        <div className={`bg-white p-6 rounded-2xl shadow-sm border transition-colors duration-300 ${editingId ? 'border-amber-400 ring-4 ring-amber-50' : 'border-gray-200'}`}>
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-sm font-bold uppercase tracking-widest text-amber-600 flex items-center gap-2">
              <Megaphone size={18} /> {editingId ? "Edit Announcement" : "Publish Announcement"}
            </h3>
            {editingId && <button onClick={cancelEdit} className="text-[10px] font-bold text-gray-400 hover:text-red-500 uppercase underline">Cancel Edit</button>}
          </div>
          <p className="text-[11px] text-gray-500 mb-6 border-b border-gray-100 pb-4">Visible to students/parents in the {activeBranch === "All" ? "All Branches" : `${activeBranch} branch`} for S.Y. {currentSY}.</p>
          
          <form onSubmit={handleCreateOrUpdate} className="space-y-5">
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase pl-1">Title</label>
              <input type="text" value={newAnnouncement.title} onChange={e => setNewAnnouncement(p=>({...p, title: e.target.value}))} required className="w-full mt-1 p-3 border border-gray-200 rounded-xl bg-gray-50 outline-none focus:border-amber-500 transition-all focus:bg-white font-bold" placeholder="e.g. Mandatory Assembly" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase pl-1">Announcement Type</label>
                <select value={newAnnouncement.type} onChange={e=>setNewAnnouncement(p=>({...p, type: e.target.value}))} className="w-full mt-1 p-3 border border-gray-200 rounded-xl bg-gray-50 outline-none focus:border-amber-500 transition-all focus:bg-white font-bold text-sm">
                  <option>General</option>
                  <option>Holiday</option>
                  <option>Event</option>
                  <option>Urgent</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase pl-1">Target</label>
                <div className="w-full mt-1 p-3 border border-gray-200 rounded-xl bg-gray-100 text-gray-600 font-black text-sm">{activeBranch}</div>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase pl-1">Content</label>
              <textarea value={newAnnouncement.content} onChange={e=>setNewAnnouncement(p=>({...p, content: e.target.value}))} required rows={5} className="w-full mt-1 p-3 border border-gray-200 rounded-xl bg-gray-50 outline-none focus:border-amber-500 transition-all focus:bg-white font-medium text-sm leading-relaxed" placeholder="Type announcement details here..." />
            </div>

            <div className="flex justify-end items-center pt-2 border-t border-gray-100">
              <button type="submit" disabled={isSubmitting} className={`w-full sm:w-auto text-white font-black py-3 px-8 rounded-xl shadow-md transition-all uppercase tracking-widest text-xs disabled:bg-gray-300 disabled:shadow-none ${editingId ? "bg-[#2D5B60] hover:bg-black" : "bg-amber-500 hover:bg-amber-600"}`}>
                {isSubmitting ? "Processing..." : editingId ? "Save Changes" : "Publish to Branch"}
              </button>
            </div>
          </form>
        </div>

        {/* PAST ANNOUNCEMENTS LEDGER */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b pb-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-[#2D5B60] flex items-center gap-2"><History size={18} /> Announcements History <span className="text-[11px] text-gray-400">({activeBranch})</span></h3>
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input type="text" placeholder="Search..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} className="w-full sm:w-48 pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:border-[#2D5B60] outline-none" />
            </div>
          </div>

          <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
            {["all", "General", "Holiday", "Event", "Urgent"].map(tab => (
              <button key={tab} onClick={()=>setActiveTab(tab)} className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shrink-0 transition-all ${activeTab === tab ? "bg-[#2D5B60] text-white shadow" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>{tab === "all" ? "View All" : tab}</button>
            ))}
          </div>

          {filteredAnnouncements.length === 0 ? (
            <div className="p-10 text-center border-2 border-dashed border-gray-200 rounded-xl">
              <Megaphone className="mx-auto text-gray-300 mb-3" size={32} />
              <p className="text-sm text-gray-400">No announcements found for {activeBranch}.</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
              {filteredAnnouncements.map(ann => (
                <div key={ann.id} className="p-4 rounded-xl border border-gray-100 bg-gray-50 flex gap-4 items-start relative hover:border-gray-200 hover:bg-white transition-all">
                  <div className={`p-2.5 rounded-lg mt-1 ${ann.type === "Urgent" ? "bg-red-100 text-red-600" : ann.type === "Holiday" ? "bg-emerald-100 text-emerald-600" : ann.type === "Event" ? "bg-indigo-100 text-indigo-600" : "bg-gray-100 text-gray-600" }`}>
                    <Megaphone size={16} />
                  </div>
                  
                  <div className="flex-1">
                    <p className="font-bold text-sm text-gray-800 flex items-center gap-2">{ann.title} <span className="text-[9px] text-orange-600 font-black uppercase tracking-widest bg-orange-100 px-2 py-0.5 rounded w-max">{activeBranch === "All" ? ann.targetAudience : ann.type}</span></p>
                    <p className="text-[11px] text-gray-500 font-medium leading-relaxed mt-1">{ann.content}</p>
                    
                    {/* --- Image fitting fix: changedobject-cover object-contain --- */}
                    {ann.imageUrl && (
                      <img 
                        src={ann.imageUrl} 
                        alt="Announcement" 
                        className="max-w-xs mt-3 h-auto max-h-48 rounded-lg object-contain cursor-pointer transition-all duration-300 ease-in-out hover:scale-150 hover:z-50 relative origin-top-left hover:shadow-2xl bg-white" 
                      />
                    )}
                                        
                    <p className="text-[10px] text-gray-400 font-medium uppercase mt-3 flex items-center gap-1"><Calendar size={12}/> {ann.createdAt?.toDate().toLocaleDateString() || "Recently"}</p>
                  </div>

                  <div className="flex items-center gap-2 absolute top-4 right-4">
                    <button onClick={() => handleEditClick(ann)} className="text-gray-400 hover:text-amber-500 transition-colors"><Edit2 size={14}/></button>
                    <button onClick={() => handleDelete(ann.id, ann.title)} className="text-gray-400 hover:text-red-500 transition-colors"><X size={16}/></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ==========================================
// PORTAL NAVBAR - FOR CONTEXT (User fix)
// ==========================================
// This is not part of Announcements.jsx but provided for context 
// on where the 'User' text fix applies in your layout.

const PortalNavbar = ({ userData, toggleSidebar, isSuperAdmin }) => {
    return (
        <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-sm border-b border-gray-100 px-6 py-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-gray-100 rounded-lg tablet:hidden transition-colors" onClick={toggleSidebar}>
              {/* Menu icon here */}
            </button>
            <div className="flex items-center gap-3">
              <img className="w-10 h-10 object-contain" src={logo} alt="Logo" />
              <div className="hidden phone:block border-l border-gray-200 pl-4 py-1">
                <h1 className="text-[14px] font-black tracking-tight text-gray-800 uppercase leading-none">Myrtle Christian School Inc.</h1>
                <p className="text-[10px] text-[#2D5B60] font-bold tracking-[0.15em] uppercase mt-1">Administrator Portal</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Zap className="text-amber-500" size={18} />
            <div className="flex items-center gap-3 pl-4 border-l border-gray-100">
              <img className="w-9 h-9 rounded-full object-cover border-2 border-gray-100" src={userData?.profilePicture || defaultPic} alt="Admin" />
              <div className="hidden sm:block">
                {/* --- FIX: Display "User" instead of firstname --- */}
                <p className="text-sm font-bold text-gray-800">{userData?.role === "superadmin" ? "S" : "User"}</p>
                <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">{userData?.branch || 'System'}</p>
              </div>
            </div>
          </div>
        </header>
    );
}

export default Announcements;