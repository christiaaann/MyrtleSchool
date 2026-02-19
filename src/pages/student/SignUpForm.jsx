import React, { useState, useEffect } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../../services/firebase';
import { doc, setDoc } from 'firebase/firestore';
import deaf from '../../assets/default.png';

const SignUpForm = () => {
  // account
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // parent
  const [parent, setParent] = useState({
    firstname: '',
    middlename: '',
    lastname: '',
    occupation: '',
    contact: '',
  });

  // spouse
  const [spouse, setSpouse] = useState({
    firstname: '',
    middlename: '',
    lastname: '',
    occupation: '',
    contact: '',
  });

  // address
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedBarangay, setSelectedBarangay] = useState('');
  const [purok, setPurok] = useState('');
  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);
  const [barangays, setBarangays] = useState([]);

  // profile image
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);

  // Cloudinary
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  // handle image
  const handleImage = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  // submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // upload image
      let imageUrl = '';
      if (image) {
        const formData = new FormData();
        formData.append('file', image);
        formData.append('upload_preset', uploadPreset);
        const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        imageUrl = data.secure_url;
      }

      // save Firestore
      await setDoc(doc(db, 'users', user.uid), {
        email,
        role: 'user',
        profilePicture: imageUrl,
        createdAt: new Date(),
        parent,
        spouse,
        address: {
          province: provinces.find(p => p.code === selectedProvince)?.name || '',
          city: cities.find(c => c.code === selectedCity)?.name || '',
          barangay: barangays.find(b => b.code === selectedBarangay)?.name || '',
          purok,
        },
      });

      alert('Signup Successful!');
    } catch (err) {
      console.error(err.message);
      alert(err.message);
    }
  };

  // load provinces
  useEffect(() => {
    fetch('https://psgc.gitlab.io/api/provinces/')
      .then(res => res.json())
      .then(setProvinces);
  }, []);

  // load cities
  useEffect(() => {
    if (!selectedProvince) return;
    fetch('https://psgc.gitlab.io/api/cities-municipalities/')
      .then(res => res.json())
      .then(data => {
        setCities(data.filter(c => c.provinceCode === selectedProvince));
      });
  }, [selectedProvince]);

  // load barangays
  useEffect(() => {
    if (!selectedCity) return;
    fetch(`https://psgc.gitlab.io/api/cities-municipalities/${selectedCity}/barangays/`)
      .then(res => res.json())
      .then(setBarangays);
  }, [selectedCity]);

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-4 overflow-y-auto h-[30rem]">
      {/* Profile */}
      <div className="flex flex-col items-center gap-2">
        <img src={preview || deaf} className="w-20 h-20 rounded-full border-4 object-cover" />
        <input type="file" id="upload_profile" hidden accept="image/*" onChange={handleImage} />
        <label htmlFor="upload_profile" className="bg-[#2D5B60] text-white px-4 py-1 rounded cursor-pointer">
          Upload Profile
        </label>
      </div>

      {/* Parent */}
      
  <h2 className="font-semibold text-lg">Parent / Guardian</h2>
  <div className='flex gap-2'>
  <div className="">
   <input
    type="text"
    className="px-5 py-2 border-2 rounded-md w-full"
    placeholder="Firstname"
    value={parent.firstname || ''}
    onChange={(e) => setParent({ ...parent, firstname: e.target.value })}
    required
  />
</div>

<div className="">
  <input
    type="text"
    className="px-5 py-2 border-2 rounded-md w-full"
    placeholder="Middlename"
    value={parent.middlename || ''}
    onChange={(e) => setParent({ ...parent, middlename: e.target.value })}
    required
  />
</div>

<div>
  <input
    type="text"
    className="px-5 py-2 border-2 rounded-md w-full"
    placeholder="Lastname"
    value={parent.lastname || ''}
    onChange={(e) => setParent({ ...parent, lastname: e.target.value })}
    required
  />
</div>
</div>
<div className="">
  <input
    type="text"
    className="px-5 py-2 border-2 rounded-md w-full"
    placeholder="Occupation"
    value={parent.occupation || ''}
    onChange={(e) => setParent({ ...parent, occupation: e.target.value })}
    required
  />
</div>

<div className="mb-4">
  <input
    type="text"
    className="px-5 py-2 border-2 rounded-md w-full"
    placeholder="Contact"
    value={parent.contact || ''}
    onChange={(e) => setParent({ ...parent, contact: e.target.value })}
    required
  />
</div>


      {/* Address */}
      <h2 className="font-semibold text-lg">Address</h2>
      <select className="px-4 py-2 border rounded w-full" value={selectedProvince} onChange={e => setSelectedProvince(e.target.value)} required>
        <option value="">Province</option>
        {provinces.map(p => <option key={p.code} value={p.code}>{p.name}</option>)}
      </select>

      <select className="px-4 py-2 border rounded w-full" value={selectedCity} onChange={e => setSelectedCity(e.target.value)} required>
        <option value="">City / Municipality</option>
        {cities.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
      </select>

      <select className="px-4 py-2 border rounded w-full" value={selectedBarangay} onChange={e => setSelectedBarangay(e.target.value)} required>
        <option value="">Barangay</option>
        {barangays.map(b => <option key={b.code} value={b.code}>{b.name}</option>)}
      </select>

      <input className="px-4 py-2 border rounded w-full" type="text" placeholder="Purok" value={purok} onChange={e => setPurok(e.target.value)} required />

      {/* Spouse */}
      <h2 className="font-semibold text-lg">Spouse</h2>
      {['firstname','middlename','lastname','occupation','contact'].map(field => (
        <input
          key={field}
          className="px-5 py-2 border-2 rounded-md w-full"
          type="text"
          placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
          value={spouse[field]}
          onChange={(e) => setSpouse({...spouse, [field]: e.target.value})}
          required
        />
      ))}

      {/* Account */}
      <h2 className="font-semibold text-lg">Account</h2>
      <input className="px-5 py-2 border-2 rounded-md w-full" type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
      <input className="px-5 py-2 border-2 rounded-md w-full" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />

      <button type="submit" className="bg-[#2D5B60] text-white py-2 rounded-lg w-full font-semibold">
        Register
      </button>
    </form>
  );
};

export default SignUpForm;
