import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../../services/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import profilePlaceholder from '../../assets/default.png';
import FloatingInput from "../../components/FloatingInput";
import AddressPicker from "../../components/AddressPicker";

const CompleteProfile = () => {
  const navigate = useNavigate();

  // --- STATES (Lahat ng original fields mo) ---
  const [parentFirst, setParentFirst] = useState("");
  const [parentMiddle, setParentMiddle] = useState("");
  const [parentLast, setParentLast] = useState("");
  const [contact, setContact] = useState("");
  const [occupation, setOccupation] = useState("");
  
  const [profilePicture, setProfilePicture] = useState(profilePlaceholder); 

  const [spouseFirst, setSpouseFirst] = useState("");
  const [spouseMiddle, setSpouseMiddle] = useState("");
  const [spouseLast, setSpouseLast] = useState("");
  const [spouseContact, setSpouseContact] = useState("");
  const [spouseOccupation, setSpouseOccupation] = useState("");

  const [purok, setPurok] = useState("");
  const [barangay, setBarangay] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");

  const [uid, setUid] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // --- PROGRESS CALCULATION ---
  const calculateProgress = () => {
    let completedFields = 0;
    const totalFields = 7; 

    if (parentFirst && parentLast) completedFields++;
    if (contact) completedFields++;
    if (occupation) completedFields++;
    if (spouseFirst && spouseLast) completedFields++;
    if (spouseOccupation) completedFields++;
    if (barangay && city && province) completedFields++;
    
    const isValidPhoto = profilePicture && 
                         profilePicture !== profilePlaceholder && 
                         !String(profilePicture).includes('default.png');
    if (isValidPhoto) completedFields++;

    return Math.round((completedFields / totalFields) * 100);
  };

  const progress = calculateProgress();
  const strokeDashoffset = 251 - (251 * progress) / 100; 

  // --- CLOUDINARY UPLOAD ---
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("File is too large! Max 2MB only.");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
    formData.append("cloud_name", import.meta.env.VITE_CLOUDINARY_CLOUD_NAME);

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: "POST", body: formData }
      );
      const data = await response.json();

      if (data.secure_url) {
        setProfilePicture(data.secure_url);
        if (uid) {
          await updateDoc(doc(db, "users", uid), {
            profilePicture: data.secure_url 
          });
        }
        alert("Photo uploaded successfully!");
      }
    } catch (error) {
      console.error("Upload Error:", error);
      alert("Failed to upload image.");
    } finally {
      setIsUploading(false);
    }
  };

  // --- DATA FETCHING (AUTH & FIRESTORE) ---
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUid(user.uid);
        
        // Anti-CORS Fix for Google Photos
        const cleanURL = (url) => url ? url.replace("http://", "https://") : null;

        if (user.photoURL) {
          setProfilePicture(cleanURL(user.photoURL));
        }

        try {
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const data = docSnap.data();
            
            // Priority: Firestore > Google > Placeholder
            const finalPhoto = (data.profilePicture && data.profilePicture.trim() !== "") 
                               ? data.profilePicture 
                               : cleanURL(user.photoURL);
            
            setProfilePicture(finalPhoto || profilePlaceholder);

            setParentFirst(data.parent?.firstname || user.displayName?.split(" ")[0] || "");
            setParentMiddle(data.parent?.middlename || "");
            setParentLast(data.parent?.lastname || user.displayName?.split(" ").slice(1).join(" ") || "");
            setContact(data.parent?.contact || "");
            setOccupation(data.parent?.occupation || "");
            
            setSpouseFirst(data.spouse?.firstname || "");
            setSpouseMiddle(data.spouse?.middlename || "");
            setSpouseLast(data.spouse?.lastname || "");
            setSpouseContact(data.spouse?.contact || "");
            setSpouseOccupation(data.spouse?.occupation || "");

            setPurok(data.address?.purok || "");
            setBarangay(data.address?.barangay || "");
            setCity(data.address?.city || "");
            setProvince(data.address?.province || "");
          }
        } catch (err) {
          console.error("Error fetching data:", err);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // --- SAVE FUNCTION  ---
  const handleSave = async () => {
    if (!parentFirst.trim() || !parentLast.trim() || !barangay.trim() || !city.trim() || !province.trim()) {
      alert("Please complete the required fields!");
      return;
    }
    try {
      await updateDoc(doc(db, "users", uid), {
        parent: { 
          firstname: parentFirst, 
          middlename: parentMiddle, 
          lastname: parentLast, 
          contact, 
          occupation 
        },
        spouse: { 
          firstname: spouseFirst, 
          middlename: spouseMiddle, 
          lastname: spouseLast, 
          contact: spouseContact, 
          occupation: spouseOccupation 
        },
        address: { purok, barangay, city, province },
        profilePicture: profilePicture 
      });
      alert("Profile Completed!");
      navigate("/Enrollment", { replace: true });
    } catch (error) {
      console.error(error);
      alert("Error saving profile");
    }
  };

  return (
    <div className="min-h-screen p-4 font-sans text-slate-900">
      <div className="max-w-6xl flex mx-auto gap-8">
        <div className=" w-full">
        <div className="lg:col-span-8  w-full p-8">
          <h2 className="text-2xl font-bold mb-8">Complete Profile</h2>

          {/* Profile Picture Section with Google Fix */}
          <div className="flex flex-col mb-10">
            <div className="flex">
            <div className="flex items-center w-full gap-5">
              <img 
                src={profilePicture} 
                key={profilePicture}
                referrerPolicy="no-referrer" 
                crossOrigin="anonymous"
                className={`w-24 h-24 rounded-full border-4 ${isUploading ? 'border-blue-400 animate-pulse' : 'border-yellow-400'} object-cover`} 
                alt="Profile"
                onError={(e) => { e.target.src = profilePlaceholder; }} 
              />
          
            <div>
              <input type="file" id="cloudinaryInput" className="hidden" accept="image/*" onChange={handleImageChange} />
              <button 
                type="button"
                onClick={() => document.getElementById('cloudinaryInput').click()} 
                disabled={isUploading}
                className="border border-gray-200 px-4 py-2 rounded-xl text-sm font-bold hover:bg-gray-50 transition"
              >
                {isUploading ? "Uploading..." : "Change Photo"}
              </button>
            </div>
            
              </div>
             <div className="flex tablet:hidden items-center relative">
              <svg className="w-16 h-16 transform -rotate-90">
                <circle cx="32" cy="32" r="20" stroke="#f1f5f9" strokeWidth="8" fill="transparent" />
                <circle cx="32" cy="32" r="20" stroke="#22c55e" strokeWidth="8" fill="transparent"
                  strokeDasharray="251" strokeDashoffset={strokeDashoffset} strokeLinecap="round"
                  className="transition-all duration-700 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-sm font-black text-slate-600">{progress}%</span>
              </div>
            </div>
            </div>

            {/* Progress */}
            <div className="flex flex-col gap-2 tablet:hidden">
             <StatusCheck label="Profile Photo" done={profilePicture !== profilePlaceholder && !String(profilePicture).includes('default.png')} />
             <StatusCheck label="Personal Info" done={!!(parentFirst && parentLast && contact && occupation)} />
             <StatusCheck label="Spouse Info" done={!!(spouseFirst && spouseLast && spouseContact && spouseOccupation)} />
             <StatusCheck label="Location" done={!!(barangay && city && province && purok)} />
         </div>
          </div>

          <div className="space-y-8">
            {/* Parent Info */}
            <section className="space-y-4">
              <h3 className="font-bold text-slate-700">Personal Info (Parent)</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col tablet:flex-row gap-4">
                <FloatingInput 
                id="parentFirst"
                label="First name"
                required
                disabled
                value={parentFirst}
                onChange={(e) => setParentFirst(e.target.value)}
                 />
                <FloatingInput
                id="parentMiddle"
                label="Middle name"
                required
                disabled
                value={parentMiddle} 
                onChange={(e) =>setParentMiddle(e.target.value)}
                 />
                <FloatingInput
                id="parentLast"
                label="Last name"
                required
                disabled
                value={parentLast} 
                onChange={(e) => setParentLast(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FloatingInput
                id="contact"
                label="Contact"
                required
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                 />
                <FloatingInput
                 id="occupation"
                 label="Occupation"
                 value={occupation}
                 onChange={(e) =>setOccupation(e.target.value)} />
              </div>
            </section>

            {/* Spouse Info (Binalik ko na) */}
            <section className="space-y-4">
              <h3 className="font-bold text-slate-700">Spouse Info</h3>
              <div className="flex flex-col tablet:flex-row gap-4">
                <FloatingInput
                id="spouseFirst"
                label="First name"
                value={spouseFirst} 
                onChange={(e) =>setSpouseFirst(e.target.value)} 
                 />
                <FloatingInput
                id="spouseMiddle"
                label="Middle name"
                value={spouseMiddle} 
                onChange={(e) =>setSpouseMiddle(e.target.value)} />
                <FloatingInput
                id="spouseLast"
                label="Last name"
                value={spouseLast} 
                onChange={(e) =>setSpouseLast(e.target.value)}
                 />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FloatingInput
                id="spouseContact"
                label="Contact" 
                value={spouseContact} 
                onChange={(e) =>setSpouseContact(e.target.value)} />
               
                <FloatingInput
                id="spouseOccupation"
                label="Occupation"
                value={spouseOccupation} 
                onChange={(e) =>setSpouseOccupation(e.target.value)} />
              </div>
            </section>

            {/* Address */}
            <div className="flex flex-col gap-2">
            <h3 className="font-bold text-slate-700">Full address</h3>
<AddressPicker
  purok={purok}
  setPurok={setPurok}
  province={province}
  setProvince={setProvince}
  city={city}
  setCity={setCity}
  barangay={barangay}
  setBarangay={setBarangay}
  onChange={({purok, barangay, city, province}) => {
    setPurok(purok);
    setBarangay(barangay);
    setCity(city);
    setProvince(province);
  }}
/>
           </div>
            <button onClick={handleSave} className="w-full bg-black text-white py-2 rounded-full font-bold shadow-lg transition-all active:scale-[0.98]">
              Save Profile
            </button>
          </div>
        </div>

        {/* Sidebar Status */}
      
      </div>
      <div className=" w-[20rem] hidden tablet:block">
          <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 sticky top-10 text-center">
            <h3 className="font-bold text-slate-800 mb-8">Completion Status</h3>
            <div className="flex justify-center items-center relative mb-10">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle cx="64" cy="64" r="40" stroke="#f1f5f9" strokeWidth="8" fill="transparent" />
                <circle cx="64" cy="64" r="40" stroke="#22c55e" strokeWidth="8" fill="transparent"
                  strokeDasharray="251" strokeDashoffset={strokeDashoffset} strokeLinecap="round"
                  className="transition-all duration-700 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-slate-800">{progress}%</span>
              </div>
            </div>
            <div className="space-y-3">
               <StatusCheck label="Personal Info" done={!!(parentFirst && parentLast && contact && occupation)} />
               <StatusCheck label="Spouse Info" done={!!(spouseFirst && spouseLast && spouseContact && spouseOccupation)} />
               <StatusCheck label="Profile Photo" done={profilePicture !== profilePlaceholder && !String(profilePicture).includes('default.png')} />
               <StatusCheck label="Location" done={!!(barangay && city && province && purok)} />
            </div>
          </div>
        </div>
      </div>  
  
    </div>
  );
};

// Reusable Input
const InputBox = ({ placeholder, value, onChange, bgColor = "bg-gray-50" }) => (
  <input 
    className={`${bgColor} border-none p-4 rounded-2xl text-sm w-full focus:ring-2 ring-blue-100 outline-none transition-all`} 
    placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} 
  />
);

const StatusCheck = ({ label, done }) => (
  <div className={`flex items-center justify-between p-3 rounded-xl transition-all ${done ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-400'}`}>
    <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
    <span className="text-lg">{done ? '✓' : '○'}</span>
  </div>
);

export default CompleteProfile;