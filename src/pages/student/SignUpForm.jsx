import React, { useState } from 'react'
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../../services/firebase';
import { doc, setDoc } from 'firebase/firestore';

const SignUpForm = () => {
    
  const [fullname, setfullname] = useState("");
  const [address,setaddress] = useState("");
  const [email, setemail] = useState("");
  const [password, setpassword] = useState("");
  const [image, setimage] = useState(null);
  
  // cloudinary
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;
      
      let imageUrl = "";

      if (image) {
       const formData = new FormData();
     formData.append("file", image);
     formData.append("upload_preset", uploadPreset);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();
      imageUrl = data.secure_url;
    }
      await setDoc(doc(db, "users", user.uid), {
        fullname,
        address,
        email,
        role: "user",
        profilePicture: imageUrl,
        createdAt: new Date()
      });

      alert("Signup Successful!");  

    } catch (error) {
      console.error(error.message);
      alert(error.message);
    }
    
  }
  
   return (
    <form onSubmit={handleSubmit} className='flex flex-col gap-4 justify-center w-full items-center'>
      <input className=' px-5 py-2 w-80 outline-none border-2 rounded-lg capitalize' type="text" value={fullname} onChange={(e) =>setfullname(e.target.value)} placeholder='firstname.lastname' required />
      <input className=' px-5 py-2 w-80 outline-none border-2 rounded-lg capitalize' type="text" value={address} onChange={(e) => setaddress(e.target.value)} placeholder='Address' required />
      <input className=' px-5 py-2 w-80 outline-none border-2 rounded-lg' type="email" value={email} onChange={(e) => setemail(e.target.value)} placeholder="Email" required />
      <input className=' px-5 py-2 w-80 outline-none border-2 rounded-lg' type="password" value={password} onChange={(e) =>setpassword(e.target.value)} placeholder="Password" required />
      <input className='file:bg-neutral-200 file:border-none file:py-2 file:rounded-lg file:px-5 file:cursor-pointer font-semibold text-neutral-600' type="file" name="" onChange={(e) =>setimage(e.target.files[0])} />
      <button type='submit' className='bg-green-600 text-white w-80 py-2 rounded-lg font-semibold'>Register</button>
    </form>
  );
};

export default SignUpForm