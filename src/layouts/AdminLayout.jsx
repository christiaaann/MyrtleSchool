import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { auth, db } from "../services/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
const AdminLayout = () => {
  
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const data = docSnap.data();
            setUserData({
              fullname: data.fullname || data.name || "Admin",
              profilePicture: data.profilePicture || data.photoURL || "/default.png",
              email: data.email || user.email,
              role: data.role || "user",
            });
          } else {
            setUserData({
              fullname: user.displayName || "Admin",
              profilePicture: user.photoURL || "/default.png",
              email: user.email,
              role: "admin",
            });
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  if (!userData) return <p>Loading...</p>;

  const handlelogout = async () => {
    try{
      await auth.signOut();
      navigate("/auth")
    }catch (error){
      console.log("Logout failed", error);
    }
  }
  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="w-64 text-white flex flex-col p-4">
    
        <h1 className="text-black">{userData.fullname}</h1>
        <nav className="flex text-neutral-500 flex-col gap-2">
          <NavLink
            to="/admin"
            end
            className={({ isActive }) =>
              `p-2 rounded ${isActive ? "bg-gray-200 text-black" : "hover:bg-gray-200 "}`
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
              `p-2 rounded ${isActive ? "bg-gray-200 text-" : "hover:bg-gray-200"}`
            }
          >
            Settings
          </NavLink>
        </nav>
      </aside>

      {/* Right side */}
      <div className="flex-1 flex flex-col">
        {/* Topbar */}
        <header className="h-16 bg-white shadow flex items-center px-6">
          <h2 className="text-xl font-semibold">Admin</h2>
          <button onClick={handlelogout}>Logout</button>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 bg-gray-100 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
