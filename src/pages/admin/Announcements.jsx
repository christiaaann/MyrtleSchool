import React, { useState, useEffect } from "react";
import { db } from "../../services/firebase";
import { collection, addDoc, getDocs, doc, deleteDoc, query, orderBy, limit } from "firebase/firestore";
import { Plus, Trash2, Image as ImageIcon, RefreshCw, UploadCloud, X, Layout, Calendar, Maximize2 } from "lucide-react";

const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

const Announcements = () => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedImg, setSelectedImg] = useState(null); // Para sa Full Screen View

  const fetchAnnouncements = async () => {
    const q = query(collection(db, "announcements"), orderBy("createdAt", "desc"), limit(3));
    const snapshot = await getDocs(q);
    setAnnouncements(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  useEffect(() => { fetchAnnouncements(); }, []);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", UPLOAD_PRESET);
      const res = await fetch(CLOUDINARY_URL, { method: "POST", body: formData });
      const data = await res.json();
      
      await addDoc(collection(db, "announcements"), {
        imageUrl: data.secure_url,
        createdAt: new Date()
      });

      setFile(null); setPreview(null);
      fetchAnnouncements();
    } catch (err) {
      alert("Upload failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this announcement?")) {
      await deleteDoc(doc(db, "announcements", id));
      fetchAnnouncements();
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-10 space-y-10">
      
      {/* FULL IMAGE MODAL (Lilitaw lang 'to pag clinick yung image) */}
      {selectedImg && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-300">
          <button 
            onClick={() => setSelectedImg(null)}
            className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all"
          >
            <X size={24} />
          </button>
          <img 
            src={selectedImg} 
            className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl object-contain animate-in zoom-in-95 duration-300" 
            alt="Full Preview"
          />
        </div>
      )}

      {/* HEADER */}
      <div className="flex items-end justify-between border-b border-slate-100 pb-6">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2 tracking-tight uppercase">
            <Layout className="text-indigo-600" size={22} /> Bulletin Manager
          </h2>
          <p className="text-slate-500 text-[10px] mt-1 font-bold uppercase tracking-[0.15em] opacity-60">Control Homepage Highlights</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* LEFT: UPLOAD BOX */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-6 sticky top-6">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-5 text-center">Create New Post</h3>
            
            <div className={`relative group border-2 border-dashed rounded-[1.5rem] overflow-hidden transition-all duration-300 ${preview ? 'border-indigo-500' : 'border-slate-200 hover:border-indigo-400 bg-slate-50'}`}>
              {preview ? (
                <div className="relative aspect-video w-full">
                  <img src={preview} className="w-full h-full object-cover" alt="Preview" />
                  <button 
                    onClick={() => {setFile(null); setPreview(null);}}
                    className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full shadow-lg hover:scale-110 transition-all"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center aspect-video cursor-pointer transition-all group py-8">
                  <div className="p-4 bg-white rounded-2xl shadow-sm mb-3 group-hover:scale-110 transition-transform text-indigo-500 border border-slate-100">
                    <UploadCloud size={24} />
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-indigo-600 transition-colors">Choose Image</span>
                  <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
                </label>
              )}
            </div>

            <button 
              onClick={handleUpload}
              disabled={!file || loading}
              className="w-full mt-6 bg-slate-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-600 transition-all disabled:opacity-20 flex items-center justify-center gap-2 text-[11px]"
            >
              {loading ? <RefreshCw className="animate-spin" size={16} /> : <Plus size={16} />}
              {loading ? "Publishing..." : "Publish Post"}
            </button>
          </div>
        </div>

        {/* RIGHT: LIVE FEED WITH CLICK TO VIEW */}
        <div className="lg:col-span-7 space-y-6">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 px-2">
            Active Feed <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
          </h3>

          <div className="grid gap-3">
            {announcements.length === 0 ? (
              <div className="py-16 bg-slate-50/50 rounded-[2rem] border border-dashed border-slate-200 text-center">
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">No published banners</p>
              </div>
            ) : (
              announcements.map((item) => (
                <div key={item.id} className="group bg-white p-3 rounded-[1.5rem] border border-slate-100 shadow-sm flex items-center gap-4 hover:border-indigo-100 transition-all">
                  
                  {/* Thumbnail (Clickable for Full Preview) */}
                  <div 
                    onClick={() => setSelectedImg(item.imageUrl)}
                    className="w-20 h-16 flex-shrink-0 bg-slate-100 rounded-xl overflow-hidden relative cursor-pointer group/thumb"
                  >
                    <img src={item.imageUrl} className="w-full h-full object-cover group-hover/thumb:scale-110 transition-transform duration-700" alt="" />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center transition-opacity">
                      <Maximize2 size={16} className="text-white" />
                    </div>
                  </div>
                  
                  <div className="flex-grow">
                    <div className="flex items-center gap-1.5 text-slate-400 mb-0.5">
                      <Calendar size={10} className="text-indigo-400" />
                      <span className="text-[9px] font-black uppercase tracking-tight">
                        {item.createdAt?.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <h4 className="text-[11px] font-black text-slate-700 uppercase tracking-wider">Live Banner</h4>
                  </div>

                  <button 
                    onClick={() => handleDelete(item.id)}
                    className="p-3 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Announcements;