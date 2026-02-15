import React from 'react'
import { BrowserRouter,Routes, Route } from 'react-router-dom';

import Landing from './pages/public/Landing'
import Auth from './pages/student/Auth';
import PreSchool from './pages/public/PreSchool'
import AdminDashboard from './pages/admin/AdminDashboard'
import Enrollment from './pages/student/Enrollment';

const App = () => {
  return (
     <BrowserRouter>
     <div className='relative overflow-hidden'>
     <Routes>
      <Route path='/' element={<Landing/>}/>
      <Route path='/Auth' element={<Auth/>}/>
      <Route path='/preschool' element={<PreSchool/>}/>

      <Route path='/AdminDashboard' element={<AdminDashboard/>}/>
      <Route path='/Enrollment' element={<Enrollment/>}/>
     </Routes>
     </div>  
     </BrowserRouter>
  );
}

export default App