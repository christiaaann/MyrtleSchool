import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { Users, FileText, CheckCircle, Wallet, Clock, Filter, Baby, BookOpen } from 'lucide-react';
import { useOutletContext, useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const { userData } = useOutletContext(); 
  const navigate = useNavigate();
  
  const isSuperAdmin = userData?.role === "superadmin";

  const [currentSY, setCurrentSY] = useState("");
  const [allEnrollments, setAllEnrollments] = useState([]);
  const [branchFilter, setBranchFilter] = useState(isSuperAdmin ? "All" : userData?.branch);
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({ 
    enrolled: 0, 
    pendingDocs: 0, 
    totalRevenue: 0, 
    pendingPayments: 0,
    preschool: 0,
    elementary: 0
  });

  // 1. Get Current School Year
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "schoolYear"), (snap) => {
      if (snap.exists()) setCurrentSY(snap.data().active);
    });
    return () => unsub();
  }, []);

  // 2. Fetch Base Data
  useEffect(() => {
    if (!currentSY) return;

    let enrQuery;
    if (isSuperAdmin) {
      enrQuery = query(collection(db, "enrollments"), where("schoolYear", "==", currentSY));
    } else {
      enrQuery = query(
        collection(db, "enrollments"), 
        where("schoolYear", "==", currentSY),
        where("branch", "==", userData?.branch)
      );
    }

    const unsub = onSnapshot(enrQuery, (snap) => {
      setAllEnrollments(snap.docs.map(d => d.data()));
      setLoading(false);
    });

    return () => unsub();
  }, [currentSY, isSuperAdmin, userData?.branch]);

  // 3. Compute Stats based on Branch Filter
  useEffect(() => {
    let revenue = 0;
    let enrolledCount = 0;
    let pendingDocsCount = 0;
    let pendingPayCount = 0;
    let preCount = 0;
    let elemCount = 0;

    allEnrollments.forEach(data => {
      // Apply the local Branch Filter
      if (branchFilter !== "All" && data.branch !== branchFilter && data.branch !== undefined) return;

      // Enrollment & Level Stats
      if (data.payment?.status === "Approved") {
          enrolledCount++;
          if (data.fees?.monthlyRate === 900 || data.fees?.registration === 500) { // Basic check for preschool
             if (data.fees?.instructional === 500) preCount++;
             else elemCount++;
          }
      }
      
      if (data.verificationStatus === "Pending") pendingDocsCount++;

      // Pending Payments Tracking
      if (data.initialFeeTracking?.status === "Pending Approval") pendingPayCount++;
      if (data.monthlyTracking) {
        Object.values(data.monthlyTracking).forEach(m => {
          if (m.status === "Pending Approval") pendingPayCount++;
        });
      }
      if (data.contributions) {
        Object.values(data.contributions).forEach(c => {
          if (c.status === "Pending Approval") pendingPayCount++;
        });
      }

      // Total Revenue Calculation
      const fees = data.fees || {};
      const paidInit = data.paidInitialFees || [];
      const basePaid = paidInit.reduce((sum, key) => sum + Number(fees[key] || 0), 0);
      const customPaid = Number(data.customInitialPayment || 0);
      
      let monthlyPaid = 0;
      if (data.monthlyTracking) {
        Object.values(data.monthlyTracking).forEach(m => {
          if (m.status === "Paid") monthlyPaid += Number(m.amount || 0);
          else if (m.amountPaid) monthlyPaid += Number(m.amountPaid);
        });
      }
      
      let contribPaid = 0;
      if (data.contributions) {
          Object.values(data.contributions).forEach(c => {
            if (c.status === "Paid") contribPaid += Number(c.amount || 0);
            else if (c.amountPaid) contribPaid += Number(c.amountPaid);
          });
      }
      revenue += (basePaid + customPaid + monthlyPaid + contribPaid);
    });

    setStats({ 
        enrolled: enrolledCount, 
        pendingDocs: pendingDocsCount, 
        totalRevenue: revenue, 
        pendingPayments: pendingPayCount,
        preschool: preCount,
        elementary: elemCount
    });

  }, [allEnrollments, branchFilter]);

  if (loading) return <div className="p-10 text-center animate-pulse font-bold text-gray-400">Loading Analytics...</div>;

  return (
    <div className="p-6 md:p-8 bg-gray-50 min-h-screen">
      
      {/* HEADER & FILTER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
            <h1 className="text-2xl md:text-3xl font-black text-[#2D5B60] tracking-tight">
            {isSuperAdmin ? "Executive Dashboard" : `${userData.branch} Dashboard`}
            </h1>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">S.Y. {currentSY}</p>
        </div>

        {isSuperAdmin && (
            <div className="relative w-full md:w-48 shadow-sm">
               <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
               <select 
                 value={branchFilter} 
                 onChange={(e) => setBranchFilter(e.target.value)}
                 className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-[#2D5B60] text-sm font-bold text-[#2D5B60] cursor-pointer transition-colors"
               >
                 <option value="All">Global View</option>
                 <option value="Irosin">Irosin Branch</option>
                 <option value="Matnog">Matnog Branch</option>
               </select>
            </div>
        )}
      </div>

      {/* TOP ROW: PRIMARY METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        
        {/* REVENUE CARD (CLICKABLE TO EXPENSES) */}
        {isSuperAdmin && (
          <div 
            onClick={() => navigate("/admin/expenses")}
            className="bg-gradient-to-br from-[#2D5B60] to-[#1a383b] p-6 rounded-3xl shadow-lg text-white cursor-pointer hover:scale-[1.02] hover:shadow-xl transition-all duration-200"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-teal-100">Total Revenue</h3>
              <Wallet className="opacity-50" />
            </div>
            <h2 className="text-4xl font-black truncate">₱{stats.totalRevenue.toLocaleString()}</h2>
            <p className="text-[10px] mt-2 text-teal-200 font-bold uppercase tracking-widest flex items-center justify-between">
              Collected this year <span>View Ledger →</span>
            </p>
          </div>
        )}

        {/* PENDING PAYMENTS (CLICKABLE TO STUDENTS) */}
        <div 
          onClick={() => navigate("/admin/students")}
          className="bg-yellow-50 p-6 rounded-3xl shadow-sm border border-yellow-200 cursor-pointer hover:bg-yellow-100 hover:scale-[1.02] transition-all duration-200"
        >
          <div className="flex justify-between items-center mb-4 text-yellow-600">
            <h3 className="text-xs font-bold uppercase tracking-widest">Pending Payments</h3>
            <Clock />
          </div>
          <h2 className="text-4xl font-black text-yellow-800">{stats.pendingPayments}</h2>
          <p className="text-[10px] mt-2 text-yellow-600 font-bold uppercase tracking-widest flex items-center justify-between">
              Awaiting Approval <span>Review →</span>
          </p>
        </div>

        {/* PENDING DOCS (CLICKABLE TO STUDENTS) */}
        <div 
          onClick={() => navigate("/admin/students")}
          className="bg-orange-50 p-6 rounded-3xl shadow-sm border border-orange-200 cursor-pointer hover:bg-orange-100 hover:scale-[1.02] transition-all duration-200"
        >
          <div className="flex justify-between items-center mb-4 text-orange-600">
            <h3 className="text-xs font-bold uppercase tracking-widest">Pending Docs</h3>
            <FileText />
          </div>
          <h2 className="text-4xl font-black text-orange-800">{stats.pendingDocs}</h2>
          <p className="text-[10px] mt-2 text-orange-600 font-bold uppercase tracking-widest flex items-center justify-between">
              Awaiting Review <span>Verify →</span>
          </p>
        </div>

        {/* FULLY ENROLLED (CLICKABLE TO STUDENTS) */}
        <div 
          onClick={() => navigate("/admin/students")}
          className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200 cursor-pointer hover:border-green-300 hover:scale-[1.02] transition-all duration-200"
        >
          <div className="flex justify-between items-center mb-4 text-green-600">
            <h3 className="text-xs font-bold uppercase tracking-widest">Fully Enrolled</h3>
            <CheckCircle />
          </div>
          <h2 className="text-4xl font-black text-gray-800">{stats.enrolled}</h2>
          <p className="text-[10px] mt-2 text-gray-400 font-bold uppercase tracking-widest flex items-center justify-between">
              Active Students <span>Roster →</span>
          </p>
        </div>
      </div>

      {/* SECOND ROW: DEMOGRAPHICS */}
      <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] mb-3 ml-2">Demographics Breakdown</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-5">
             <div className="bg-pink-50 p-4 rounded-full text-pink-500">
                <Baby size={24} />
             </div>
             <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Preschool Department</p>
                <h2 className="text-2xl font-black text-gray-800">{stats.preschool} <span className="text-sm font-bold text-gray-400">Students</span></h2>
             </div>
          </div>
          
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-5">
             <div className="bg-blue-50 p-4 rounded-full text-blue-500">
                <BookOpen size={24} />
             </div>
             <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Elementary Department</p>
                <h2 className="text-2xl font-black text-gray-800">{stats.elementary} <span className="text-sm font-bold text-gray-400">Students</span></h2>
             </div>
          </div>
      </div>

    </div>
  );
};

export default AdminDashboard;