import React, { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { Toaster } from "sileo";
import ProtectedRoute from "./routes/ProtectedRoute";
import ForgotPasswordStepper from "./pages/student/ForgotPasswordStepper";

const Landing = lazy(() => import("./pages/public/Landing"));
const Auth = lazy(() => import("./pages/student/Auth"));
const PreSchool = lazy(() => import("./pages/public/PreSchool"));
const Enrollment = lazy(() => import("./pages/student/Enrollment"));
const CompleteProfile = lazy(() => import("./pages/student/CompleteProfile"));
const SignUpForm = lazy(() => import("./pages/student/SignUpForm"));
const AdminRoutes = lazy(() => import("./routes/AdminRoutes"));
const Profile = lazy(() => import("./pages/student/Profile"));
const ChangePassword = lazy(() => import("./pages/student/ChangePassword"));

// The expanded list of valid parent roles
const VALID_PARENT_ROLES = ["parent", "user", "mother", "father", "guardian"];

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster closeButton position="top-center" richColors={false} />
        <Suspense fallback={
          <div className="flex h-screen w-full items-center justify-center text-[#2D5B60] font-black uppercase tracking-widest animate-pulse">
            Loading Page...
          </div>
        }>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/Auth" element={<Auth />} />
            <Route path="/preschool" element={<PreSchool />} />
            <Route path="/signup" element={<SignUpForm />} />
            <Route path="/forgotpassword" element={<ForgotPasswordStepper/>} />

            {/* PARENT ROUTES - Now accepting mother, father, and guardian! */}
            <Route
              path="/completeprofile"
              element={
                <ProtectedRoute allowedRoles={VALID_PARENT_ROLES}>
                  <CompleteProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute allowedRoles={VALID_PARENT_ROLES}>
                 <Profile/>
                </ProtectedRoute>
              }
            />
            <Route
              path="/changepassword"
              element={
                <ProtectedRoute allowedRoles={VALID_PARENT_ROLES}>
                  <ChangePassword/>
                </ProtectedRoute>
              }
            />
            <Route
              path="/Enrollment"
              element={
                <ProtectedRoute allowedRoles={VALID_PARENT_ROLES}>
                  <Enrollment />
                </ProtectedRoute>
              }
            />

            {/* ADMIN ROUTES */}
            <Route
              path="/admin/*"
              element={
                <ProtectedRoute allowedRoles={["admin", "superadmin", "registrar"]}>
                  <AdminRoutes />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;