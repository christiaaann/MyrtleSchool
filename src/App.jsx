import React from 'react'
import { BrowserRouter,Routes, Route } from 'react-router-dom';

import Landing from './pages/public/Landing'
import Auth from './pages/student/Auth';
import PreSchool from './pages/public/PreSchool'
import Enrollment from './pages/student/Enrollment';
import AdminRoutes from './routes/AdminRoutes';
import ProtectedRoute from './routes/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
const App = () => {
  return (
    <AuthProvider>
     <BrowserRouter>
     <div className='relative overflow-hidden'>
     <Routes>
      <Route path='/' element={<Landing/>}/>
      <Route path='/Auth' element={<Auth/>}/>
      <Route path='/preschool' element={<PreSchool/>}/>
      <Route path='/Enrollment' element={<ProtectedRoute requiredRole="user"><Enrollment/></ProtectedRoute>}/>

      {/* Admin */}

        <Route path="/admin/*" element={<ProtectedRoute requiredRole="admin"><AdminRoutes/></ProtectedRoute>} />
     </Routes>
     </div>  
     </BrowserRouter>
     </AuthProvider>
  );
}

export default App