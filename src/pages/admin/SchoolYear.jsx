import React, { useState, useEffect } from "react";
import { sileo } from 'sileo';
import { doc, onSnapshot, setDoc } from "firebase/firestore"; // Changed to setDoc
import { db } from "../../services/firebase";

const SchoolYear = () => {
  const [currentSY, setCurrentSY] = useState("");
  const [newSY, setNewSY] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const settingsRef = doc(db, "settings", "schoolYear");
    const unsub = onSnapshot(settingsRef, (snap) => {
      if (snap.exists()) {
        setCurrentSY(snap.data().active);
      }
    });
    return () => unsub();
  }, []);

  // FUNCTION PARA MAG-UPDATE NG TAON
  const handleUpdateSY = async () => {
    if (!newSY || newSY.length < 9) {
       sileo.info({ title:"Please enter a valid School Year",
        fill:"black",
        description:"Note: Ang pagpalit dito ay mag-a-archive (itago) ng lumang payment views para magbigay daan sa bagong enrollment period.",
        styles: {description:"text-white/75"}
       });
       return;
    }

    const confirmChange = window.confirm(
      `WARNING:\n\nKapag pinalitan mo ang School Year sa ${newSY}:\n1. Lahat ng parents ay makakakita ng bagong (empty) enrollment tracker.\n2. Magsisimula ang bagong listahan ng payments para sa taong ito.\n\nSigurado ka ba?`
    );

    if (confirmChange) {
      setIsUpdating(true);
      try {
        const settingsRef = doc(db, "settings", "schoolYear");
        // FIX: Used setDoc with merge: true so it creates the document if it doesn't exist yet
        await setDoc(settingsRef, { active: newSY }, { merge: true });
        alert("Success! Ang active School Year ay " + newSY + " na.");
        setNewSY(""); 
      } catch (error) {
        console.error(error);
        alert("Error updating year: " + error.message);
      } finally {
        setIsUpdating(false);
      }
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen font-sans">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-black text-[#2D5B60] mb-6 uppercase">System Settings</h2>
        
        <div className="bg-white rounded-2xl shadow-sm border p-8 space-y-8">
          {/* CURRENT STATUS CARD */}
          <div className="flex items-center justify-between p-6 bg-[#2D5B60]/5 rounded-xl border border-[#2D5B60]/20">
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Academic Year</p>
              <h1 className="text-4xl font-black text-[#2D5B60]">{currentSY || "None Set"}</h1>
            </div>
            <div className="bg-green-500 w-3 h-3 rounded-full animate-ping"></div>
          </div>

          {/* UPDATE FORM */}
          <div className="space-y-4">
            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase ml-1">Set New School Year</label>
              <input 
                type="text" 
                placeholder="Halimbawa: 2026-2027" 
                value={newSY}
                onChange={(e) => setNewSY(e.target.value)}
                className="w-full mt-1 p-4 border-2 border-gray-100 rounded-xl focus:border-[#2D5B60] outline-none font-bold text-lg transition-all"
              />
              <p className="text-[10px] text-gray-400 mt-2 italic">
                * Note: Ang pagpalit dito ay mag-a-archive (itago) ng lumang payment views para magbigay daan sa bagong enrollment period.
              </p>
            </div>

            <button 
              onClick={handleUpdateSY}
              disabled={isUpdating}
              className={`w-full py-4 rounded-xl font-black uppercase tracking-wider transition-all shadow-md ${
                isUpdating ? "bg-gray-300 cursor-not-allowed" : "bg-[#2D5B60] text-white hover:bg-black active:scale-95"
              }`}
            >
              {isUpdating ? "Updating System..." : "Update School Year"}
            </button>
          </div>
        </div>

        {/* INFO BOX */}
        <div className="mt-8 bg-blue-50 p-6 rounded-2xl border border-blue-100 flex gap-4 items-start">
          <span className="text-xl">ℹ️</span>
          <div>
             <h4 className="text-sm font-bold text-blue-900 uppercase mb-1">Paano ito gumagana?</h4>
             <p className="text-[11px] text-blue-800 leading-relaxed">
              Hindi mabubura ang records ng <b>{currentSY || "kasalukuyang taon"}</b>. Naka-save sila nang maayos sa database. Kapag pinalitan mo ang taon, binibigyan mo lang ang system ng bagong "Folder Name" para sa susunod na batch ng mga estudyante at payments.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SchoolYear;