import React, { useState, useEffect } from 'react';
import { collection, addDoc, onSnapshot, query, serverTimestamp, where, doc } from 'firebase/firestore';
import { db, auth } from '../../services/firebase';
import { useOutletContext } from 'react-router-dom';
import { CreditCard, Search, Plus, Filter, Printer, Wallet, TrendingDown, Scale } from 'lucide-react';
import { logAdminAction } from '../../services/systemLogger';

const Expenses = () => {
  const { userData } = useOutletContext();
  const isSuperAdmin = userData?.role === "superadmin";

  const [expenses, setExpenses] = useState([]);
  const [allEnrollments, setAllEnrollments] = useState([]);
  const [currentSY, setCurrentSY] = useState("");
  const [loading, setLoading] = useState(true);

  // Form States
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Operations");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Filter States: Default to Current Month
  const currentD = new Date();
  const defaultYYYYMM = `${currentD.getFullYear()}-${String(currentD.getMonth() + 1).padStart(2, '0')}`;
  
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMonth, setFilterMonth] = useState(defaultYYYYMM);
  
  // SUPERADMIN BRANCH FILTER
  const [branchFilter, setBranchFilter] = useState(isSuperAdmin ? "All" : userData?.branch);

  // 1. Get School Year
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "schoolYear"), (snap) => {
      if (snap.exists()) setCurrentSY(snap.data().active);
    });
    return () => unsub();
  }, []);

  // 2. Fetch Expenses & Enrollments
  useEffect(() => {
    if (!currentSY) return;
    setLoading(true);

    const unsubExp = onSnapshot(collection(db, "expenses"), (snap) => {
      let fetchedExpenses = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      if (branchFilter !== "All") {
        fetchedExpenses = fetchedExpenses.filter(exp => exp.branch === branchFilter);
      }
      
      fetchedExpenses.sort((a, b) => new Date(b.date) - new Date(a.date));
      setExpenses(fetchedExpenses);
    });

    const enrQuery = query(collection(db, "enrollments"), where("schoolYear", "==", currentSY));
    const unsubRev = onSnapshot(enrQuery, async (snap) => {
      setAllEnrollments(snap.docs.map(d => d.data()));
      setLoading(false);
    });

    return () => { unsubExp(); unsubRev(); };
  }, [currentSY, branchFilter]);

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!amount || !description) return alert("Please fill out amount and description.");
    
    const expenseBranch = isSuperAdmin ? branchFilter : userData?.branch;
    if (expenseBranch === "All") {
      return alert("Superadmin: Please select a specific branch from the dropdown before logging an expense.");
    }

    try {
      await addDoc(collection(db, "expenses"), {
        amount: Number(amount),
        description,
        category,
        date,
        branch: expenseBranch,
        schoolYear: currentSY,
        createdBy: auth.currentUser.email,
        createdAt: serverTimestamp()
      });
      await logAdminAction("EXPENSE_ADDED", `Added ₱${amount} expense for ${description} (${expenseBranch})`);
      setAmount(""); setDescription(""); setCategory("Operations");
    } catch (err) {
      alert("Error saving expense: " + err.message);
    }
  };

  // --- FILTER EXPENSES BY MONTH & SEARCH ---
  const filteredExpenses = expenses.filter(exp => {
    const matchesSearch = exp.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMonth = filterMonth ? exp.date.startsWith(filterMonth) : true;
    return matchesSearch && matchesMonth;
  });

  const totalFilteredExpenses = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);

  // --- DYNAMICALLY CALCULATE REVENUE BASED ON SELECTED MONTH ---
  let calculatedRevenue = 0;
  let filterShortMonth = "";
  
  if (filterMonth) {
      const [year, monthNum] = filterMonth.split("-");
      const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
      filterShortMonth = monthNames[parseInt(monthNum, 10) - 1];
  }

  allEnrollments.forEach(data => {
      // Filter by Branch
      if (branchFilter !== "All" && data.branch !== branchFilter && data.branch !== undefined) return;

      // Determine the timestamp for Initial Enrollments
      const initTs = data.payment?.dateEnrolled || data.createdAt;
      let initMatch = false;
      
      if (!filterMonth) {
          initMatch = true;
      } else if (initTs) {
          const dObj = initTs.toDate ? initTs.toDate() : new Date(initTs);
          const y = dObj.getFullYear();
          const m = String(dObj.getMonth() + 1).padStart(2, '0');
          if (`${y}-${m}` === filterMonth) initMatch = true;
      }

      // 1. Calculate Initial Fees (Only if paid in the selected month)
      if (initMatch) {
          const fees = data.fees || {};
          const paidInit = data.paidInitialFees || [];
          const basePaid = paidInit.reduce((sum, key) => sum + Number(fees[key] || 0), 0);
          const customPaid = Number(data.customInitialPayment || 0);
          calculatedRevenue += (basePaid + customPaid);
      }

      // 2. Calculate Monthly Tracking
      if (data.monthlyTracking) {
          Object.entries(data.monthlyTracking).forEach(([mKey, mData]) => {
              const isPaid = mData.status === "Paid";
              const amtPaid = Number(mData.amountPaid) || (isPaid ? Number(mData.amount || 0) : 0);
              
              if (amtPaid > 0) {
                  let mMatch = false;
                  if (!filterMonth) {
                      mMatch = true;
                  } else if (mData.dateSubmitted) {
                      // Check exact timestamp if parent paid online
                      const dObj = new Date(mData.dateSubmitted);
                      const y = dObj.getFullYear();
                      const m = String(dObj.getMonth() + 1).padStart(2, '0');
                      if (`${y}-${m}` === filterMonth) mMatch = true;
                  } else if (mKey === filterShortMonth) {
                      // Fallback: If admin marked as paid manually, match the school month (e.g. "AUG")
                      mMatch = true;
                  }
                  if (mMatch) calculatedRevenue += amtPaid;
              }
          });
      }

      // 3. Calculate Contributions
      if (data.contributions) {
          Object.entries(data.contributions).forEach(([cKey, cData]) => {
              const isPaid = cData.status === "Paid";
              const amtPaid = Number(cData.amountPaid) || (isPaid ? Number(cData.amount || 0) : 0);
              
              if (amtPaid > 0) {
                  let cMatch = false;
                  if (!filterMonth) {
                      cMatch = true;
                  } else if (cData.dateSubmitted) {
                      const dObj = new Date(cData.dateSubmitted);
                      const y = dObj.getFullYear();
                      const m = String(dObj.getMonth() + 1).padStart(2, '0');
                      if (`${y}-${m}` === filterMonth) cMatch = true;
                  } else if (initMatch) {
                      // Fallback to initial enrollment date if missing
                      cMatch = true;
                  }
                  if (cMatch) calculatedRevenue += amtPaid;
              }
          });
      }
  });

  const netBalance = calculatedRevenue - totalFilteredExpenses;

  // --- Generate Professional Print Form ---
  const handlePrintReport = () => {
    const win = window.open('', '_blank');
    const branchText = isSuperAdmin ? branchFilter : userData?.branch;
    const periodText = filterMonth ? `| Period: ${filterMonth}` : '| Period: All Time';
    
    const tableRows = filteredExpenses.map(exp => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee; color: #555;">${new Date(exp.date).toLocaleDateString()}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">
          <strong>${exp.description}</strong><br/>
          <small style="color: #999; text-transform: uppercase; font-size: 9px;">By: ${exp.createdBy}</small>
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${exp.category}</td>
        ${isSuperAdmin ? `<td style="padding: 10px; border-bottom: 1px solid #eee;">${exp.branch}</td>` : ''}
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right; color: #dc2626; font-weight: bold;">- ₱${exp.amount.toLocaleString()}</td>
      </tr>
    `).join('');

    win.document.write(`
      <html>
      <head>
        <title>Financial Report - ${currentSY}</title>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #333; max-width: 900px; margin: auto; }
          .header { text-align: center; border-bottom: 2px solid #2D5B60; padding-bottom: 20px; margin-bottom: 30px; }
          .header h2 { color: #2D5B60; margin: 0 0 5px 0; font-size: 24px; text-transform: uppercase; letter-spacing: 1px; }
          .header p { margin: 0; color: #666; font-size: 12px; letter-spacing: 1.5px; text-transform: uppercase; font-weight: bold; }
          
          .summary-table { width: 100%; margin-bottom: 30px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; border-collapse: collapse; }
          .summary-table td { text-align: center; padding: 15px; width: 33.33%; }
          .summary-table td:not(:last-child) { border-right: 1px solid #e2e8f0; }
          .summary-label { font-size: 10px; color: #64748b; text-transform: uppercase; margin-bottom: 4px; letter-spacing: 1px; font-weight: bold; }
          .summary-value { font-size: 20px; font-weight: bold; }
          
          .data-table { width: 100%; border-collapse: collapse; font-size: 12px; }
          .data-table th { text-align: left; padding: 12px 10px; background: #2D5B60; color: white; text-transform: uppercase; font-size: 10px; letter-spacing: 1px; }
          
          .footer { text-align: center; margin-top: 50px; font-size: 10px; color: #94a3b8; border-top: 1px dashed #cbd5e1; padding-top: 20px;}
        </style>
      </head>
      <body>
        <div class="header">
          <h2>Myrtle Christian School</h2>
          <p>Expense & Collection Ledger</p>
          <p style="color: #999; margin-top: 5px;">S.Y. ${currentSY} | Branch: ${branchText} ${periodText}</p>
        </div>

        <table class="summary-table">
          <tr>
            <td>
              <div class="summary-label">Total Collections</div>
              <div class="summary-value" style="color: #16a34a;">₱${calculatedRevenue.toLocaleString()}</div>
            </td>
            <td>
              <div class="summary-label">Total Expenses</div>
              <div class="summary-value" style="color: #dc2626;">₱${totalFilteredExpenses.toLocaleString()}</div>
            </td>
            <td style="background: ${netBalance >= 0 ? '#f0fdf4' : '#fef2f2'};">
              <div class="summary-label" style="color: ${netBalance >= 0 ? '#16a34a' : '#dc2626'};">Net Balance</div>
              <div class="summary-value" style="color: ${netBalance >= 0 ? '#15803d' : '#b91c1c'};">₱${netBalance.toLocaleString()}</div>
            </td>
          </tr>
        </table>

        <table class="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Category</th>
              ${isSuperAdmin ? `<th>Branch</th>` : ''}
              <th style="text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows || '<tr><td colspan="5" style="text-align: center; padding: 30px; color: #999; font-style: italic;">No expenses recorded for this period.</td></tr>'}
          </tbody>
        </table>

        <div class="footer">
          Generated by Myrtle Christian School Management System<br/>
          Date Printed: ${new Date().toLocaleString()}
        </div>
        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `);
    win.document.close();
  };

  if (loading) return <div className="p-10 text-center animate-pulse text-gray-400 font-bold">Loading Ledger...</div>;

  return (
    <div className="p-6 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-black text-[#2D5B60] flex items-center gap-2"><CreditCard size={20}/> Expense Ledger</h1>
            <p className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">S.Y. {currentSY}</p>
          </div>
          
          <div className="flex items-center gap-2">
            {isSuperAdmin && (
              <div className="relative">
                <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={12}/>
                <select 
                  value={branchFilter} 
                  onChange={(e) => setBranchFilter(e.target.value)}
                  className="pl-7 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-[11px] font-bold text-[#2D5B60] outline-none cursor-pointer shadow-sm"
                >
                  <option value="All">Global View</option>
                  <option value="Irosin">Irosin Branch</option>
                  <option value="Matnog">Matnog Branch</option>
                </select>
              </div>
            )}

            <button onClick={handlePrintReport} className="bg-gray-800 text-white px-4 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest flex items-center gap-1.5 hover:bg-black transition-colors shadow-sm">
              <Printer size={14}/> Print
            </button>
          </div>
        </div>

        {/* STRICT HORIZONTAL SUMMARY CARDS */}
        <div className="grid grid-cols-3 gap-2 md:gap-4 mb-6">
          <div className="bg-white p-3 md:p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between overflow-hidden">
            <div className="min-w-0">
                <h3 className="text-[8px] md:text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">Collections</h3>
                <h2 className="text-sm md:text-xl font-black text-green-600 truncate">₱{calculatedRevenue.toLocaleString()}</h2>
            </div>
            <div className="hidden sm:flex p-2 bg-green-50 rounded-full flex-shrink-0"><Wallet size={16} className="text-green-500"/></div>
          </div>
          <div className="bg-white p-3 md:p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between overflow-hidden">
            <div className="min-w-0">
                <h3 className="text-[8px] md:text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">Expenses</h3>
                <h2 className="text-sm md:text-xl font-black text-red-600 truncate">₱{totalFilteredExpenses.toLocaleString()}</h2>
            </div>
            <div className="hidden sm:flex p-2 bg-red-50 rounded-full flex-shrink-0"><TrendingDown size={16} className="text-red-500"/></div>
          </div>
          <div className={`p-3 md:p-4 rounded-2xl shadow-sm border flex items-center justify-between overflow-hidden ${netBalance >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <div className="min-w-0">
                <h3 className={`text-[8px] md:text-[9px] font-bold uppercase tracking-widest mb-0.5 ${netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>Net Balance</h3>
                <h2 className={`text-sm md:text-xl font-black truncate ${netBalance >= 0 ? 'text-green-800' : 'text-red-800'}`}>₱{netBalance.toLocaleString()}</h2>
            </div>
            <div className={`hidden sm:flex p-2 rounded-full flex-shrink-0 ${netBalance >= 0 ? 'bg-green-100' : 'bg-red-100'}`}><Scale size={16} className={netBalance >= 0 ? 'text-green-600' : 'text-red-600'}/></div>
          </div>
        </div>

        {/* HORIZONTAL QUICK-LOG FORM */}
        <form onSubmit={handleAddExpense} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 mb-6">
          <div className="flex justify-between items-center mb-3">
              <h3 className="font-black text-[#2D5B60] uppercase text-[10px] tracking-widest flex items-center gap-1.5"><Plus size={14}/> Log Expense</h3>
              {isSuperAdmin && branchFilter !== "All" && <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-[8px] uppercase font-black">{branchFilter}</span>}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
            <div className="md:col-span-2">
              <label className="text-[9px] font-black text-gray-400 uppercase">Amount (₱)</label>
              <input type="number" required value={amount} onChange={e => setAmount(e.target.value)} className="w-full mt-1 p-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-[#2D5B60] font-bold text-xs" placeholder="0.00" />
            </div>
            
            <div className="md:col-span-4">
              <label className="text-[9px] font-black text-gray-400 uppercase">Description</label>
              <input type="text" required value={description} onChange={e => setDescription(e.target.value)} className="w-full mt-1 p-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-[#2D5B60] text-xs" placeholder="e.g. Utility Bills, Repairs" />
            </div>

            <div className="md:col-span-2">
              <label className="text-[9px] font-black text-gray-400 uppercase">Category</label>
              <select value={category} onChange={e => setCategory(e.target.value)} className="w-full mt-1 p-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-[#2D5B60] text-xs font-bold">
                <option value="Operations">Operations</option>
                <option value="Utilities">Utilities</option>
                <option value="Payroll">Payroll</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Miscellaneous">Misc</option>
              </select>
            </div>
            
            <div className="md:col-span-2">
              <label className="text-[9px] font-black text-gray-400 uppercase">Date</label>
              <input type="date" required value={date} onChange={e => setDate(e.target.value)} className="w-full mt-1 p-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-[#2D5B60] text-xs font-bold" />
            </div>

            <div className="md:col-span-2">
              <button type="submit" className="w-full bg-[#2D5B60] text-white py-2 rounded-lg font-black uppercase tracking-widest text-[10px] hover:bg-black transition-colors disabled:opacity-50">
                Save
              </button>
            </div>
          </div>
        </form>

        {/* TABLE SECTION */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="flex flex-col sm:flex-row gap-3 p-3 border-b border-gray-100 bg-gray-50/50">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14}/>
              <input type="text" placeholder="Search description..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-8 pr-3 py-1.5 bg-white border border-gray-200 rounded-lg outline-none focus:border-[#2D5B60] text-xs" />
            </div>
            <div className="relative w-full sm:w-48 flex items-center gap-2">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14}/>
              <input type="month" value={filterMonth} onChange={e => setFilterMonth(e.target.value)} className="w-full pl-8 pr-3 py-1.5 bg-white border border-gray-200 rounded-lg outline-none focus:border-[#2D5B60] text-xs font-bold text-gray-600" />
              {filterMonth && (
                <button 
                  onClick={() => setFilterMonth("")} 
                  className="absolute right-2 text-[10px] font-bold text-red-500 hover:text-red-700 bg-red-50 px-2 py-0.5 rounded-md border border-red-100"
                  title="Clear Filter to view All Time"
                >
                  CLEAR
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50/80 text-gray-500 text-[9px] uppercase font-black tracking-widest border-b border-gray-200">
                <tr>
                  <th className="px-5 py-3 whitespace-nowrap">Date</th>
                  <th className="px-5 py-3">Description</th>
                  <th className="px-5 py-3">Category</th>
                  {isSuperAdmin && <th className="px-5 py-3">Branch</th>}
                  <th className="px-5 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-gray-100">
                {filteredExpenses.length === 0 ? (
                  <tr><td colSpan="5" className="px-5 py-8 text-center text-gray-400 italic">No expenses recorded for this period.</td></tr>
                ) : (
                  filteredExpenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3 font-medium text-gray-600 whitespace-nowrap">{new Date(exp.date).toLocaleDateString()}</td>
                      <td className="px-5 py-3">
                        <p className="font-bold text-gray-800">{exp.description}</p>
                        <p className="text-[8px] text-gray-400 uppercase tracking-widest mt-0.5">By: {exp.createdBy}</p>
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap"><span className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-md text-[8px] font-black uppercase tracking-wider">{exp.category}</span></td>
                      {isSuperAdmin && <td className="px-5 py-3 font-bold text-indigo-600 whitespace-nowrap text-[10px]">{exp.branch}</td>}
                      <td className="px-5 py-3 text-right font-black text-red-600 whitespace-nowrap">- ₱{exp.amount.toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Expenses;