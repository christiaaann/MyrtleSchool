import React from 'react'
import { BrowserRouter,Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import EnrollPage from './pages/student/EnrollPage';
import PreSchool from './pages/PreSchool';
const App = () => {
  return (
     <BrowserRouter>
     <div className='relative overflow-hidden'>
     <Routes>
      <Route path='/' element={<Landing/>}/>
      <Route path='/enroll' element={<EnrollPage/>}/>
      <Route path='/preschool' element={<PreSchool/>}/>
     </Routes>
     </div>  
     </BrowserRouter>
  );
}

export default App