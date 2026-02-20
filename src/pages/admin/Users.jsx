import React, { useEffect, useState } from "react";
import { collection, getDocs, doc, deleteDoc } from "firebase/firestore";
import { db } from "../../services/firebase";
import defaultPic from "../../assets/default.png";

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedPicture, setSelectedPicture] = useState(null);
  


  const getLastSeen = (timestamp) => {
    if (!timestamp) return "Offline";

    const now = new Date();
    const last = timestamp.toDate();
    const diffMs = now - last;
    const diffMin = Math.floor(diffMs / 60000);

    if (diffMin < 1) return "Online";
    if (diffMin === 1) return "1 minute ago";
    if (diffMin < 60) return `${diffMin} minute s ago`;

    const diffHr = Math.floor(diffMin / 60);
    if (diffHr === 1) return "1 hour ago";
    if (diffHr < 24) return `${diffHr} hours ago`;

    const diffDay = Math.floor(diffHr / 24);
    return `${diffDay} days ago`;
  };

  // 🔹 delete user
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

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const snapshot = await getDocs(collection(db, "users"));

        const list = snapshot.docs.map((docu) => {
          const data = docu.data();

          return {
            id: docu.id,
            fullname:
              `${data.parent?.firstname || ""} ${data.parent?.middlename || ""} ${data.parent?.lastname || ""}`
                .trim() ||
              data.fullname ||
              data.name ||
              "No Name",
            email: data.email,
            contact: data.parent?.contact || "",
            role: data.role,
            profilePicture:
              data.profilePicture || data.photoURL || defaultPic,
            parent: data.parent || null,
            spouse: data.spouse || null,
            lastActive: data.lastActive || null,
          };
        });

        setUsers(list);
        setLoading(false);
      } catch (e) {
        console.error(e);
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  if (loading) return <p>Loading users...</p>;

  return (
    <div className="bg-white">
      <h1 className="text-xl font-semibold mb-4">Users</h1>

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
              <th className="border-b px-4 py-2">Status</th>
              <th className="border-b px-4 py-2">Role</th>
              <th className="border-b px-4 py-2">Action</th>
            </tr>
          </thead>

          <tbody>
            {users.map((user) => (
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

                {/* STATUS */}
            <td className="border-b px-4 py-2">
            {user.lastActive ? (
            <span className={new Date() - user.lastActive.toDate() < 60000
             ? "text-green-600"
             : "text-neutral-300"
             }>
             {getLastSeen(user.lastActive)}
             </span>
             ) : (
            <span className="text-neutral-300">Offline</span>
             )}
            </td>

                <td className="border-b px-4 py-2">{user.role}</td>

                {/* ACTION */}
                <td
                  className="border-b px-4 py-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => handleDelete(user.id)}
                    className="text-red-600 hover:underline"
                  >
                    Delete
                  </button>
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
                onClick={() =>
                  setSelectedPicture(selectedUser.profilePicture)
                }
              />

              <p className="text-sm text-gray-500 mb-2">
                Click picture to view full size
              </p>

              <h2 className="text-xl font-semibold mb-2">
                {selectedUser.fullname}
              </h2>

              <p>
                <strong>Email:</strong> {selectedUser.email}
              </p>

              <p>
                <strong>Contact:</strong> {selectedUser.contact}
              </p>

              <p>
                <strong>Role:</strong> {selectedUser.role}
              </p>

              {selectedUser.parent && (
                <div className="mt-2 w-full text-left">
                  <h3 className="font-semibold">Parent Details</h3>
                  <p>
                    {selectedUser.parent.firstname}{" "}
                    {selectedUser.parent.middlename}{" "}
                    {selectedUser.parent.lastname}
                  </p>
                  <p>{selectedUser.parent.occupation}</p>
                  <p>{selectedUser.parent.contact}</p>
                </div>
              )}

              {selectedUser.spouse && (
                <div className="mt-2 w-full text-left">
                  <h3 className="font-semibold">Spouse Details</h3>
                  <p>
                    {selectedUser.spouse.firstname}{" "}
                    {selectedUser.spouse.middlename}{" "}
                    {selectedUser.spouse.lastname}
                  </p>
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