import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { auth, db } from "../services/firebase";
import { doc, onSnapshot, updateDoc, serverTimestamp } from "firebase/firestore";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { 
  LayoutDashboard, 
  UsersRound,
  Baby,
  CalendarSync,
  LogOut,
  ChevronDown,
  Settings2,
  Receipt,
  UserCog,
  ShieldAlert,
  CreditCard // <-- Added for Expenses
} from "lucide-react";

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
              branch: data.branch || "", // Included branch
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

  useEffect(() => {
    const interval = setInterval(async () => {
      if (auth.currentUser) {
        await updateDoc(doc(db, "users", auth.currentUser.uid), { lastActive: serverTimestamp() });
      }
    }, 10000);
    return () => clearInterval(interval);
  }, []);

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

  if (!userData) return null;

  const isSuperAdmin = userData.role === "superadmin";

  return (
    <div className="flex h-screen p-3 bg-gray-200">
      {/* Sidebar */}
      <aside className="w-52 bg-white relative rounded-l-lg text-gray-500 flex flex-col p-4 overflow-y-auto">
        <div className="flex items-center gap-3 mb-6">
          <img className="w-10 h-10 object-cover rounded-full" src={userData.profilePicture} alt=""/>
          <div className="flex flex-col">
            <h1 className="text-black text-[12px] font-bold whitespace-nowrap">
              {userData.firstname} {userData.lastname}
            </h1>
            <span className="text-[10px] text-gray-400 flex items-center gap-1 font-semibold">
              {isOnline ? (
                <><span className="bg-green-400 w-2 h-2 rounded-full inline-block"></span> {userData.role === 'superadmin' ? 'Owner' : userData.branch}</>
              ) : ` ${userData.lastActive ? getLastSeen(userData.lastActive) : "Offline"}`}
            </span>
          </div>
        </div>

        <nav className="flex flex-col gap-1 text-sm font-semibold">
          <NavLink to="/admin" end className={({ isActive }) => `p-2.5 rounded-xl flex items-center gap-3 transition-colors ${isActive ? "bg-[#2D5B60] text-white shadow-md" : "hover:bg-gray-100"}`}>
            <LayoutDashboard size={18}/> Dashboard
          </NavLink>
      
          <NavLink to="/admin/users" className={({ isActive }) => `p-2.5 rounded-xl flex items-center gap-3 transition-colors ${isActive ? "bg-[#2D5B60] text-white shadow-md" : "hover:bg-gray-100"}`}>
            <UsersRound size={18} /> Parents
          </NavLink>

          <NavLink to="/admin/students" className={({ isActive }) => `p-2.5 rounded-xl flex items-center gap-3 transition-colors ${isActive ? "bg-[#2D5B60] text-white shadow-md" : "hover:bg-gray-100"}`}> 
           <Baby size={18} /> Students
          </NavLink>

          <NavLink to="/admin/fees" className={({ isActive }) => `p-2.5 rounded-xl flex items-center gap-3 transition-colors ${isActive ? "bg-[#2D5B60] text-white shadow-md" : "hover:bg-gray-100"}`}> 
           <Receipt size={18} /> Manage Fees
          </NavLink>

          {/* NEW: Expenses Module */}
          <NavLink to="/admin/expenses" className={({ isActive }) => `p-2.5 rounded-xl flex items-center gap-3 transition-colors ${isActive ? "bg-[#2D5B60] text-white shadow-md" : "hover:bg-gray-100"}`}> 
           <CreditCard size={18} /> Expenses
          </NavLink>

          <NavLink to="/admin/schoolyear" className={({ isActive }) => `p-2.5 rounded-xl flex items-center gap-3 transition-colors ${isActive ? "bg-[#2D5B60] text-white shadow-md" : "hover:bg-gray-100"}`}>       
            <CalendarSync size={18} /> School Year
          </NavLink>

          <div className="h-px bg-gray-100 my-2 w-full"></div>

          {/* HIDDEN FROM REGISTRARS */}
          {isSuperAdmin && (
            <>
              <NavLink to="/admin/staff" className={({ isActive }) => `p-2.5 rounded-xl flex items-center gap-3 transition-colors ${isActive ? "bg-[#2D5B60] text-white shadow-md" : "hover:bg-gray-100"}`}>       
                <UserCog size={18} /> Staff
              </NavLink>

              <NavLink to="/admin/logs" className={({ isActive }) => `p-2.5 rounded-xl flex items-center gap-3 transition-colors ${isActive ? "bg-[#2D5B60] text-white shadow-md" : "hover:bg-gray-100"}`}>       
                <ShieldAlert size={18} /> System Logs
              </NavLink>
            </>
          )}

          <button onClick={() => setOpen(!open)} className="p-2.5 rounded-xl flex items-center justify-between hover:bg-gray-100 w-full">
            <div className="flex items-center gap-3"><Settings2 size={18}/> Settings</div>
            <ChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`}/>
          </button>

          {open && (
            <div className="flex flex-col ml-8 border-l-2 border-gray-100 pl-2 mt-1 space-y-1">
              <NavLink to="/admin/profile" className="p-2 text-xs rounded-lg hover:bg-gray-100">Profile</NavLink>
              <NavLink to="/admin/settings" className="p-2 text-xs rounded-lg hover:bg-gray-100">Security</NavLink>
              <NavLink to="/admin/announcements" className="p-2 text-xs rounded-lg hover:bg-gray-100">Announcements</NavLink>
            </div>
          )}
        </nav>
        <button onClick={handleLogout} className="mt-auto rounded-xl text-xs font-bold py-3 bg-red-50 text-red-600 hover:bg-red-100 w-full flex gap-2 items-center justify-center transition-colors">
          <LogOut size={16}/> Logout
        </button>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-white rounded-r-lg shadow-sm border-l overflow-hidden">
        <main className="flex-1 overflow-auto">
          <Outlet context={{ userData }} />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;