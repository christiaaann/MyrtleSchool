// src/pages/AdminManagement.jsx (or src/components/AdminManagement.jsx)
import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from "../services/firebase";
import { logAdminAction } from '../services/systemLogger'; // Adjust path if needed

const AdminManagement = () => {
  const [admins, setAdmins] = useState([]);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [loading, setLoading] = useState(true);

  // Fetch all users with role 'admin'
  useEffect(() => {
    const q = query(collection(db, "users"), where("role", "==", "admin"));
    const unsub = onSnapshot(q, (snap) => {
      const adminList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAdmins(adminList);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    if (!newAdminEmail.trim() || !newAdminEmail.includes("@gmail.com")) {
      alert("Please enter a valid @gmail.com address.");
      return;
    }

    // Use the email as the temporary document ID so it's easy to find when they log in
    const tempId = newAdminEmail.toLowerCase().trim();
    
    try {
      await setDoc(doc(db, "users", tempId), {
        email: tempId,
        role: "admin",
        status: "Inactive", // Remains inactive until they login
        invitedAt: serverTimestamp(),
      });

      await logAdminAction("ADMIN_INVITED", `Invited new admin: ${tempId}`);
      setNewAdminEmail("");
      alert("Admin invited successfully! They can now log in via Google to activate their account.");
    } catch (error) {
      console.error(error);
      alert("Error adding admin.");
    }
  };

  const handleRemoveAdmin = async (id, email) => {
    if (window.confirm(`Are you sure you want to revoke admin access for ${email}?`)) {
      try {
        await deleteDoc(doc(db, "users", id));
        await logAdminAction("ADMIN_REMOVED", `Revoked access for admin: ${email}`);
      } catch (error) {
        console.error(error);
      }
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h2 className="text-2xl font-bold text-[#2D5B60] mb-6">Staff & Admin Management</h2>

      {/* Add New Admin Form */}
      <div className="bg-white p-6 rounded-xl shadow-sm border mb-8 max-w-xl">
        <h3 className="text-sm font-black text-gray-500 uppercase tracking-widest mb-4">Invite New Admin</h3>
        <form onSubmit={handleAddAdmin} className="flex gap-3">
          <input 
            type="email" 
            placeholder="staff@gmail.com" 
            value={newAdminEmail}
            onChange={(e) => setNewAdminEmail(e.target.value)}
            className="flex-1 border p-3 rounded-lg outline-[#2D5B60]"
          />
          <button type="submit" className="bg-[#2D5B60] text-white px-6 py-3 rounded-lg font-bold hover:bg-black transition-colors">
            Invite Admin
          </button>
        </form>
        <p className="text-[10px] text-gray-400 mt-2 italic">Invited users must log in using 'Continue with Google' to activate their account.</p>
      </div>

      {/* Admin List */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-100 text-gray-500 text-[10px] uppercase font-black tracking-wider">
            <tr>
              <th className="p-4">Staff Member</th>
              <th className="p-4">Status</th>
              <th className="p-4">Last Login</th>
              <th className="p-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan="4" className="p-4 text-center text-gray-400 animate-pulse">Loading staff...</td></tr> : 
             admins.map(admin => (
              <tr key={admin.id} className="border-b">
                <td className="p-4">
                  <p className="font-bold text-gray-800">{admin.name || "Pending Registration"}</p>
                  <p className="text-xs text-gray-500">{admin.email}</p>
                </td>
                <td className="p-4">
                  <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${admin.status === "Active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {admin.status || "Inactive"}
                  </span>
                </td>
                <td className="p-4 text-xs text-gray-500">
                  {admin.lastActive ? new Date(admin.lastActive.toDate()).toLocaleDateString() : "Never"}
                </td>
                <td className="p-4 text-center">
                  <button onClick={() => handleRemoveAdmin(admin.id, admin.email)} className="text-red-500 font-bold text-xs hover:underline">Revoke Access</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminManagement;