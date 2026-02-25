import React from 'react'
import { useOutletContext } from 'react-router-dom'

const Profile = () => {
   const { userData } = useOutletContext();
   
  return (
  <>
   <div className=' bg-white/50 h-screen'>
    <h1>{userData.fullname}</h1>
   </div>
  </>
  )
}

export default Profile