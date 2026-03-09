import React, { useState, useEffect } from "react";
import FloatingInput from "./FloatingInput";

const AddressPicker = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState("province");

  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);
  const [barangays, setBarangays] = useState([]);

  const [province, setProvince] = useState(null);
  const [city, setCity] = useState(null);
  const [barangay, setBarangay] = useState(null);
  const [purok, setPurok] = useState("");

  const [displayAddress, setDisplayAddress] = useState(value || "");

  useEffect(() => {
    fetch("https://psgc.gitlab.io/api/provinces/")
      .then(r => r.json())
      .then(setProvinces);
  }, []);

  useEffect(() => {
    if (!province) return;
    fetch("https://psgc.gitlab.io/api/cities-municipalities/")
      .then(r => r.json())
      .then(data => {
        setCities(data.filter(c => c.provinceCode === province.code));
      });
  }, [province]);

  useEffect(() => {
    if (!city) return;
    fetch(`https://psgc.gitlab.io/api/cities-municipalities/${city.code}/barangays/`)
      .then(r => r.json())
      .then(setBarangays);
  }, [city]);

const confirmAddress = () => {
  if (!province || !city || !barangay) {
    alert("Please complete your address");
    return;
  }

  const full = (purok ? purok + ", " : "") + barangay.name + ", " + city.name + ", " + province.name;

  setDisplayAddress(full);

  // Send to parent
  if (onChange) {
    onChange({
      purok,
      barangay: barangay.name,
      city: city.name,
      province: province.name,
    });
  }

  setOpen(false);
  setStep("province");
};
  const preview =
    (purok ? purok + ", " : "") +
    (barangay?.name || "") +
    (city ? ", " + city.name : "") +
    (province ? ", " + province.name : "");

  return (
    <>
      {/* Input */}
      <FloatingInput
        id="displayAddress"
        label="Full address"
        type="text"
        value={displayAddress}
        readOnly
        onClick={() => setOpen(true)}
      />

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

          <div className="bg-white w-[420px] max-h-[80vh] rounded-xl p-4 overflow-y-auto">
         
            <div className="flex justify-between mb-3">
              <h3 className="font-bold text-lg">Select Address</h3>
              <button onClick={() => setOpen(false)}>✕</button>
            </div>
            
            {/* Preview Address */}
         {preview && (
         <div className="mb-4 p-2 bg-gray-100 flex flex-col rounded text-lg">
         {purok && <span>Purok {purok},</span>}
         {barangay?.name && <span>{barangay.name},</span>}
         {city?.name && <span>{city.name},</span>}
         {province?.name && <span>{province.name},</span>}
         </div>
         )}
            {step === "province" && (
              <>
                <p className="font-semibold mb-2">Province</p>
                {provinces.map(p => (
                  <div
                    key={p.code}
                    onClick={() => {
                      setProvince(p);
                      setStep("city");
                    }}
                    className="p-2 border-b cursor-pointer hover:bg-gray-100"
                  >
                    {p.name}
                  </div>
                ))}
              </>
            )}

            {step === "city" && (
              <>
                <button
                  className="text-blue-500 mb-2"
                  onClick={() => setStep("province")}
                >
                  ← Back
                </button>

                {cities.map(c => (
                  <div
                    key={c.code}
                    onClick={() => {
                      setCity(c);
                      setStep("barangay");
                    }}
                    className="p-2 border-b cursor-pointer hover:bg-gray-100"
                  >
                    {c.name}
                  </div>
                ))}
              </>
            )}

            {step === "barangay" && (
              <>
                <button
                  className="text-blue-500 mb-2"
                  onClick={() => setStep("city")}
                >
                  ← Back
                </button>

                {barangays.map(b => (
                  <div
                    key={b.code}
                    onClick={() => {
                      setBarangay(b);
                      setStep("purok");
                    }}
                    className="p-2 border-b cursor-pointer hover:bg-gray-100"
                  >
                    {b.name}
                  </div>
                ))}
              </>
            )}

            {step === "purok" && (
              <>
                <button
                  className="text-blue-500 mb-2"
                  onClick={() => setStep("barangay")}
                >
                  ← Back
                </button>

                <input
                  type="text"
                  value={purok}
                  onChange={(e) => setPurok(e.target.value)}
                  placeholder="Purok / Street"
                  className="w-full px-3 py-2 border rounded mb-3"
                />

                <button
                  onClick={confirmAddress}
                  className="w-full bg-blue-600 text-white py-2 rounded"
                >
                  Confirm Address
                </button>
              </>
            )}

          </div>
        </div>
      )}
    </>
  );
};

export default AddressPicker;