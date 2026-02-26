import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { auth, db } from "../services/firebase";
import { doc, onSnapshot, updateDoc, serverTimestamp } from "firebase/firestore";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";

const AdminLayout = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [userData, setUserData] = useState(null);
  const [isOnline, setIsOnline] = useState(false); 

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

  // Fetch current user
  useEffect(() => {
    let unsubscribeSnapshot;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        const userRef = doc(db, "users", user.uid);
        unsubscribeSnapshot = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setUserData({
              firstname: data.firstname || "",
              middlename: data.middlename || "",
              lastname: data.lastname || "",
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

  // Heartbeat: update lastActive every 10s
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

  // Track online status locally every 1s like Users.jsx
  useEffect(() => {
    const interval = setInterval(() => {
      if (userData?.lastActive?.toDate) {
        setIsOnline(Date.now() - userData.lastActive.toDate().getTime() < 60000);
      } else {
        setIsOnline(false);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [userData]);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate("/auth");
    } catch (error) {
      console.log("Logout failed", error);
    }
  };

  if (!userData) return <p>Loading...</p>;

  return (
    <div className="flex h-screen p-3 bg-gray-200">
      {/* Sidebar */}
      <aside className="w-48 bg-white rounded-l-lg text-white flex flex-col p-4">
     <div className="flex items-center gap-3 mb-4">
     {/* Profile Picture */}
     <img
     className="w-10 h-10 object-cover rounded-full"
     src={userData.profilePicture}
     alt=""
    />

    {/* Name + status */}
     <div className="flex flex-col">
      <h1 className="text-black text-[12px] font-medium whitespace-nowrap">
      {userData.firstname} {userData.middlename} {userData.lastname}
     </h1>
     
     <span className="text-xs text-gray-500 flex items-center gap-1">
      {isOnline ? (
        <>
          <span className="bg-green-400 w-3 h-3 rounded-full inline-block"></span> Online
        </>
      ) : (
        ` ${userData.lastActive ? getLastSeen(userData.lastActive) : "Offline"}`
      )}
    </span>
  </div>
</div>

        <nav className="flex text-neutral-500 flex-col gap-2 mt-4">
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
            Parents
          </NavLink>
          <NavLink
            to="/admin/students"
            className={({ isActive }) =>
              `p-2 rounded ${isActive ? "bg-gray-200 text-black" : "hover:bg-gray-200"}`
            }
          >
            Students
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

      {/* Main */}
      <div className="flex-1 flex flex-col">
        <header className="h-14 bg-white flex items-center">
          <button className="text-[12px] border px-2 rounded-sm" onClick={() => setOpen(!open)}>View</button>

          {open && (
            <div className="bg-white flex gap-4 flex-col top-16 border absolute w-40">
              <NavLink
                to="/admin/profile"
                className={({ isActive }) =>
                  `p-2 text-center ${isActive ? "bg-gray-200" : "hover:bg-gray-200"}`
                }
              >
                Profile
              </NavLink>
              <button>Settings</button>
              <button onClick={handleLogout}>Logout</button>
            </div>
          )}
        </header>

        <main className="flex-1 p-2 bg-gray-100 overflow-auto">
          <Outlet context={{ userData }} />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;