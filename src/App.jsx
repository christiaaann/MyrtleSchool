import React, { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { Toaster } from "sileo";
import ProtectedRoute from "./routes/ProtectedRoute";

const Landing = lazy(() => import("./pages/public/Landing"));
const Auth = lazy(() => import("./pages/student/Auth"));
const PreSchool = lazy(() => import("./pages/public/PreSchool"));
const Enrollment = lazy(() => import("./pages/student/Enrollment"));
const CompleteProfile = lazy(() => import("./pages/student/CompleteProfile"));
const SignUpForm = lazy(() => import("./pages/student/SignUpForm"));
const AdminRoutes = lazy(() => import("./routes/AdminRoutes"));

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster closeButton position="top-center" richColors={false} />
        <Suspense fallback={<div>Loading...</div>}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/Auth" element={<Auth />} />
            <Route path="/preschool" element={<PreSchool />} />
            <Route path="/signup" element={<SignUpForm />} />

            <Route
              path="/completeprofile"
              element={
                <ProtectedRoute requiredRole="user">
                  <CompleteProfile />
                </ProtectedRoute>
              }
            />

            <Route
              path="/Enrollment"
              element={
                <ProtectedRoute requiredRole="user">
                  <Enrollment />
                </ProtectedRoute>
              }
            />

            {/* Admin route */}
            <Route
              path="/admin/*"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
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