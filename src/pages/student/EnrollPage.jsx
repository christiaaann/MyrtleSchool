import React from 'react'

const EnrollPage = () => {
  return (
    <>
      <div className="h-screen flex items-center justify-center">
        <form className="space-y-3">
          <input type="text" id="name" placeholder="Firstname" required />
          <br />

          <input type="text" id="lastname" placeholder="Lastname" />
          <br />

          <input type="text" id="location" placeholder="Address" required />
          <br />

          <input type="email" id="email" placeholder="Email" required />
          <br />

          <input type="password" id="password" placeholder="Password" required />
          <br />

          <input type="file" id="picture" required />
          <br />

          <button type="submit">Sign Up</button>
        </form>
      </div>
    </>
  )
}

export default EnrollPage
