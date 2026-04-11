import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../../services/firebase";
import { User, MapPin, Heart, Users as UsersIcon, Save, Loader2, Camera, SmartphoneNfc, MapPinHouse } from "lucide-react";
import defaultPic from "../../assets/default.png"; // <-- Added fallback image import

const Profile = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imgLoading, setImgLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [profilePicture, setProfilePicture] = useState("");

  //  Form Details
  const [form, setForm] = useState({
    firstname: "", middlename: "", lastname: "", occupation: "", contact: "",
    purok: "", barangay: "", city: "", province: "",
    emergencyName: "", emergencyContact: "", relation: "",
    spouseFirstname: "", spouseLastname: "", spouseOccupation: "", spouseContact: ""
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const uid = auth.currentUser.uid;
        const snap = await getDoc(doc(db, "users", uid));

        if (snap.exists()) {
          const data = snap.data();
          const parent = data.parent || {};
          const address = data.address || {};
          const emergency = data.emergency || {};
          const spouse = data.spouse || {};

          setEmail(data.email || "");
          setProfilePicture(parent.profilePicture || data.profilePicture || "");
          
          setForm({
            firstname: parent.firstname || "",
            middlename: parent.middlename || "",
            lastname: parent.lastname || "",
            occupation: parent.occupation || "",
            contact: parent.contact || "",
            purok: address.purok || "",
            barangay: address.barangay || "",
            city: address.city || "",
            province: address.province || "",
            emergencyName: emergency.name || "",
            emergencyContact: emergency.contact || "",
            relation: emergency.relation || "",
            spouseFirstname: spouse.firstname || "",
            spouseLastname: spouse.lastname || "",
            spouseOccupation: spouse.occupation || "",
            spouseContact: spouse.contact || ""
          });
        }
      } catch (err) { console.error(err); }
      setLoading(false);
    };
    fetchUser();
  }, []);

  // --- ACTION 1: PHOTO UPDATE (INSTANT) ---
  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImgLoading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64Image = reader.result;
        const uid = auth.currentUser.uid;
        await updateDoc(doc(db, "users", uid), { "parent.profilePicture": base64Image, "profilePicture": base64Image });
        setProfilePicture(base64Image);
        alert("Photo updated!");
      } catch (err) {
        alert("Photo update failed");
      } finally {
        setImgLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // --- ACTION 2: DETAILS UPDATE (SAVE BUTTON) ---
  const handleSaveDetails = async () => {
    setSaving(true);
    try {
      const uid = auth.currentUser.uid;
      await updateDoc(doc(db, "users", uid), {
        "parent.firstname": form.firstname,
        "parent.middlename": form.middlename,
        "parent.lastname": form.lastname,
        "parent.occupation": form.occupation,
        "parent.contact": form.contact,
        "address.purok": form.purok,
        "address.barangay": form.barangay,
        "address.city": form.city,
        "address.province": form.province,
        "emergency.name": form.emergencyName,
        "emergency.contact": form.emergencyContact,
        "emergency.relation": form.relation,
        "spouse.firstname": form.spouseFirstname,
        "spouse.lastname": form.spouseLastname,
        "spouse.occupation": form.spouseOccupation,
        "spouse.contact": form.spouseContact,
      });
      alert("Details updated!");
    } catch (err) {
      alert("Error updating details");
    }
    setSaving(false);
  };

  if (loading) return <div className="p-10 text-center font-bold text-gray-500">Loading Profile...</div>;

  // STRICT IMAGE FALLBACK LOGIC
  const avatar = profilePicture && profilePicture.trim() !== "" ? profilePicture : defaultPic;

  return (
    <div className="max-w-6xl relative mx-auto p-6 space-y-6">
        <Link to="/enrollment" className="font-bold text-gray-500 hover:text-black">← Back to Portal</Link>
      {/* HEADER */}
      <div className="flex justify-between items-center border-b pb-6">
        <div>
          <h1 className="text-2xl font-bold">User Profile</h1>
          <p className="text-sm text-gray-500">Manage your personal information</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* LEFT: PHOTO SECTION (INSTANT UPDATE) */}
        <div className="absolute top-0 right-1 rounded-xl p-6 flex gap-3 flex-co items-center h-fit">
          <div className="relative group">
            <img 
              src={avatar} 
              alt="profile" 
              referrerPolicy="no-referrer"
              crossOrigin="anonymous"
              onError={(e) => { e.target.src = defaultPic; }} // INSTANT FIX FOR BROKEN IMAGES
              className={`w-20 h-20 rounded-full object-cover border-2 ${imgLoading ? "opacity-30" : "opacity-100"}`} 
            />
            {imgLoading && <div className="absolute inset-0 flex items-center justify-center"><Loader2 className="animate-spin" size={20} /></div>}
          </div>
         <div className="flex flex-col">
          <h2 className="mt-3 font-bold text-lg">{form.firstname} {form.lastname}</h2>
          <p className="text-sm text-gray-500">{email}</p>

          <label className="mt-4 flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-bold cursor-pointer transition-all">
            <Camera size={14} /> {imgLoading ? "Uploading..." : "Change Photo"}
            <input type="file" className="hidden" accept="image/*" onChange={handlePhotoChange} disabled={imgLoading} />
          </label>
          </div>
        </div>

        {/* RIGHT: DETAILS FORM */}
        <div className="md:col-span-2 space-y-6">
          
          <Section title="Personal Information" icon={User}>
            <div className="grid grid-cols-2 gap-3">
              <Input label="First Name" value={form.firstname} onChange={e => setForm({...form, firstname: e.target.value})} />
              <Input label="Middle Name" value={form.middlename} onChange={e => setForm({...form, middlename: e.target.value})} />
              <Input label="Last Name" value={form.lastname} onChange={e => setForm({...form, lastname: e.target.value})} />
              <Input label="Occupation" value={form.occupation} onChange={e => setForm({...form, occupation: e.target.value})} />
              <div className="col-span-2">
                <Input label="Contact" value={form.contact} onChange={e => setForm({...form, contact: e.target.value})} />
              </div>
            </div>
          </Section>

          <Section title="Address" icon={MapPinHouse}>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Purok" value={form.purok} onChange={e => setForm({...form, purok: e.target.value})} />
              <Input label="Barangay" value={form.barangay} onChange={e => setForm({...form, barangay: e.target.value})} />
              <Input label="City" value={form.city} onChange={e => setForm({...form, city: e.target.value})} />
              <Input label="Province" value={form.province} onChange={e => setForm({...form, province: e.target.value})} />
            </div>
          </Section>

          <Section title="Emergency Contact" icon={SmartphoneNfc}>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Name" value={form.emergencyName} onChange={e => setForm({...form, emergencyName: e.target.value})} />
              <Input label="Contact" value={form.emergencyContact} onChange={e => setForm({...form, emergencyContact: e.target.value})} />
              <Input label="Relation" value={form.relation} onChange={e => setForm({...form, relation: e.target.value})} />
            </div>
          </Section>

          <Section title="Spouse" icon={UsersIcon}>
            <div className="grid grid-cols-2 gap-3">
              <Input label="First Name" value={form.spouseFirstname} onChange={e => setForm({...form, spouseFirstname: e.target.value})} />
              <Input label="Last Name" value={form.spouseLastname} onChange={e => setForm({...form, spouseLastname: e.target.value})} />
              <Input label="Occupation" value={form.spouseOccupation} onChange={e => setForm({...form, spouseOccupation: e.target.value})} />
              <Input label="Contact" value={form.spouseContact} onChange={e => setForm({...form, spouseContact: e.target.value})} />
            </div>
          </Section>

          <div className="flex justify-end pt-4">
            <button
              onClick={handleSaveDetails}
              disabled={saving}
              className="flex items-center gap-2 px-8 py-3 text-sm bg-[#2D5B60] hover:bg-black text-white rounded-xl font-bold transition-all shadow-md active:scale-95 disabled:opacity-50"
            >
              {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              {saving ? "Saving Details..." : "Save Details"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

const Section = ({ title, icon: Icon, children }) => (
  <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
    <div className="flex items-center gap-2 p-4 border-b bg-gray-50/80">
      <Icon size={18} className="text-[#2D5B60]"/>
      <h2 className="font-bold text-[11px] tracking-widest uppercase text-gray-700">{title}</h2>
    </div>
    <div className="p-5">{children}</div>
  </div>
);

const Input = ({ label, ...props }) => (
  <div>
    <label className="text-[10px] text-gray-400 uppercase font-black ml-1 mb-1 block">{label}</label>
    <input {...props} className="w-full border border-gray-200 bg-gray-50 px-3 py-2.5 rounded-lg text-sm font-bold text-gray-800 focus:border-[#2D5B60] focus:bg-white outline-none transition-all" />
  </div>
);

export default Profile;