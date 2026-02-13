  import React, { useState } from 'react'
  import { signInWithEmailAndPassword } from 'firebase/auth';
  import { auth } from '../../services/firebase';
  import { useNavigate } from 'react-router-dom';
  import { doc, getDoc } from 'firebase/firestore';
  import { db } from '../../services/firebase';

  const SignInForm = () => {
     
     const navigate = useNavigate();
     const [email, setemail] = useState("");
     const [password, setpassword] = useState("");
     const [message, setMessage] = useState();
     const [success, setSuccess] = useState(false);
     const [loading, setLoading] = useState(false);

     const handleSubmit = async (e) => {
     e.preventDefault();
     setLoading(true); // start loading
     try {
     const userCredential = await signInWithEmailAndPassword(auth, email, password);
     console.log("Login Success", userCredential.user);
     
     const user = userCredential.user

    // 🔥 Get role from Firestore
     const docRef = doc(db, "users", user.uid);
     const docSnap = await getDoc(docRef);

     if (docSnap.exists()) {
     const role = docSnap.data().role;
 
     setMessage("Login Successful!");
     setSuccess(true);

     setTimeout(() => {
      if (role === "admin") {
        navigate("/AdminDashboard");
      } else {
        navigate("/Enrollment");
      }
    }, 1500);

  } else {
    setMessage("User data not found.");
    setSuccess(false);
  }

} catch (error) {
  console.error(error.message);
  setMessage(error.message);
  setSuccess(false);
} finally {
  setLoading(false);
}
};


    return (
      <div className=' w-full flex justify-center'>
         {/* UI Message */}
      {message && (
        <div
          className={`px-4 py-1 absolute top-20 rounded-md text-white ${
            success ? "bg-green-500 absolute text-center w-[20rem]  " : "bg-red-500"
          } transition-all`}
        >
          {message}
        </div>
      )}
      <form onSubmit={handleSubmit} className='flex flex-col gap-4 justify-center w-full items-center'>
        <input className=' px-5 py-2 w-80 outline-none border-2 rounded-lg' type="email" value={email} onChange={(e) =>setemail(e.target.value)}  placeholder="your@gmail.com" />
        <input className=' px-5 py-2 w-80 outline-none border-2 rounded-lg' type="password" value={password} onChange={(e) =>setpassword(e.target.value)} placeholder="Password" />
        
        <button type="submit" className={`w-80 py-2 rounded-lg font-semibold text-white transition-colors
        ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"}`}disabled={loading}>
         {loading ? ( <span className="flex items-center justify-center"><svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
       <circle className="opacity-25" cx="12"cy="12"r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
       </svg> Logging in...</span>) : ("Login")}</button>
      </form>
      </div>
    );
  };

  export default SignInForm