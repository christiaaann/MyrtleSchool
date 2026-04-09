import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from "../services/firebase";
import { Search, Filter } from 'lucide-react';

const SystemLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAction, setFilterAction] = useState("ALL");

  useEffect(() => {
    // Fetch the 200 most recent actions
    const q = query(collection(db, "system_logs"), orderBy("timestamp", "desc"), limit(200));
    const unsub = onSnapshot(q, (snap) => {
      setLogs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Extract unique action types dynamically for the filter dropdown
  const uniqueActions = ["ALL", ...new Set(logs.map(log => log.actionType))];

  // Apply Search and Filters
  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.description?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      log.adminName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.adminEmail?.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesFilter = filterAction === "ALL" || log.actionType === filterAction;
    
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="p-8 bg-gray-50 min-h-screen w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h2 className="text-2xl font-black text-[#2D5B60]">System Logs & Audit Trail</h2>
        
        {/* Search & Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Search logs, names, or emails..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2D5B60]/20 w-full sm:w-64"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <select 
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="pl-9 pr-8 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2D5B60]/20 appearance-none bg-white w-full sm:w-auto cursor-pointer"
            >
              {uniqueActions.map(action => (
                <option key={action} value={action}>{action.replace(/_/g, " ")}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-100 text-gray-500 text-[10px] uppercase font-black tracking-wider">
              <tr>
                <th className="p-4 whitespace-nowrap">Date & Time</th>
                <th className="p-4">User / Admin</th>
                <th className="p-4">Action Type</th>
                <th className="p-4 min-w-[300px]">Description</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {loading ? <tr><td colSpan="4" className="p-10 text-center text-gray-400 animate-pulse font-bold">Fetching audit trails...</td></tr> : 
               filteredLogs.length === 0 ? <tr><td colSpan="4" className="p-10 text-center text-gray-400 italic">No system logs found matching your criteria.</td></tr> :
               filteredLogs.map(log => (
                <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="p-4 text-xs font-bold text-gray-500 whitespace-nowrap">
                    {log.timestamp ? new Date(log.timestamp.toDate()).toLocaleString() : "Just now"}
                  </td>
                  <td className="p-4">
                    <span className="font-black text-gray-800">{log.adminName}</span><br/>
                    <span className="text-[10px] text-gray-400 font-bold">{log.adminEmail}</span>
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                      log.actionType.includes("APPROVED") || log.actionType.includes("VERIFIED") ? "bg-green-100 text-green-700" :
                      log.actionType.includes("REJECTED") || log.actionType.includes("DELETED") ? "bg-red-100 text-red-700" :
                      log.actionType.includes("PAYMENT") ? "bg-blue-100 text-blue-700" :
                      "bg-gray-100 text-gray-600"
                    }`}>
                      {log.actionType.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="p-4 text-gray-700 font-medium">{log.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SystemLogs;