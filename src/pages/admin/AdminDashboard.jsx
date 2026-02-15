import React, { useState } from 'react'
import dashboardicon from '../../assets/icons/dashboard.png'
import usericon from '../../assets/icons/usericon.png'
const AdminDashboard = () => {

  const [active, setactive] = useState(false);
  return (
    <>
    <div className=' flex min-h-screen bg-gray-200 p-5'> 
      <div className='flex w-full rounded-lg bg-gray-100  p-5'>
        <aside className=' w-72 flex justify-center bg-white rounded-s-lg shadow-md'>
         <nav className=' flex flex-col gap-5 text-lg p-4 text-neutral-600 font-semibold'>
          <a className='  text-center rounded-full py-2 flex items-center gap-2' href=""><img className='w-6' src={dashboardicon} alt="" />Dashboard</a>
          <a className='  text-center rounded-full py-2 flex items-center gap-2' href=""><img className='w-6' src={usericon} alt="" />Users</a>
          <a className=' text-center rounded-full py-2' href="">Home</a>
          <a className=' text-center rounded-full py-2' href="">Home</a>
         </nav>
        </aside>
      </div>
    </div>
    </>
  )
}

export default AdminDashboard