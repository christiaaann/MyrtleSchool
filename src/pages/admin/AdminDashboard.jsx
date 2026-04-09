import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { Users, FileText, CheckCircle, Wallet } from 'lucide-react';

const AdminDashboard = () => {
  const [currentSY, setCurrentSY] = useState("");
  const [stats, setStats] = useState({ enrolled: 0, pending: 0, totalRevenue: 0, unverifiedDocs: 0 });
  const [loading, setLoading] = useState(true);

  // 1. Get Current SY
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "schoolYear"), (snap) => {
      if (snap.exists()) setCurrentSY(snap.data().active);
    });
    return () => unsub();
  }, []);

  // 2. Crunch Analytics
  useEffect(() => {
    if (!currentSY) return;

    const enrQuery = query(collection(db, "enrollments"), where("schoolYear", "==", currentSY));
    const unsub = onSnapshot(enrQuery, (snap) => {
      let revenue = 0;
      let enrolledCount = 0;
      let pendingVerifications = 0;

      snap.docs.forEach(docSnap => {
        const data = docSnap.data();
        
        // Count statuses
        if (data.payment?.status === "Approved") enrolledCount++;
        if (data.verificationStatus === "Pending") pendingVerifications++;

        // Calculate Revenue from this student
        const fees = data.fees || {};
        const paidInit = data.paidInitialFees || [];
        const basePaid = paidInit.reduce((sum, key) => sum + Number(fees[key] || 0), 0);
        const customPaid = Number(data.customInitialPayment || 0);
        
        let monthlyPaid = 0;
        if (data.monthlyTracking) {
          Object.values(data.monthlyTracking).forEach(m => {
            if (m.status === "Paid") monthlyPaid += Number(m.amount || 0);
          });
        }
        
        // Add ad-hoc contributions
        let contribPaid = 0;
        if (data.contributions) {
           Object.values(data.contributions).forEach(c => {
             if (c.status === "Paid") contribPaid += Number(c.amount || 0);
           });
        }

        revenue += (basePaid + customPaid + monthlyPaid + contribPaid);
      });

      setStats({ enrolled: enrolledCount, pending: pendingVerifications, totalRevenue: revenue, unverifiedDocs: pendingVerifications });
      setLoading(false);
    });

    return () => unsub();
  }, [currentSY]);

  if (loading) return <div className="p-10 text-center animate-pulse font-bold text-gray-400">Loading Analytics...</div>;

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-[#2D5B60]">Financial Dashboard</h1>
        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">S.Y. {currentSY}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Revenue Card */}
        <div className="bg-gradient-to-br from-[#2D5B60] to-[#1a383b] p-6 rounded-3xl shadow-lg text-white">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-teal-100">Total Revenue</h3>
            <Wallet className="opacity-50" />
          </div>
          <h2 className="text-4xl font-black">₱{stats.totalRevenue.toLocaleString()}</h2>
          <p className="text-[10px] mt-2 text-teal-200">Collected this school year</p>
        </div>

        {/* Enrolled Card */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4 text-green-600">
            <h3 className="text-xs font-bold uppercase tracking-widest">Fully Enrolled</h3>
            <CheckCircle />
          </div>
          <h2 className="text-4xl font-black text-gray-800">{stats.enrolled}</h2>
          <p className="text-[10px] mt-2 text-gray-400">Active students</p>
        </div>

        {/* Pending Verification Card */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4 text-orange-500">
            <h3 className="text-xs font-bold uppercase tracking-widest">Pending Documents</h3>
            <FileText />
          </div>
          <h2 className="text-4xl font-black text-gray-800">{stats.unverifiedDocs}</h2>
          <p className="text-[10px] mt-2 text-gray-400">Awaiting admin review</p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;