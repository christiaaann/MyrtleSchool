import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../../services/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import profilePlaceholder from '../../assets/default.png';

import FloatingInput from "../../components/FloatingInput";
import AddressPicker from "../../components/AddressPicker";
import CompleteSkeleton from "../../components/Skeleton/CompleteSkeleton";

const CompleteProfile = () => {
  const navigate = useNavigate();
  
  const [role, setRole] = useState("mother");
  const [branch, setBranch] = useState(""); 
  
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyRelation, setEmergencyRelation] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  
  // --- STATES ---
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
  
  const [noSpouse, setNoSpouse] = useState(null);
  
  // validation
  const [errors, setErrors] = useState({});
  const validateProfile = () => {
    const newErrors = {};

    if (!branch) newErrors.branch = "Please select a school branch.";

    if (!parentFirst.trim()) newErrors.parentFirst = "First name is required.";
    if (!parentLast.trim()) newErrors.parentLast = "Last name is required.";
    if (!contact.trim()) newErrors.contact = "Contact is required.";
    if (!occupation.trim()) newErrors.occupation = "Occupation is required.";

    if (!noSpouse) {
      if (!spouseFirst.trim()) newErrors.spouseFirst = "First name is required.";
      if (!spouseLast.trim()) newErrors.spouseLast = "Last name is required.";
      if (!spouseContact.trim()) newErrors.spouseContact = "Contact is required";
      if (!spouseOccupation.trim()) newErrors.spouseOccupation = "Occupation is required.";
    }

    if (!barangay.trim()) newErrors.barangay = "Barangay is required.";
    if (!city.trim()) newErrors.city = "City is required.";
    if (!province.trim()) newErrors.province = "Province is required.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // --- PROGRESS CALCULATION ---
  const calculateProgress = () => {
    let completedFields = 0;
    const totalFields = 9; 

    if (branch) completedFields++; 
    if (parentFirst && parentLast) completedFields++;
    if (contact) completedFields++;
    if (occupation) completedFields++;
    if (emergencyName && emergencyContact) completedFields++;
    if (noSpouse || (spouseFirst && spouseLast)) completedFields++;
    if (noSpouse || spouseOccupation) completedFields++;
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
      }
    } catch (error) {
      console.error("Upload Error:", error);
      alert("Failed to upload image.");
    } finally {
      setIsUploading(false);
    }
  };

  // --- DATA FETCHING (AUTH & FIRESTORE) ---
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (role === "mother") setEmergencyRelation("Mother");
    else if (role === "father") setEmergencyRelation("Father");
    else if (role === "guardian") setEmergencyRelation("");
  }, [role]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUid(user.uid);

        const cleanURL = (url) => url ? url.replace("http://", "https://") : null;
        if (user.photoURL) setProfilePicture(cleanURL(user.photoURL));

        try {
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const data = docSnap.data();
            
            setBranch(data.branch || ""); 
            setNoSpouse(data.noSpouse || false);

            const finalPhoto = (data.profilePicture && data.profilePicture.trim() !== "") 
                               ? data.profilePicture 
                               : cleanURL(user.photoURL);
            setProfilePicture(finalPhoto || profilePlaceholder);

            // AUTO-COMPLETE PARENT & GUARDIAN NAME
            const defaultFirst = data.parent?.firstname || user.displayName?.split(" ")[0] || "";
            const defaultLast = data.parent?.lastname || user.displayName?.split(" ").slice(1).join(" ") || "";
            
            setParentFirst(defaultFirst);
            setParentMiddle(data.parent?.middlename || "");
            setParentLast(defaultLast);
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

            setRole(data.role || "mother");
            
            // AUTO-COMPLETE EMERGENCY CONTACT WITH ACCOUNT OWNER
            setEmergencyName(data.emergency?.name || `${defaultFirst} ${defaultLast}`.trim());
            setEmergencyRelation(data.emergency?.relation || "");
            setEmergencyContact(data.emergency?.contact || "");
          }
        } catch (err) {
          console.error("Error fetching data:", err);
        }
      }
      setTimeout(() => {
        setLoading(false);
      }, 1000);
    });

    return () => unsubscribe();
  }, []);

  // --- SAVE FUNCTION ---
  const handleSave = async () => {
    if (!validateProfile()) {
      alert("Please complete the required fields!");
      return;
    }
    
    try {
      await updateDoc(doc(db, "users", uid), {
        role: role,
        branch: branch,
        parent: { 
          firstname: parentFirst, 
          middlename: parentMiddle, 
          lastname: parentLast, 
          contact, 
          occupation 
        },
        spouse: noSpouse ? null : {
          firstname: spouseFirst,
          middlename: spouseMiddle,
          lastname: spouseLast,
          contact: spouseContact,
          occupation: spouseOccupation
        },
        emergency: {
          name: emergencyName,
          relation: emergencyRelation,
          contact: emergencyContact
        },
        noSpouse: noSpouse,
        address: { purok, barangay, city, province },
        profilePicture: profilePicture, 
        isProfileComplete: true
      });
      navigate("/Enrollment", { replace: true });
    } catch (error) {
      console.error(error);
      alert("Error saving profile");
    }
  };

  if (loading) return <CompleteSkeleton />;

  return (
    <div className="min-h-screen p-4 font-sans text-slate-900">
      <div className="max-w-6xl flex mx-auto gap-8">
        <div className=" w-full">
        <div className="lg:col-span-8 w-full p-8">
          <h2 className="text-2xl font-bold mb-8">Complete Profile</h2>

          {/* Profile Picture Section */}
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

            {/* Mobile Progress */}
            <div className="flex mt-2 flex-col gap-2 tablet:hidden">
             <StatusCheck label="Branch Selection" done={!!branch} />
             <StatusCheck label="Profile Photo" done={profilePicture !== profilePlaceholder && !String(profilePicture).includes('default.png')} />
             <StatusCheck label="Personal Info" done={!!(parentFirst && parentLast && contact && occupation)} />
             {!noSpouse && (
               <StatusCheck label="Spouse Info" done={!!(spouseFirst && spouseLast && spouseContact && spouseOccupation)} />
             )}
             <StatusCheck label="Location" done={!!(barangay && city && province && purok)} />
            </div>
          </div>

          <div className="space-y-8">

            {/* --- Branch Selection --- */}
            <section className="bg-blue-50 border border-blue-200 p-6 rounded-2xl">
              <h3 className="font-black text-[#2D5B60] uppercase tracking-widest text-xs mb-3">Preferred School Branch</h3>
              <p className="text-xs text-gray-500 mb-4">Select the branch where you intend to enroll your child.</p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => setBranch("Irosin")}
                  className={`flex-1 py-4 border-2 rounded-xl text-sm font-black uppercase tracking-widest transition-all ${branch === "Irosin" ? "border-[#2D5B60] bg-[#2D5B60] text-white shadow-md" : "border-gray-200 text-gray-500 bg-white hover:border-[#2D5B60]/50"}`}
                >
                  📍 Irosin Branch
                </button>
                <button
                  onClick={() => setBranch("Matnog")}
                  className={`flex-1 py-4 border-2 rounded-xl text-sm font-black uppercase tracking-widest transition-all ${branch === "Matnog" ? "border-[#2D5B60] bg-[#2D5B60] text-white shadow-md" : "border-gray-200 text-gray-500 bg-white hover:border-[#2D5B60]/50"}`}
                >
                  📍 Matnog Branch
                </button>
              </div>
              {errors.branch && <p className="text-red-500 text-xs font-bold mt-2">{errors.branch}</p>}
            </section>

            {/* Parent Info */}
            <section className="space-y-4">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-6">
                <span className="text-sm font-black text-slate-700 uppercase tracking-widest">Form Filler:</span>
                <div className="flex bg-gray-100 p-1 rounded-lg">
                  {["mother", "father", "guardian"].map((item) => (
                    <button
                      key={item}
                      onClick={() => setRole(item)}
                      className={`px-4 py-2 rounded-md text-xs font-black uppercase tracking-wider transition ${role === item ? "bg-white text-[#2D5B60] shadow-sm" : "text-gray-500 hover:bg-gray-200"}`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <h3 className="font-bold text-slate-700 border-b pb-2">Personal Info ({role.charAt(0).toUpperCase() + role.slice(1)})</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col w-full">
                  <FloatingInput 
                    id="parentFirst" label="First name" required
                    value={parentFirst} onChange={(e) => setParentFirst(e.target.value)}
                  />
                  {errors.parentFirst && <p className="text-red-500 text-xs mt-1">{errors.parentFirst}</p>}
                </div>
                <div className="flex flex-col w-full">
                  <FloatingInput
                    id="parentMiddle" label="Middle name"
                    value={parentMiddle} onChange={(e) =>setParentMiddle(e.target.value)}
                  />
                </div>
                <div className="flex flex-col w-full">
                  <FloatingInput
                    id="parentLast" label="Last name" required
                    value={parentLast} onChange={(e) => setParentLast(e.target.value)}
                  />
                  {errors.parentLast && <p className="text-red-500 text-xs mt-1">{errors.parentLast}</p>}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <FloatingInput
                    id="contact" label="Contact" required
                    value={contact} onChange={(e) => setContact(e.target.value)}
                  />
                  {errors.contact && <p className="text-red-500 text-xs mt-1">{errors.contact}</p>}
                </div>
                <div>
                  <FloatingInput
                    id="occupation" label="Occupation"
                    value={occupation} onChange={(e) =>setOccupation(e.target.value)} 
                  />
                  {errors.occupation && <p className="text-red-500 text-xs mt-1">{errors.occupation}</p>}
                </div>
              </div>
            </section>

            <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
              <span className="text-sm font-black text-slate-700 uppercase tracking-widest">Have a spouse?</span>
              <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-gray-200">
                <button
                  onClick={() => setNoSpouse(false)}
                  className={`px-4 py-1 rounded-md text-xs font-black uppercase transition-colors ${!noSpouse ? "bg-green-100 text-green-700" : "text-gray-500 hover:bg-gray-50"}`}
                >
                  Yes
                </button>
                <button
                  onClick={() => setNoSpouse(true)}
                  className={`px-4 py-1 rounded-md text-xs font-black uppercase transition-colors ${noSpouse ? "bg-gray-200 text-gray-700" : "text-gray-500 hover:bg-gray-50"}`}
                >
                  No
                </button>
              </div>
            </div>

            {/* Spouse Info */}
            {!noSpouse && (
            <section className="space-y-4 animate-in fade-in slide-in-from-top-2">
              <h3 className="font-bold text-slate-700 border-b pb-2">Spouse Info</h3>
              <div className="flex flex-col tablet:flex-row gap-4">
                <div className="flex flex-col w-full">
                  <FloatingInput
                    id="spouseFirst" label="First name"
                    value={spouseFirst} onChange={(e) =>setSpouseFirst(e.target.value)} 
                  />
                  {errors.spouseFirst && <p className="text-xs text-red-500 mt-1">{errors.spouseFirst}</p>}
                </div>
                <div className="w-full">
                  <FloatingInput
                    id="spouseMiddle" label="Middle name"
                    value={spouseMiddle} onChange={(e) =>setSpouseMiddle(e.target.value)} 
                  />
                </div>
                <div className="flex flex-col w-full">
                  <FloatingInput
                    id="spouseLast" label="Last name"
                    value={spouseLast} onChange={(e) =>setSpouseLast(e.target.value)}
                  />
                  {errors.spouseLast && <p className="text-red-500 text-xs mt-1">{errors.spouseLast}</p>} 
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <FloatingInput
                    id="spouseContact" label="Contact" 
                    value={spouseContact} onChange={(e) =>setSpouseContact(e.target.value)} 
                  />
                  {errors.spouseContact && <p className="text-xs text-red-500 mt-1">{errors.spouseContact}</p>}
                </div>
                <div>
                  <FloatingInput
                    id="spouseOccupation" label="Occupation"
                    value={spouseOccupation} onChange={(e) =>setSpouseOccupation(e.target.value)} 
                  />
                  {errors.spouseOccupation && <p className="text-red-500 text-xs mt-1">{errors.spouseOccupation}</p>}
                </div>
              </div>
            </section>
            )}

            <section className="space-y-4">
              <h3 className="font-bold text-slate-700 border-b pb-2">Emergency Contact</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <FloatingInput
                    label="Full Name"
                    value={emergencyName} onChange={(e) => setEmergencyName(e.target.value)}
                  />
                  {errors.emergencyName && <p className="text-red-500 text-xs mt-1">{errors.emergencyName}</p>}
                </div>
                <FloatingInput
                  label="Relation (e.g. Sister, Uncle)"
                  value={emergencyRelation} onChange={(e) => setEmergencyRelation(e.target.value)}
                />
              </div>
              <div className="flex flex-col">
                <FloatingInput
                  label="Contact Number"
                  value={emergencyContact} onChange={(e) => setEmergencyContact(e.target.value)}
                />
                {errors.emergencyContact && <p className="text-red-500 text-xs mt-1">{errors.emergencyContact}</p>}
              </div>
            </section>

            {/* FIXED Address Picker Integration */}
            <div className="flex flex-col gap-2">
              <h3 className="font-bold text-slate-700 border-b pb-2">Full address</h3>
              <AddressPicker
                value={[purok, barangay, city, province].filter(Boolean).join(", ")}
                onChange={({purok, barangay, city, province}) => {
                  setPurok(purok || ""); 
                  setBarangay(barangay || ""); 
                  setCity(city || ""); 
                  setProvince(province || "");
                }}
              />
              {errors.barangay && <p className="text-red-500 text-xs">Barangay is required.</p>}
              {errors.city && <p className="text-red-500 text-xs">City is required.</p>}
              {errors.province && <p className="text-red-500 text-xs">Province is required.</p>}
            </div>

            <div className="pt-6 border-t border-gray-100">
              <button onClick={handleSave} className="w-full bg-[#2D5B60] text-white py-4 rounded-xl font-black uppercase tracking-widest shadow-md hover:bg-black transition-colors">
                Save & Proceed to Enrollment
              </button>
            </div>
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
               <StatusCheck label="Branch Selection" done={!!branch} />
               <StatusCheck label="Personal Info" done={!!(parentFirst && parentLast && contact && occupation)} />
               {!noSpouse && (
                 <StatusCheck label="Spouse Info" done={!!(spouseFirst && spouseLast && spouseContact && spouseOccupation)} />
               )}
               <StatusCheck label="Profile Photo" done={profilePicture !== profilePlaceholder && !String(profilePicture).includes('default.png')} />
               <StatusCheck label="Location" done={!!(barangay && city && province)} />
            </div>
          </div>
        </div>
      </div>  
    </div>
  );
};

const StatusCheck = ({ label, done }) => (
  <div className={`flex items-center justify-between p-3 rounded-xl transition-all ${done ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-400'}`}>
    <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
    <span className="text-lg font-black">{done ? '✓' : '○'}</span>
  </div>
);

export default CompleteProfile;