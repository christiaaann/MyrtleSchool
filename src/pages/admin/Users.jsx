import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../services/firebase";
import defaultPic from "../../assets/default.png"; 

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersCollection = collection(db, "users");
        const usersSnapshot = await getDocs(usersCollection);
        const usersList = usersSnapshot.docs.map(doc => ({
          id: doc.id,
          fullname: doc.data().fullname || doc.data().name,
          email: doc.data().email,
          role: doc.data().role,
          profilePicture: doc.data().profilePicture || doc.data().photoURL || defaultPic,
        }));
        setUsers(usersList);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching users:", error);
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  if (loading) return <p>Loading users...</p>;

  return (
    <div className="p-6 bg-white rounded shadow">
      <h2 className="text-xl font-semibold mb-4">Users List</h2>
      {users.length === 0 ? (
        <p>No users found.</p>
      ) : (
        <table className="w-full text-left border-collapse">
          <thead>
            <tr>
              <th className="border-b px-4 py-2">Picture</th>
              <th className="border-b px-4 py-2">Name</th>
              <th className="border-b px-4 py-2">Email</th>
              <th className="border-b px-4 py-2">Role</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td className="border-b px-4 py-2">
                  <img
                    src={user.profilePicture}
                    alt={user.fullname}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                </td>
                <td className="border-b px-4 py-2">{user.fullname}</td>
                <td className="border-b px-4 py-2">{user.email}</td>
                <td className="border-b px-4 py-2">{user.role}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Users;
