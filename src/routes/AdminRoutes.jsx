import { Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import AdminLayout from "../layouts/AdminLayout";

// Lazy load admin pages
const AdminDashboard = lazy(() => import("../pages/admin/AdminDashboard"));
const Users = lazy(() => import("../pages/admin/Users"));
const Students = lazy(() => import("../pages/admin/Students"));
const Profile = lazy(() => import("../pages/admin/Profile"));
const Settings = lazy(() => import("../pages/admin/Settings"));
const SchoolYear = lazy(() => import("../pages/admin/SchoolYear"));

const AdminRoutes = () => {
  return (
    <Suspense>
      <Routes>
        {/* Parent route must have path="/*" */}
        <Route path="/*" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<Users />} />
          <Route path="students" element={<Students />} />
          <Route path="profile" element={<Profile />} />
          <Route path="settings" element={<Settings />} />
          <Route path="schoolyear" element={<SchoolYear />} />
          <Route path="*" element={<Navigate to="/admin" />} />
        </Route>
      </Routes>
    </Suspense>
  );
};

export default AdminRoutes;