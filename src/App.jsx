import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

import Landing from "./pages/public/Landing";
import Auth from "./pages/student/Auth";
import PreSchool from "./pages/public/PreSchool";
import Enrollment from "./pages/student/Enrollment";
import AdminRoutes from "./routes/AdminRoutes";
import ProtectedRoute from "./routes/ProtectedRoute";

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/Auth" element={<Auth />} />
          <Route path="/preschool" element={<PreSchool />} />

          {/* Enrollment route for both user & parent */}
          <Route
            path="/Enrollment"
            element={
              <ProtectedRoute allowedRoles={["user", "parent"]}>
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
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;