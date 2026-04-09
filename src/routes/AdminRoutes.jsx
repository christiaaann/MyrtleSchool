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
const Announcements = lazy(() => import("../pages/admin/Announcements"));

// --- FIXED COMPONENT IMPORTS ---
// Based on your folder structure, these three are inside src/components/
const FeeManagement = lazy(() => import("../components/FeeManagement"));
const AdminManagement = lazy(() => import("../components/AdminManagement")); 
const SystemLogs = lazy(() => import("../components/SystemLogs")); 

const AdminRoutes = () => {
  return (
    <Suspense fallback={
      <div className="flex h-screen w-full items-center justify-center text-[#2D5B60] font-black uppercase tracking-widest animate-pulse">
        Loading Module...
      </div>
    }>
      <Routes>
        {/* Parent route must have path="/*" */}
        <Route path="/*" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<Users />} />
          <Route path="students" element={<Students />} />
          <Route path="profile" element={<Profile />} />
          <Route path="settings" element={<Settings />} />
          <Route path="schoolyear" element={<SchoolYear />} />
          <Route path="announcements" element={<Announcements />} />
          
          {/* Phase 1 & 2 Modules */}
          <Route path="fees" element={<FeeManagement />} />
          <Route path="staff" element={<AdminManagement />} />
          <Route path="logs" element={<SystemLogs />} />

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/admin" />} />
        </Route>
      </Routes>
    </Suspense>
  );
};

export default AdminRoutes;