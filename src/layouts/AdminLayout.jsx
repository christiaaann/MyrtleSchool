import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { auth } from "../services/firebase";

const AdminLayout = () => {
  
  const navigate = useNavigate();

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
      <aside className="w-64 bg-gray-800 text-white flex flex-col p-4">
        <h1 className="text-2xl font-bold mb-6">Admin Panel</h1>

        <nav className="flex flex-col gap-2">
          <NavLink
            to="/admin"
            end
            className={({ isActive }) =>
              `p-2 rounded ${isActive ? "bg-gray-700" : "hover:bg-gray-700"}`
            }
          >
            Dashboard
          </NavLink>

          <NavLink
            to="/admin/users"
            className={({ isActive }) =>
              `p-2 rounded ${isActive ? "bg-gray-700" : "hover:bg-gray-700"}`
            }
          >
            Users
          </NavLink>

          <NavLink
            to="/admin/settings"
            className={({ isActive }) =>
              `p-2 rounded ${isActive ? "bg-gray-700" : "hover:bg-gray-700"}`
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
