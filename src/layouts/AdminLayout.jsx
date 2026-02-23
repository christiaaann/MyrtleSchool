import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { auth, db } from "../services/firebase";
import { doc, onSnapshot} from "firebase/firestore";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";

const AdminLayout = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [userData, setUserData] = useState(null);

 useEffect(() => {
  let unsubscribeSnapshot;

  const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
    if (user) {
      const userRef = doc(db, "users", user.uid);
      unsubscribeSnapshot = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserData({
            fullname: data.fullname || data.name || "Admin",
            profilePicture: data.profilePicture || data.photoURL || "/default.png",
            email: data.email || user.email,
            role: data.role || "user",
            lastActive: data.lastActive || null,
          });
        }
      });
    }
  });

  return () => {
    unsubscribeAuth();
    if (unsubscribeSnapshot) unsubscribeSnapshot();
  };
}, []);

  if (!userData) return <p>Loading...</p>;

  const handlelogout = async () => {
    try {
      await auth.signOut();
      navigate("/auth");
    } catch (error) {
      console.log("Logout failed", error);
    }
  };

  return (
    <div className="flex h-screen p-3 bg-gray-200">
      {/* Sidebar */}
      <aside className="w-48 bg-white rounded-l-lg text-white flex flex-col p-4">
        <h1 className="text-black">{userData.fullname}</h1>
        <nav className="flex text-neutral-500 flex-col gap-2">
          <NavLink
            to="/admin"
            end
            className={({ isActive }) =>
              `p-2 rounded ${isActive ? "bg-gray-200 text-black" : "hover:bg-gray-200"}`
            }
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/admin/users"
            className={({ isActive }) =>
              `p-2 rounded ${isActive ? "bg-gray-200 text-black" : "hover:bg-gray-200"}`
            }
          >
            Users
          </NavLink>
          <NavLink
            to="/admin/settings"
            className={({ isActive }) =>
              `p-2 rounded ${isActive ? "bg-gray-200 text-black" : "hover:bg-gray-200"}`
            }
          >
            Settings
          </NavLink>
        </nav>
      </aside>

      {/* Top */}
      <div className="flex-1 flex flex-col">
        <header className="h-14 bg-white flex items-center justify-end px-6">
          <h2 className="text-xl font-semibold">Admin</h2>
          <button onClick={() => setOpen(!open)}>View</button>
      
          
          {open && (
            <div className=" bg-white flex gap-4 flex-col top-20 border absolute w-40">
             <button>Profile</button>
             <button>Settings</button>
             <button onClick={handlelogout}>Logout</button>
            </div>
          )}

        </header>

        <main className="flex-1 p-2 bg-gray-100 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;