import React, { useState, useEffect } from "react";
import { db } from "../../services/firebase";
import { collection, addDoc, getDocs, doc, deleteDoc, updateDoc, query, orderBy, limit } from "firebase/firestore";

const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

const Announcements = () => {
  const [file, setFile] = useState(null);
  const [announcements, setAnnouncements] = useState([]);

  const fetchAnnouncements = async () => {
    const q = query(collection(db, "announcements"), orderBy("createdAt", "desc"), limit(3));
    const snapshot = await getDocs(q);
    setAnnouncements(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  useEffect(() => { fetchAnnouncements(); }, []);

  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);

    const res = await fetch(CLOUDINARY_URL, {
      method: "POST",
      body: formData
    });

    const data = await res.json();
    const imageUrl = data.secure_url;

    await addDoc(collection(db, "announcements"), {
      imageUrl,
      createdAt: new Date()
    });

    setFile(null);
    fetchAnnouncements();
  };

  const handleDelete = async (id) => {
    await deleteDoc(doc(db, "announcements", id));
    fetchAnnouncements();
  };

  const handleEdit = async (id, newFile) => {
    const formData = new FormData();
    formData.append("file", newFile);
    formData.append("upload_preset", UPLOAD_PRESET);

    const res = await fetch(CLOUDINARY_URL, { method: "POST", body: formData });
    const data = await res.json();
    const imageUrl = data.secure_url;

    await updateDoc(doc(db, "announcements", id), { imageUrl });
    fetchAnnouncements();
  };

  return (
    <div>
      <h2>Admin: Manage Announcements</h2>

      <input type="file" onChange={e => setFile(e.target.files[0])} />
      <button onClick={handleUpload}>Upload</button>

      <div>
        {announcements.map(item => (
          <div key={item.id}>
            <img src={item.imageUrl} width="300" />
            <button onClick={() => handleDelete(item.id)}>Delete</button>
            <input type="file" onChange={e => handleEdit(item.id, e.target.files[0])} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Announcements;