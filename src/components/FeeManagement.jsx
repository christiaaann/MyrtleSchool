import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, writeBatch, doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from "../services/firebase"; 
import { ChevronDown, Wallet, Megaphone, Plus, X, History, Edit2 } from "lucide-react";
import axios from 'axios'; 
import { logAdminAction } from '../services/systemLogger';

const FeeManagement = ({ currentSY = "2026-2027" }) => {
  const [contribTitle, setContribTitle] = useState("");
  const [contribBreakdown, setContribBreakdown] = useState([{ name: "", amount: "" }]);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [pastBroadcasts, setPastBroadcasts] = useState([]);
  
  const [editingId, setEditingId] = useState(null);
  const [oldAmount, setOldAmount] = useState(0);

  const totalContribAmount = contribBreakdown.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  const [baseFees, setBaseFees] = useState({
    Preschool: { registration: 0, misc: 0, books: 0, instructional: 0, uniform: 0, pta: 0, monthlyRate: 0 },
    Elementary: { registration: 0, misc: 0, books: 0, instructional: 0, uniform: 0, pta: 0, monthlyRate: 0 }
  });
  const [isSavingFees, setIsSavingFees] = useState(false);
  const [expandedLevel, setExpandedLevel] = useState(null); 

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "fees"), (snap) => {
      if (snap.exists()) {
        setBaseFees(snap.data());
      } else {
        setBaseFees({
          Preschool: { registration: 500, misc: 3500, books: 2500, instructional: 500, uniform: 700, pta: 200, monthlyRate: 900 },
          Elementary: { registration: 500, misc: 3500, books: 2500, instructional: 700, uniform: 700, pta: 200, monthlyRate: 1500 }
        });
      }
    });
    return () => unsub();
  }, []);

  // --- FIXED HISTORY SORTING LOGIC ---
  useEffect(() => {
    if (!currentSY) return;
    const q = query(collection(db, "broadcasts"), where("schoolYear", "==", currentSY));
    const unsub = onSnapshot(q, (snap) => {
      const fetchedBroadcasts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // Sort safely bypassing Firebase index requirements
      fetchedBroadcasts.sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
      });
      
      setPastBroadcasts(fetchedBroadcasts);
    });
    return () => unsub();
  }, [currentSY]);

  const handleFeeChange = (level, feeType, value) => {
    setBaseFees(prev => ({
      ...prev,
      [level]: { ...prev[level], [feeType]: Number(value) }
    }));
  };

  const handleSaveBaseFees = async () => {
    if (window.confirm("Are you sure you want to update the base tuition and initial fees? This will apply to all NEW enrollments.")) {
      setIsSavingFees(true);
      try {
        await setDoc(doc(db, "settings", "fees"), baseFees, { merge: true });
        await logAdminAction("FEES_UPDATED", `Updated standard tuition and initial fees for SY ${currentSY}`);
        alert("Base fees updated successfully!");
        setExpandedLevel(null); 
      } catch (error) {
        console.error(error);
        alert("Failed to save fees.");
      } finally {
        setIsSavingFees(false);
      }
    }
  };

  const handleAddBreakdownItem = () => {
    setContribBreakdown([...contribBreakdown, { name: "", amount: "" }]);
  };

  const handleRemoveBreakdownItem = (index) => {
    if (contribBreakdown.length > 1) {
      setContribBreakdown(contribBreakdown.filter((_, i) => i !== index));
    }
  };

  const handleBreakdownChange = (index, field, value) => {
    const newBreakdown = [...contribBreakdown];
    newBreakdown[index][field] = value;
    setContribBreakdown(newBreakdown);
  };

  const handleEditClick = (broadcast) => {
    setContribTitle(broadcast.title);
    setContribBreakdown(broadcast.breakdown && broadcast.breakdown.length > 0 ? broadcast.breakdown : [{ name: "General", amount: broadcast.amount }]);
    setEditingId(broadcast.id);
    setOldAmount(broadcast.amount);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setContribTitle("");
    setContribBreakdown([{ name: "", amount: "" }]);
    setEditingId(null);
    setOldAmount(0);
  };

  const handleBroadcastContribution = async (e) => {
    e.preventDefault();
    if (!contribTitle.trim()) return alert("Please enter a contribution name.");
    if (totalContribAmount <= 0) return alert("Total amount must be greater than 0.");
    
    const validBreakdown = contribBreakdown.filter(item => item.name.trim() !== "" && Number(item.amount) > 0);
    if (validBreakdown.length === 0) return alert("Please provide at least one valid breakdown item.");

    const confirmMsg = editingId 
        ? `Update "${contribTitle}" to ₱${totalContribAmount}? This will recalculate balances for students who already paid.` 
        : `Are you sure you want to add a ₱${totalContribAmount} fee for "${contribTitle}" to EVERY student enrolled in ${currentSY}?`;

    if (window.confirm(confirmMsg)) {
      setIsBroadcasting(true);
      try {
        const enrQuery = query(collection(db, "enrollments"), where("schoolYear", "==", currentSY));
        const snap = await getDocs(enrQuery);
        
        const batch = writeBatch(db);
        const uniqueId = editingId || Date.now().toString();
        const studentIDs = [];

        snap.docs.forEach(document => {
          const data = document.data();
          if (data.studentID) studentIDs.push(data.studentID);

          const existingContrib = data.contributions?.[uniqueId];
          
          let updateData = {
            [`contributions.${uniqueId}.title`]: contribTitle,
            [`contributions.${uniqueId}.amount`]: totalContribAmount,
            [`contributions.${uniqueId}.breakdown`]: validBreakdown,
          };

          if (!editingId) {
            updateData[`contributions.${uniqueId}.status`] = "Unpaid";
            updateData[`contributions.${uniqueId}.amountPaid`] = 0;
          } else if (existingContrib) {
            const currentPaid = existingContrib.amountPaid !== undefined ? existingContrib.amountPaid : (existingContrib.status === "Paid" ? oldAmount : 0);
            updateData[`contributions.${uniqueId}.amountPaid`] = currentPaid;

            if (existingContrib.status === "Paid" || existingContrib.status === "Balance Due" || existingContrib.status === "Refund Due") {
                if (totalContribAmount > currentPaid) {
                    updateData[`contributions.${uniqueId}.status`] = "Balance Due";
                } else if (totalContribAmount < currentPaid) {
                    updateData[`contributions.${uniqueId}.status`] = "Refund Due";
                } else {
                    updateData[`contributions.${uniqueId}.status`] = "Paid";
                }
            }
          }

          batch.update(document.ref, updateData);
        });
        
        const broadcastRef = doc(db, "broadcasts", uniqueId);
        const broadcastData = {
          title: contribTitle,
          amount: totalContribAmount,
          breakdown: validBreakdown,
          schoolYear: currentSY,
          studentCount: snap.docs.length,
          updatedAt: serverTimestamp()
        };

        if (!editingId) {
          broadcastData.createdAt = serverTimestamp();
        }
        
        batch.set(broadcastRef, broadcastData, { merge: true });

        await batch.commit();

        await logAdminAction(
          editingId ? "BROADCAST_UPDATED" : "BROADCAST_CREATED", 
          `${editingId ? "Updated" : "Created"} broadcast "${contribTitle}" for ₱${totalContribAmount} (${snap.docs.length} students)`
        );

        try {
          await axios.post("https://myrtlebackend.vercel.app/send-broadcast", { 
            studentIDs: studentIDs, title: contribTitle, amount: totalContribAmount, schoolYear: currentSY, isUpdate: !!editingId
          });
        } catch(emailError) {
          console.error("Email sending failed, but database was updated:", emailError);
        }

        alert(editingId ? "Broadcast updated successfully!" : `Successfully billed ${snap.docs.length} students!`);
        cancelEdit();
      } catch (error) {
        console.error(error);
        alert("Failed to process.");
      } finally {
        setIsBroadcasting(false);
      }
    }
  };

  const feeInputKeys = [
    { key: 'monthlyRate', label: 'Monthly Tuition Rate' },
    { key: 'registration', label: 'Registration Fee' },
    { key: 'misc', label: 'Miscellaneous Fee' },
    { key: 'books', label: 'Books' },
    { key: 'instructional', label: 'Instructional Materials' },
    { key: 'uniform', label: 'P.E. Uniform' },
    { key: 'pta', label: 'PTA Fee' }
  ];

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h2 className="text-2xl font-black text-[#2D5B60] mb-6">Fee & Contribution Manager</h2>
      
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
        
        {/* COLUMN 1: STANDARD FEES EDITOR */}
        <div className="space-y-6 w-full max-w-2xl mx-auto xl:mx-0">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b pb-4">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-[#2D5B60] flex items-center gap-2">
                  <Wallet size={18} /> Standard School Fees
                </h3>
                <p className="text-[11px] text-gray-500 mt-1 max-w-sm">Update default pricing for new enrollees. Existing balances will NOT be altered.</p>
              </div>
              <button 
                onClick={handleSaveBaseFees}
                disabled={isSavingFees}
                className="bg-[#2D5B60] text-white w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold uppercase text-[10px] hover:bg-black transition-colors shadow-sm disabled:bg-gray-300 shrink-0"
              >
                {isSavingFees ? "Saving..." : "Save Changes"}
              </button>
            </div>

            <div className="space-y-4">
              {['Preschool', 'Elementary'].map(level => {
                const isOpen = expandedLevel === level;
                return (
                  <div key={level} className={`border rounded-xl overflow-hidden transition-all duration-300 ${isOpen ? 'border-[#2D5B60] shadow-md' : 'border-gray-200 hover:border-gray-300'}`}>
                    <button onClick={() => setExpandedLevel(isOpen ? null : level)} className={`w-full flex justify-between items-center p-4 transition-colors ${isOpen ? 'bg-[#2D5B60]/5' : 'bg-gray-50'}`}>
                      <div className="flex flex-col text-left">
                        <span className="font-black text-gray-800 uppercase tracking-widest">{level} Rates</span>
                        <span className="text-[10px] text-gray-500 font-bold uppercase mt-0.5">Click to {isOpen ? 'hide' : 'view & edit'} fees</span>
                      </div>
                      <ChevronDown size={20} className={`text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-[#2D5B60]' : ''}`} />
                    </button>
                    {isOpen && (
                      <div className="p-5 bg-white border-t border-gray-100 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {feeInputKeys.map(fee => (
                            <div key={`${level}-${fee.key}`} className="flex flex-col gap-1.5">
                              <label className="text-[10px] font-bold text-gray-500 uppercase pl-1">{fee.label}</label>
                              <div className="relative w-full">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">₱</span>
                                <input 
                                  type="number" 
                                  value={baseFees[level]?.[fee.key] || 0} 
                                  onChange={(e) => handleFeeChange(level, fee.key, e.target.value)} 
                                  className="w-full p-2.5 pl-8 border border-gray-200 rounded-lg text-right font-black text-[#2D5B60] outline-none focus:border-[#2D5B60] focus:ring-1 focus:ring-[#2D5B60] transition-all bg-gray-50 focus:bg-white" 
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* COLUMN 2: CONTRIBUTIONS & HISTORY */}
        <div className="space-y-6 w-full max-w-2xl mx-auto xl:mx-0">
          
          <div className={`bg-white p-6 rounded-2xl shadow-sm border transition-colors duration-300 ${editingId ? 'border-orange-400 ring-4 ring-orange-50' : 'border-gray-200'}`}>
            <div className="flex justify-between items-start mb-2">
                <h3 className="text-sm font-bold uppercase tracking-widest text-orange-600 flex items-center gap-2">
                <Megaphone size={18} /> {editingId ? "Edit Contribution" : "Broadcast Contribution"}
                </h3>
                {editingId && <button onClick={cancelEdit} className="text-[10px] font-bold text-gray-400 hover:text-red-500 uppercase underline">Cancel Edit</button>}
            </div>
            
            <p className="text-[11px] text-gray-500 mb-6">
                {editingId ? "Changing the total will automatically calculate balances or refunds for parents who already paid." : "Instantly bill an extra itemized fee to ALL enrolled students."}
            </p>
            
            <form onSubmit={handleBroadcastContribution} className="space-y-5">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase pl-1">Activity / Contribution Title</label>
                <input 
                  type="text" 
                  value={contribTitle} 
                  onChange={e => setContribTitle(e.target.value)} 
                  required 
                  className="w-full mt-1 p-3 border border-gray-200 rounded-xl bg-gray-50 outline-none focus:border-orange-500 transition-all focus:bg-white font-bold" 
                  placeholder="e.g. Nutrition Month"
                />
              </div>

              <div className="space-y-2 border-t border-gray-100 pt-4">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase pl-1">Itemized Breakdown</label>
                  <button type="button" onClick={handleAddBreakdownItem} className="text-[10px] font-bold text-orange-600 flex items-center gap-1 hover:underline">
                    <Plus size={12}/> Add Item
                  </button>
                </div>
                
                {contribBreakdown.map((item, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <input 
                      type="text" 
                      value={item.name} 
                      onChange={e => handleBreakdownChange(index, "name", e.target.value)} 
                      required 
                      className="flex-1 p-2 text-sm border border-gray-200 rounded-lg bg-gray-50 outline-none focus:border-orange-500" 
                      placeholder="e.g. Food"
                    />
                    <div className="relative w-1/3">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">₱</span>
                      <input 
                        type="number" 
                        value={item.amount} 
                        onChange={e => handleBreakdownChange(index, "amount", e.target.value)} 
                        required 
                        className="w-full p-2 pl-6 text-sm border border-gray-200 rounded-lg bg-gray-50 outline-none focus:border-orange-500 font-bold" 
                        placeholder="0"
                      />
                    </div>
                    {contribBreakdown.length > 1 && (
                      <button type="button" onClick={() => handleRemoveBreakdownItem(index)} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                        <X size={16}/>
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between pt-2">
                <div className="flex items-center gap-3 bg-orange-50 px-4 py-3 rounded-xl border border-orange-100 w-full sm:w-auto">
                  <span className="text-[10px] font-bold text-orange-800 uppercase">Total:</span>
                  <span className="text-xl font-black text-orange-600">₱{totalContribAmount.toLocaleString()}</span>
                </div>
                <button 
                  type="submit" 
                  disabled={isBroadcasting || totalContribAmount === 0} 
                  className={`w-full sm:w-auto text-white font-black py-3 px-8 rounded-xl shadow-md transition-all uppercase tracking-widest text-xs disabled:bg-gray-300 disabled:shadow-none ${editingId ? "bg-[#2D5B60] hover:bg-black" : "bg-orange-500 hover:bg-orange-600"}`}
                >
                  {isBroadcasting ? "Processing..." : editingId ? "Save Edits" : "Bill Students"}
                </button>
              </div>
            </form>
          </div>

          {/* Broadcast History Ledger */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-600 mb-4 flex items-center gap-2">
              <History size={18} /> Broadcast History ({currentSY})
            </h3>
            {pastBroadcasts.length === 0 ? (
              <p className="text-xs text-gray-400 italic text-center py-4 border border-dashed rounded-lg">No contributions broadcasted yet.</p>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {pastBroadcasts.map(b => (
                  <div key={b.id} className="p-4 border border-gray-100 rounded-xl bg-gray-50 flex justify-between items-center hover:border-gray-300 transition-colors">
                     <div>
                       <p className="font-bold text-sm text-gray-800 uppercase">{b.title}</p>
                       <p className="text-[10px] text-gray-500 font-medium uppercase mt-0.5">
                         {b.createdAt?.toDate().toLocaleDateString() || "Recently"} • Billed {b.studentCount} Students
                       </p>
                     </div>
                     <div className="flex items-center gap-4">
                        <p className="font-black text-[#2D5B60]">₱{b.amount.toLocaleString()}</p>
                        <button onClick={() => handleEditClick(b)} className="text-[10px] text-gray-400 hover:text-orange-500 transition-colors"><Edit2 size={16}/></button>
                     </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};

export default FeeManagement;