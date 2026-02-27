import React, { useState, useRef } from "react";
import { useOutletContext } from "react-router-dom";
import { db, auth } from "../../services/firebase";
import { doc, updateDoc } from "firebase/firestore";


const Profile = () => {
  const { userData } = useOutletContext();

  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

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

  const [editing, setEditing] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [form, setForm] = useState({
    firstname: userData.firstname || "",
    middlename: userData.middlename || "",
    lastname: userData.lastname || "",
    email: userData.email || "",
   
  });

  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(userData.profilePicture);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
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
      setImageFile(blob);
      setPreview(URL.createObjectURL(blob));
    }, "image/jpeg");

    const tracks = video.srcObject.getTracks();
    tracks.forEach((t) => t.stop());
    setShowCamera(false);
  };

  const handleSave = async () => {
    try {
      const userRef = doc(db, "users", auth.currentUser.uid);
      let imageUrl = userData.profilePicture;

      if (imageFile) {
        imageUrl = await uploadToCloudinary(imageFile);
      }

      
      // Update Firestore
      await updateDoc(userRef, {
        firstname: form.firstname,
        middlename: form.middlename,
        lastname: form.lastname,
        email: form.email,
        profilePicture: imageUrl,
      });

      setEditing(false);
      alert("Profile updated successfully!");
    } catch (err) {
      console.error(err);
      alert("Update failed: " + err.message);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow h-full">
     

      {/* PROFILE PREVIEW */}
      <div className="flex flex-col mb-4">
        <div className="flex items-center gap-2">
        <img src={preview || "/default.png"} alt="profile" className="w-28 h-28 rounded-full object-cover border" />
         <div className="flex flex-col">
         <h1 className="text-xl font-semibold">{userData.firstname} {userData.middlename} {userData.lastname}</h1>
         <h1>{userData.email}</h1>
      </div> 
       </div>
        {editing && (
          <div className="flex gap-2 mt-2">
            <input type="file" accept="image/*" onChange={handleImage} />
            <button onClick={openCamera} className="px-3 py-1 bg-gray-200 rounded">
              Camera
            </button>
          </div>
        )}
      </div>

      {/* CAMERA MODAL */}
      {showCamera && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg flex flex-col items-center">
            <video ref={videoRef} autoPlay className="w-64 rounded" />
            <canvas ref={canvasRef} className="hidden" />
            <button onClick={capturePhoto} className="mt-3 px-4 py-2 bg-blue-600 text-white rounded">
              Capture
            </button>
          </div>
        </div>
      )}

      {/* FORM FIELDS */}
      <div className=" border-2 h-[20rem] border-gray-100 rounded-lg p-5">
        <div className="flex justify-between">
        <h1 className="text-xl font-semibold">Personal Info</h1>
          {/* BUTTONS */}
      <div className=" flex gap-2">
        {!editing ? (
          <button onClick={() => setEditing(true)} className="px-4 border-2 rounded-lg">
            Edit
          </button>
        ) : (
          <>
            <button onClick={handleSave} className="px-4 border-2 rounded-lg">
              Save
            </button>
            <button onClick={() => setEditing(false)} className="px-4 text-red-600 rounded">
              Cancel
            </button>
          </>
        )}
      </div>
      </div>
        <div className="flex gap-5 mt-2 items-center">
        <input name="firstname" value={form.firstname} onChange={handleChange} disabled={!editing} className=" p-2 px-4 rounded-full bg-gray-100 outline-none" />
        <input name="middlename" value={form.middlename} onChange={handleChange} disabled={!editing} className=" p-2 px-4 rounded-full bg-gray-100 outline-non" />
        <input name="lastname" value={form.lastname} onChange={handleChange} disabled={!editing} className=" p-2 px-4 rounded-full bg-gray-100 outline-non" />
        <input name="email" type="email" value={form.email} onChange={handleChange} disabled={!editing} className=" p-2 px-4 rounded-full bg-gray-100 outline-non" placeholder="Email" />
     </div>
     
      </div>

    
    </div>
  );
};

export default Profile;