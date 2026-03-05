import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../../services/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

const CompleteProfile = () => {
  const navigate = useNavigate();
  const uid = auth.currentUser?.uid;

  // Parent state
  const [parentFirst, setParentFirst] = useState("");
  const [parentMiddle, setParentMiddle] = useState("");
  const [parentLast, setParentLast] = useState("");
  const [contact, setContact] = useState("");
  const [occupation, setOccupation] = useState("");
  const [profilePicture, setProfilePicture] = useState("");

  // Spouse state
  const [spouseFirst, setSpouseFirst] = useState("");
  const [spouseMiddle, setSpouseMiddle] = useState("");
  const [spouseLast, setSpouseLast] = useState("");
  const [spouseContact, setSpouseContact] = useState("");
  const [spouseOccupation, setSpouseOccupation] = useState("");

  // Address state
  const [purok, setPurok] = useState("");
  const [barangay, setBarangay] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");

  // Fetch existing data on mount
  useEffect(() => {
    const fetchUserData = async () => {
      if (!uid) return;

      try {
        const docRef = doc(db, "users", uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();

          // Parent
          setProfilePicture(data.profilePicture || auth.currentUser?.photoURL || "");
          setParentFirst(data.parent?.firstname || "");
          setParentMiddle(data.parent?.middlename || "");
          setParentLast(data.parent?.lastname || "");
          setContact(data.parent?.contact || "");
          setOccupation(data.parent?.occupation || "");

          // Spouse
          setSpouseFirst(data.spouse?.firstname || "");
          setSpouseMiddle(data.spouse?.middlename || "");
          setSpouseLast(data.spouse?.lastname || "");
          setSpouseContact(data.spouse?.contact || "");
          setSpouseOccupation(data.spouse?.occupation || "");

          // Address
          setPurok(data.address?.purok || "");
          setBarangay(data.address?.barangay || "");
          setCity(data.address?.city || "");
          setProvince(data.address?.province || "");
        }
      } catch (error) {
        console.log("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, [uid]);

  const handleSave = async () => {
    if (!uid) return;

    try {
      await updateDoc(doc(db, "users", uid), {
        parent: {
          firstname: parentFirst,
          middlename: parentMiddle,
          lastname: parentLast,
          contact,
          occupation,
        },
        spouse: {
          firstname: spouseFirst,
          middlename: spouseMiddle,
          lastname: spouseLast,
          contact: spouseContact,
          occupation: spouseOccupation,
        },
        address: {
          purok,
          barangay,
          city,
          province,
        },
      });

      alert("Profile Completed!");
      navigate("/Enrollment");
    } catch (error) {
      console.log(error);
      alert("Error saving profile");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-10">
      <div className="bg-white p-10 rounded-2xl shadow w-full max-w-3xl space-y-6">
        <h2 className="text-2xl font-bold text-center">Complete Your Profile</h2>

        {/* Parent Info */}
        <div>
          <h3 className="font-bold mb-2">Parent Information</h3>
          <img
    src={profilePicture}
    alt="Profile"
    className="w-24 h-24 rounded-full border object-cover"
  />
          <div className="grid grid-cols-3 gap-3">
            <input
              className="border p-3 rounded"
              placeholder="First Name"
              value={parentFirst}
              onChange={(e) => setParentFirst(e.target.value)}
            />
            <input
              className="border p-3 rounded"
              placeholder="Middle Name"
              value={parentMiddle}
              onChange={(e) => setParentMiddle(e.target.value)}
            />
            <input
              className="border p-3 rounded"
              placeholder="Last Name"
              value={parentLast}
              onChange={(e) => setParentLast(e.target.value)}
            />
          </div>
          <input
            className="border p-3 rounded w-full mt-3"
            placeholder="Contact Number"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
          />
          <input
            className="border p-3 rounded w-full mt-3"
            placeholder="Occupation"
            value={occupation}
            onChange={(e) => setOccupation(e.target.value)}
          />
        </div>

        {/* Spouse Info */}
        <div>
          <h3 className="font-bold mb-2">Spouse Information</h3>
          <div className="grid grid-cols-3 gap-3">
            <input
              className="border p-3 rounded"
              placeholder="First Name"
              value={spouseFirst}
              onChange={(e) => setSpouseFirst(e.target.value)}
            />
            <input
              className="border p-3 rounded"
              placeholder="Middle Name"
              value={spouseMiddle}
              onChange={(e) => setSpouseMiddle(e.target.value)}
            />
            <input
              className="border p-3 rounded"
              placeholder="Last Name"
              value={spouseLast}
              onChange={(e) => setSpouseLast(e.target.value)}
            />
          </div>
          <input
            className="border p-3 rounded w-full mt-3"
            placeholder="Contact Number"
            value={spouseContact}
            onChange={(e) => setSpouseContact(e.target.value)}
          />
          <input
            className="border p-3 rounded w-full mt-3"
            placeholder="Occupation"
            value={spouseOccupation}
            onChange={(e) => setSpouseOccupation(e.target.value)}
          />
        </div>

        {/* Address Info */}
        <div>
          <h3 className="font-bold mb-2">Address</h3>
          <input
            className="border p-3 rounded w-full mb-3"
            placeholder="Purok"
            value={purok}
            onChange={(e) => setPurok(e.target.value)}
          />
          <input
            className="border p-3 rounded w-full mb-3"
            placeholder="Barangay"
            value={barangay}
            onChange={(e) => setBarangay(e.target.value)}
          />
          <input
            className="border p-3 rounded w-full mb-3"
            placeholder="City"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
          <input
            className="border p-3 rounded w-full"
            placeholder="Province"
            value={province}
            onChange={(e) => setProvince(e.target.value)}
          />
        </div>

        <button
          onClick={handleSave}
          className="w-full bg-orange-500 text-white p-3 rounded font-bold hover:bg-orange-600"
        >
          Save Profile
        </button>
      </div>
    </div>
  );
};

export default CompleteProfile;