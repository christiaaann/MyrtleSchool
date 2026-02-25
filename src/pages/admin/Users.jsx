import React, { useEffect, useState } from "react";
import { collection, doc, deleteDoc, onSnapshot, updateDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../../services/firebase";
import defaultPic from "../../assets/default.png";

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedPicture, setSelectedPicture] = useState(null);

  // function to display last seen
  function getLastSeen(ts) {
    if (!ts) return "Offline";
    const now = Date.now();
    const last = ts.toDate().getTime();
    const diff = Math.floor((now - last) / 1000);

    if (diff < 5) return "just now";
    if (diff < 60) return diff + "s ago";
    if (diff < 3600) return Math.floor(diff / 60) + "m ago";
    if (diff < 86400) return Math.floor(diff / 3600) + "h ago";

    return Math.floor(diff / 86400) + "d ago";
  }

  // delete user
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this user?")) return;
    try {
      await deleteDoc(doc(db, "users", id));
      setUsers(users.filter((u) => u.id !== id));
      setSelectedUser(null);
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  // fetch users
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
            lastActive: data.lastActive || null,
          };
        })
        .filter((u) => (u.role || "").toLowerCase() !== "admin");
      setUsers(list);
      setTimeout(() => setLoading(false), 500);
    });

    return () => unsub();
  }, []);

  //  Heartbeat: update lastActive every 10s
  useEffect(() => {
    const interval = setInterval(async () => {
      if (auth.currentUser) {
        await updateDoc(doc(db, "users", auth.currentUser.uid), {
          lastActive: serverTimestamp(),
        });
      }
    }, 10000); 
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="bg-white p-4">
        <h1 className="text-xl font-semibold mb-4">Parents</h1>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-4">
      <h1 className="text-xl font-semibold mb-4">Parents</h1>

      {users.length === 0 ? (
        <p>No users found.</p>
      ) : (
        <table className="w-full text-left border-collapse">
          <thead className="text-neutral-500">
            <tr>
              <th className="border-b px-4 py-2">Picture</th>
              <th className="border-b px-4 py-2">Name</th>
              <th className="border-b px-4 py-2">Email</th>
              <th className="border-b px-4 py-2">Contact</th>
              <th className="border-b px-4 py-2 text-center">Status</th>
              <th className="border-b px-4 py-2">Action</th>
            </tr>
          </thead>

          <tbody>
            {users.map((user) => {
              const isOnline = user.lastActive?.toDate && Date.now() - user.lastActive.toDate().getTime() < 60000;
              return (
                <tr key={user.id} className="hover:bg-gray-100 cursor-pointer" onClick={() => setSelectedUser(user)}>
                  <td className="border-b px-4 py-2">
                    <img src={user.profilePicture} alt={user.fullname} className="w-10 h-10 rounded-full object-cover" />
                  </td>
                  <td className="border-b px-4 py-2">{user.fullname}</td>
                  <td className="border-b px-4 py-2">{user.email}</td>
                  <td className="border-b px-4 py-2">{user.contact}</td>
                  <td className="border-b px-4 py-2 text-center">
                    {isOnline ? (
                      <span className="bg-green-400 inline-block rounded-full w-3 h-3"></span>
                    ) : (
                      <span className="text-neutral-500 text-sm">Offline {user.lastActive ? getLastSeen(user.lastActive) : "Offline"}</span>
                    )}
                  </td>
                  <td className="border-b px-4 py-2" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => handleDelete(user.id)} className="text-red-600 hover:underline">
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* USER DETAILS  */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start pt-20 z-40">
          <div className="bg-white p-6 rounded shadow w-96 relative text-black">
            <button className="absolute top-2 right-2 text-xl font-bold" onClick={() => setSelectedUser(null)}>
              ×
            </button>
            <div className="flex flex-col items-center">
              <img
                src={selectedUser.profilePicture || defaultPic}
                alt={selectedUser.fullname}
                className="w-24 h-24 rounded-full object-cover mb-2 cursor-pointer"
                onClick={() => setSelectedPicture(selectedUser.profilePicture)}
              />
              <h2 className="text-xl font-semibold mb-2">{selectedUser.fullname}</h2>
              <p><strong>Email:</strong> {selectedUser.email}</p>
              <p><strong>Contact:</strong> {selectedUser.contact}</p>
              <p><strong>Role:</strong> {selectedUser.role}</p>

              {selectedUser.parent && (
                <div className="mt-2 w-full text-left">
                  <h3 className="font-semibold">Parent Details</h3>
                  <p>{selectedUser.parent.firstname} {selectedUser.parent.middlename} {selectedUser.parent.lastname}</p>
                  <p>{selectedUser.parent.occupation}</p>
                  <p>{selectedUser.parent.contact}</p>
                </div>
              )}

              {selectedUser.address && (
                <div className="w-full">
                  <h3 className="font-semibold">Address</h3>
                  <p>{selectedUser.address.province}</p>
                  <p>{selectedUser.address.city}</p>
                  <p>{selectedUser.address.barangay}</p>
                </div>
              )}

              {selectedUser.spouse && (
                <div className="mt-2 w-full text-left">
                  <h3 className="font-semibold">Spouse Details</h3>
                  <p>{selectedUser.spouse.firstname} {selectedUser.spouse.middlename} {selectedUser.spouse.lastname}</p>
                  <p>{selectedUser.spouse.occupation}</p>
                  <p>{selectedUser.spouse.contact}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* FULL IMAGE VIEW */}
      {selectedPicture && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/70 flex justify-center items-center z-50" onClick={() => setSelectedPicture(null)}>
          <img src={selectedPicture} alt="Full Size" className="max-w-[90%] max-h-[90%] rounded-lg" />
        </div>
      )}
    </div>
  );
};

export default Users;