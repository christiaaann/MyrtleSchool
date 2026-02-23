import React, { useEffect, useState } from "react";
import { collection, doc, updateDoc, onSnapshot } from "firebase/firestore";
import { db } from "../../services/firebase";
import defaultPic from "../../assets/default.png";

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedPicture, setSelectedPicture] = useState(null);
  const [showArchived, setShowArchived] = useState(false); 

  // 🔹 Archive user (soft delete)
  const handleArchive = async (id) => {
    if (!window.confirm("Archive this user?")) return;

    try {
      await updateDoc(doc(db, "users", id), {
        isActive: false,
        archivedAt: new Date(),
      });
      setUsers(users.map(u => u.id === id ? {...u, isActive: false} : u));
      setSelectedUser(null);
    } catch (err) {
      console.error("Archive error:", err);
    }
  };

  // 🔹 Restore archived user
  const handleRestore = async (id) => {
    if (!window.confirm("Restore this user?")) return;

    try {
      await updateDoc(doc(db, "users", id), {
        isActive: true,
        archivedAt: null,
      });
      setUsers(users.map(u => u.id === id ? {...u, isActive: true} : u));
      setSelectedUser(null);
    } catch (err) {
      console.error("Restore error:", err);
    }
  };

  // Fetch users from Firestore
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "users"), (snapshot) => {
      const list = snapshot.docs
        .map((docu) => {
          const data = docu.data();
          return {
            id: docu.id,
            fullname:
              `${data.parent?.firstname || ""} ${data.parent?.middlename || ""} ${data.parent?.lastname || ""}`.trim() ||
              data.fullname ||
              data.name ||
              "No Name",
            email: data.email,
            contact: data.parent?.contact || "",
            role: data.role,
            profilePicture: data.profilePicture || data.photoURL || defaultPic,
            parent: data.parent || null,
            spouse: data.spouse || null,
            address: data.address || null,
            isActive: data.isActive !== false, // default true
          };
        })
        .filter((u) => (u.role || "").toLowerCase() !== "admin");
      setUsers(list);
      setTimeout(() => setLoading(false), 1000);
    });

    return () => unsub();
  }, []);

  // Filter users depending on tab
  const displayedUsers = users.filter(u => showArchived ? !u.isActive : u.isActive);

  if (loading) {
    return (
      <div className="bg-white">
        <h1 className="text-xl font-semibold mb-4">Users</h1>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-4">
      <h1 className="text-xl font-semibold mb-4">Users</h1>

      {/* Tabs */}
      <div className="flex gap-4 mb-4">
        <button
          className={`px-4 py-2 rounded ${!showArchived ? "bg-blue-500 text-white" : "bg-gray-200"}`}
          onClick={() => setShowArchived(false)}
        >
          Active Users
        </button>
        <button
          className={`px-4 py-2 rounded ${showArchived ? "bg-blue-500 text-white" : "bg-gray-200"}`}
          onClick={() => setShowArchived(true)}
        >
          Archived Users
        </button>
      </div>

      {displayedUsers.length === 0 ? (
        <p>{showArchived ? "No archived users." : "No active users."}</p>
      ) : (
        <table className="w-full text-left border-collapse">
          <thead className="text-neutral-500">
            <tr>
              <th className="border-b px-4 py-2">Picture</th>
              <th className="border-b px-4 py-2">Name</th>
              <th className="border-b px-4 py-2">Email</th>
              <th className="border-b px-4 py-2">Contact</th>
              <th className="border-b px-4 py-2">Action</th>
            </tr>
          </thead>

          <tbody>
            {displayedUsers.map((user) => (
              <tr
                key={user.id}
                className="hover:bg-gray-100 cursor-pointer"
                onClick={() => setSelectedUser(user)}
              >
                <td className="border-b px-4 py-2">
                  <img
                    src={user.profilePicture}
                    alt={user.fullname}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                </td>
                <td className="border-b px-4 py-2">{user.fullname}</td>
                <td className="border-b px-4 py-2">{user.email}</td>
                <td className="border-b px-4 py-2">{user.contact}</td>
                <td
                  className="border-b px-4 py-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  {showArchived ? (
                    <button
                      onClick={() => handleRestore(user.id)}
                      className="text-green-600 hover:underline"
                    >
                      Restore
                    </button>
                  ) : (
                    <button
                      onClick={() => handleArchive(user.id)}
                      className="text-orange-600 hover:underline"
                    >
                      Archive
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* USER DETAILS MODAL */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start pt-20 z-40">
          <div className="bg-white p-6 rounded shadow w-96 relative text-black">
            <button
              className="absolute top-2 right-2 text-xl font-bold"
              onClick={() => setSelectedUser(null)}
            >
              ×
            </button>

            <div className="flex flex-col items-center">
              <img
                src={selectedUser.profilePicture || defaultPic}
                alt={selectedUser.fullname}
                className="w-24 h-24 rounded-full object-cover mb-2 cursor-pointer"
                onClick={() => setSelectedPicture(selectedUser.profilePicture)}
              />

              <p className="text-sm text-gray-500 mb-2">
                Click picture to view full size
              </p>

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
        <div
          className="fixed inset-0 backdrop-blur-sm bg-black/70 flex justify-center items-center z-50"
          onClick={() => setSelectedPicture(null)}
        >
          <img
            src={selectedPicture}
            alt="Full Size"
            className="max-w-[90%] max-h-[90%] rounded-lg"
          />
        </div>
      )}
    </div>
  );
};

export default Users;