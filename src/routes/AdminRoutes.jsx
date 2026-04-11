import { Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import AdminLayout from "../layouts/AdminLayout";

const AdminDashboard = lazy(() => import("../pages/admin/AdminDashboard"));
const Users = lazy(() => import("../pages/admin/Users"));
const Students = lazy(() => import("../pages/admin/Students"));
const Profile = lazy(() => import("../pages/admin/Profile"));
const Settings = lazy(() => import("../pages/admin/Settings"));
const SchoolYear = lazy(() => import("../pages/admin/SchoolYear"));
const Announcements = lazy(() => import("../pages/admin/Announcements"));

const FeeManagement = lazy(() => import("../components/FeeManagement"));
const AdminManagement = lazy(() => import("../components/AdminManagement")); 
const SystemLogs = lazy(() => import("../components/SystemLogs")); 
const Expenses = lazy(() => import("../pages/admin/Expenses")); 

const AdminRoutes = () => {
  return (
    <Suspense fallback={
      <div className="flex h-screen w-full items-center justify-center text-[#2D5B60] font-black uppercase tracking-widest animate-pulse">
        Loading Module...
      </div>
    }>
      <Routes>
        {/* FIX: Removed path="/*" so React Router properly reads the child paths inside the Outlet! */}
        <Route element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<Users />} />
          <Route path="students" element={<Students />} />
          <Route path="profile" element={<Profile />} />
          <Route path="settings" element={<Settings />} />
          <Route path="schoolyear" element={<SchoolYear />} />
          <Route path="announcements" element={<Announcements />} />
          
          <Route path="fees" element={<FeeManagement />} />
          <Route path="staff" element={<AdminManagement />} />
          <Route path="logs" element={<SystemLogs />} />
          <Route path="expenses" element={<Expenses />} />

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
};

export default AdminRoutes;