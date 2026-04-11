import React, { useState, useEffect } from "react";

const AddressPicker = ({ onChange }) => {
  // Lists for dropdowns
  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);
  const [barangays, setBarangays] = useState([]);

  // Selected Values
  const [selectedProv, setSelectedProv] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedBrgy, setSelectedBrgy] = useState("");
  const [purok, setPurok] = useState("");

  // 1. Fetch Provinces on mount
  useEffect(() => {
    fetch("https://psgc.gitlab.io/api/provinces/")
      .then((res) => res.json())
      .then((data) => {
        // Sort alphabetically
        const sorted = data.sort((a, b) => a.name.localeCompare(b.name));
        setProvinces(sorted);
      })
      .catch((err) => console.error("Error fetching provinces:", err));
  }, []);

  // 2. Fetch Cities when Province is selected
  useEffect(() => {
    if (!selectedProv) {
      setCities([]);
      return;
    }
    const provCode = provinces.find((p) => p.name === selectedProv)?.code;
    if (provCode) {
      fetch(`https://psgc.gitlab.io/api/provinces/${provCode}/cities-municipalities/`)
        .then((res) => res.json())
        .then((data) => {
          const sorted = data.sort((a, b) => a.name.localeCompare(b.name));
          setCities(sorted);
        });
    }
  }, [selectedProv, provinces]);

  // 3. Fetch Barangays when City is selected
  useEffect(() => {
    if (!selectedCity) {
      setBarangays([]);
      return;
    }
    const cityCode = cities.find((c) => c.name === selectedCity)?.code;
    if (cityCode) {
      fetch(`https://psgc.gitlab.io/api/cities-municipalities/${cityCode}/barangays/`)
        .then((res) => res.json())
        .then((data) => {
          const sorted = data.sort((a, b) => a.name.localeCompare(b.name));
          setBarangays(sorted);
        });
    }
  }, [selectedCity, cities]);

  // 4. Send the data back to CompleteProfile.jsx whenever anything changes
  useEffect(() => {
    if (onChange) {
      onChange({
        province: selectedProv,
        city: selectedCity,
        barangay: selectedBrgy,
        purok: purok,
      });
    }
  }, [selectedProv, selectedCity, selectedBrgy, purok, onChange]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Province Dropdown */}
      <div className="flex flex-col">
        <label className="text-[10px] font-black text-gray-400 uppercase ml-1 mb-1">Province</label>
        <select
          value={selectedProv}
          onChange={(e) => {
            setSelectedProv(e.target.value);
            setSelectedCity(""); // Reset City and Brgy if Province changes
            setSelectedBrgy("");
          }}
          className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#2D5B60] focus:bg-white text-sm font-bold text-gray-700 transition-all cursor-pointer"
        >
          <option value="" disabled hidden>Select Province</option>
          {provinces.map((p) => (
            <option key={p.code} value={p.name}>{p.name}</option>
          ))}
        </select>
      </div>

      {/* City Dropdown */}
      <div className="flex flex-col">
        <label className="text-[10px] font-black text-gray-400 uppercase ml-1 mb-1">City / Municipality</label>
        <select
          value={selectedCity}
          onChange={(e) => {
            setSelectedCity(e.target.value);
            setSelectedBrgy(""); // Reset Brgy if City changes
          }}
          disabled={!selectedProv}
          className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#2D5B60] focus:bg-white text-sm font-bold text-gray-700 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="" disabled hidden>Select City</option>
          {cities.map((c) => (
            <option key={c.code} value={c.name}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Barangay Dropdown */}
      <div className="flex flex-col">
        <label className="text-[10px] font-black text-gray-400 uppercase ml-1 mb-1">Barangay</label>
        <select
          value={selectedBrgy}
          onChange={(e) => setSelectedBrgy(e.target.value)}
          disabled={!selectedCity}
          className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#2D5B60] focus:bg-white text-sm font-bold text-gray-700 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="" disabled hidden>Select Barangay</option>
          {barangays.map((b) => (
            <option key={b.code} value={b.name}>{b.name}</option>
          ))}
        </select>
      </div>

      {/* Purok / Street Input */}
      <div className="flex flex-col">
        <label className="text-[10px] font-black text-gray-400 uppercase ml-1 mb-1">Street / Purok / House No.</label>
        <input
          type="text"
          value={purok}
          onChange={(e) => setPurok(e.target.value)}
          placeholder="e.g. Purok 1, Block 2"
          className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#2D5B60] focus:bg-white text-sm font-bold text-gray-700 transition-all"
        />
      </div>
    </div>
  );
};

export default AddressPicker;