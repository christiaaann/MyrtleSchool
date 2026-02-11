import React from 'react'
import { BrowserRouter,Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Auth from './pages/student/Auth';
import PreSchool from './pages/PreSchool';
const App = () => {
  return (
     <BrowserRouter>
     <div className='relative overflow-hidden'>
     <Routes>
      <Route path='/' element={<Landing/>}/>
      <Route path='/Auth' element={<Auth/>}/>
      <Route path='/preschool' element={<PreSchool/>}/>
     </Routes>
     </div>  
     </BrowserRouter>
  );
}

export default App