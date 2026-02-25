import { Routes, Route, Navigate } from "react-router-dom";
import AdminLayout from "../layouts/AdminLayout";

import AdminDashboard from "../pages/admin/AdminDashboard";
import Users from "../pages/admin/Users";
import Students from "../pages/admin/students";
import Profile from "../pages/admin/Profile";
import Settings from "../pages/admin/Settings";

const AdminRoutes = () => {
  return (
    <Routes>
      {/* Parent route must have path="/*" */}
      <Route path="/*" element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<Users />} />
        <Route path="students" element={<Students/>}/>
        <Route path="profile" element={<Profile/>}/>
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/admin" />} />
      </Route>
    </Routes>
  );
};

export default AdminRoutes;
