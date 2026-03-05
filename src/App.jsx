import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { Toaster } from "sileo";
import Landing from "./pages/public/Landing";
import Auth from "./pages/student/Auth";
import PreSchool from "./pages/public/PreSchool";
import Enrollment from "./pages/student/Enrollment";
import AdminRoutes from "./routes/AdminRoutes";
import ProtectedRoute from "./routes/ProtectedRoute";
import CompleteProfile from "./pages/student/CompleteProfile";
const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster closeButton position="top-center" richColors={false} />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/Auth" element={<Auth />} />
          <Route path="/preschool" element={<PreSchool />} />
          
          <Route
            path="/completeprofile"
            element={
              <ProtectedRoute requiredRole="parent">
                <CompleteProfile />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/Enrollment"
            element={
              <ProtectedRoute requiredRole="user" >
                <Enrollment />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminRoutes />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
