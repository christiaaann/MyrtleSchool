import React, { useState, useRef } from "react";
import { useOutletContext } from "react-router-dom";
import { db, auth } from "../../services/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { Camera, Upload, User, Mail, Save, X, Edit2, Loader2 } from "lucide-react";

const Profile = () => {
  const { userData } = useOutletContext();

  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  const [editingDetails, setEditingDetails] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [imgLoading, setImgLoading] = useState(false); // Loading para sa image
  const [formLoading, setFormLoading] = useState(false); // Loading para sa details
  
  const [form, setForm] = useState({
    firstname: userData.firstname || "",
    middlename: userData.middlename || "",
    lastname: userData.lastname || "",
    email: userData.email || "",
  });

  const [preview, setPreview] = useState(userData.profilePicture);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // --- IMAGE LOGIC (HIWALAY NA ACTIONS) ---
  
  const uploadToCloudinary = async (file) => {
    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", uploadPreset);
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      body: data,
    });
    const json = await res.json();
    return json.secure_url;
  };

  const updateProfilePic = async (file) => {
    setImgLoading(true);
    try {
      const imageUrl = await uploadToCloudinary(file);
      const userRef = doc(db, "users", auth.currentUser.uid);
      await updateDoc(userRef, { profilePicture: imageUrl });
      setPreview(imageUrl);
      alert("Profile picture updated!");
    } catch (err) {
      alert("Image upload failed: " + err.message);
    } finally {
      setImgLoading(false);
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) updateProfilePic(file);
  };

  const openCamera = async () => {
    setShowCamera(true);
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    videoRef.current.srcObject = stream;
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      updateProfilePic(blob);
    }, "image/jpeg");
    const tracks = video.srcObject.getTracks();
    tracks.forEach((t) => t.stop());
    setShowCamera(false);
  };

  // --- DETAILS LOGIC (HIWALAY NA SAVE) ---

  const handleSaveDetails = async () => {
    setFormLoading(true);
    try {
      const userRef = doc(db, "users", auth.currentUser.uid);
      await updateDoc(userRef, { ...form });
      setEditingDetails(false);
      alert("Details updated successfully!");
    } catch (err) {
      alert("Update failed: " + err.message);
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
        {/* Banner */}
        <div className="h-32 bg-gradient-to-r from-green-800 to-green-950"></div>

        <div className="px-8 pb-8">
          <div className="relative flex flex-col sm:flex-row items-center sm:items-end -mt-16 mb-8 gap-6 text-center sm:text-left">
            
            {/* PROFILE IMAGE SECTION */}
            <div className="relative group">
              <div className="w-32 h-32 rounded-3xl overflow-hidden border-4 border-white shadow-xl bg-gray-100 relative">
                <img
                  src={preview || "/default.png"}
                  alt="profile"
                  className={`w-full h-full object-cover transition-opacity ${imgLoading ? "opacity-30" : "opacity-100"}`}
                />
                {imgLoading && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="animate-spin text-green-600" />
                  </div>
                )}
              </div>
              
              {/* Image Actions Overlay */}
              <div className="absolute -bottom-2 -right-2 flex gap-1">
                <label className="p-2 bg-white shadow-lg rounded-xl cursor-pointer hover:bg-gray-50 text-gray-600 border border-gray-100 transition-transform active:scale-90">
                  <Upload size={16} />
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageSelect} disabled={imgLoading} />
                </label>
                <button 
                  onClick={openCamera}
                  disabled={imgLoading}
                  className="p-2 bg-white shadow-lg rounded-xl hover:bg-gray-50 text-gray-600 border border-gray-100 transition-transform active:scale-90"
                >
                  <Camera size={16} />
                </button>
              </div>
            </div>

            <div className="flex-1 mb-2">
              <h1 className="text-2xl font-black text-gray-900 leading-tight">
                {userData.firstname} {userData.lastname}
              </h1>
              <p className="text-gray-500 flex items-center justify-center sm:justify-start gap-1.5 font-medium text-sm">
                <Mail size={14} className="text-green-600" /> {userData.email}
              </p>
            </div>

            <div className="mb-2">
              {!editingDetails ? (
                <button
                  onClick={() => setEditingDetails(true)}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gray-900 text-white rounded-2xl hover:bg-black transition-all font-bold text-sm"
                >
                  <Edit2 size={16} /> Edit Details
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => { setEditingDetails(false); setForm({...userData}); }}
                    className="px-5 py-2.5 border border-gray-200 text-gray-600 rounded-2xl hover:bg-gray-50 font-bold text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveDetails}
                    disabled={formLoading}
                    className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-2xl hover:bg-green-700 font-bold text-sm disabled:opacity-50"
                  >
                    {formLoading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} 
                    Save Details
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="bg-gray-50/50 rounded-3xl p-6 sm:p-8 border border-gray-100">
            <div className="flex items-center gap-2 mb-6 text-gray-400 uppercase tracking-widest text-[10px] font-black">
              <User size={12} /> Personal Information
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              {[
                { label: "First Name", name: "firstname" },
                { label: "Middle Name", name: "middlename" },
                { label: "Last Name", name: "lastname" },
                { label: "Email Address", name: "email" },
              ].map((field) => (
                <div key={field.name} className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 ml-1">{field.label}</label>
                  <input
                    name={field.name}
                    value={form[field.name]}
                    onChange={handleChange}
                    disabled={!editingDetails}
                    className={`w-full px-4 py-3 rounded-xl border transition-all outline-none font-medium ${
                      editingDetails 
                        ? "bg-white border-green-200 focus:ring-4 focus:ring-green-500/5 focus:border-green-500" 
                        : "bg-transparent border-transparent text-gray-700"
                    }`}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CAMERA MODAL */}
      {showCamera && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-[2.5rem] flex flex-col items-center max-w-md w-full shadow-2xl">
            <div className="flex justify-between w-full mb-6 items-center px-2">
              <h2 className="text-xl font-black text-gray-900">Take Photo</h2>
              <button onClick={() => setShowCamera(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="relative w-full aspect-square overflow-hidden rounded-[2rem] bg-black mb-6 shadow-inner">
               <video ref={videoRef} autoPlay className="w-full h-full object-cover" />
            </div>
            <canvas ref={canvasRef} className="hidden" />
            <button
              onClick={capturePhoto}
              className="w-full py-4 bg-green-600 text-white rounded-2xl font-black hover:bg-green-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-200"
            >
              <Camera size={20} /> CAPTURE
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;