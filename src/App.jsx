import React from 'react'
import { BrowserRouter,Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';

const App = () => {
  return (
     <BrowserRouter>
     <div className='relative overflow-hidden'>
     <Routes>
      <Route path='/' element={<Landing/>}/>
     </Routes>
     </div>  
     </BrowserRouter>
  );
}

export default App