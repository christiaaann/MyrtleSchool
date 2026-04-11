import { getFunctions, httpsCallable } from "firebase/functions";
import { db } from "../services/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { logAdminAction } from "../services/systemLogger";

const AdminManagement = () => {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("registrar");
  const [branch, setBranch] = useState("Irosin");
  
  const [activeStaff, setActiveStaff] = useState([]);
  const [pendingInvites, setPendingInvites] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch Active Staff (Superadmins & Registrars)
  useEffect(() => {
    const q = query(collection(db, "users"), where("role", "in", ["superadmin", "registrar", "admin"]));
    const unsub = onSnapshot(q, (snap) => {
      setActiveStaff(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  // Fetch Pending Invites
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "pre_approved_staff"), (snap) => {
      setPendingInvites(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!email) return alert("Please enter an email address.");
    setIsProcessing(true);

    try {
      const functions = getFunctions();
      const assignStaffRole = httpsCallable(functions, "assignStaffRole");
      const result = await assignStaffRole({ targetEmail: email, role, branch });
      await logAdminAction("STAFF_INVITED", result.data.message);
      alert(result.data.message);
      setEmail("");
    } catch (error) {
      alert("Error: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };


  const handleRevokeActive = async (userId, userEmail) => {
    if (!window.confirm(`Revoke staff access for ${userEmail}?`)) return;
    try {
      const functions = getFunctions();
      const revokeStaffRole = httpsCallable(functions, "revokeStaffRole");
      await revokeStaffRole({ targetUserId: userId });
      await logAdminAction("STAFF_REVOKED", `Demoted ${userEmail} to Parent.`);
    } catch (error) {
      alert("Failed to revoke: " + error.message);
    }
  };

  const handleCancelInvite = async (inviteId) => {
    if (window.confirm("Cancel this pending invitation?")) {
      try {
        await deleteDoc(doc(db, "pre_approved_staff", inviteId));
        await logAdminAction("INVITE_CANCELLED", `Cancelled pending staff invite for ${inviteId}`);
      } catch (error) {
        alert("Failed to cancel invite.");
      }
    }
  };

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen rounded-2xl">
      <div className="mb-8">
        <h2 className="text-2xl font-black text-[#2D5B60] tracking-tight flex items-center gap-2">
          <Shield size={24} /> Staff & Role Management
        </h2>
        <p className="text-sm text-gray-500 mt-1">Assign roles and branches to your cashiers and registrars.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* ADD STAFF FORM */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 sticky top-6">
            <h3 className="text-sm font-bold uppercase tracking-widest text-[#2D5B60] mb-4 flex items-center gap-2">
              <UserPlus size={16}/> Add New Staff
            </h3>
            
            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase pl-1">Google / FB Email</label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input 
                    type="email" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    required 
                    className="w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl bg-gray-50 outline-none focus:border-[#2D5B60] focus:bg-white text-sm transition-all" 
                    placeholder="staff@gmail.com"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase pl-1">Role</label>
                <select 
                  value={role} 
                  onChange={e => setRole(e.target.value)}
                  className="w-full mt-1 p-3 border border-gray-200 rounded-xl bg-gray-50 outline-none focus:border-[#2D5B60] text-sm font-bold text-gray-700 cursor-pointer"
                >
                  <option value="registrar">Registrar / Cashier</option>
                  <option value="superadmin">Superadmin (Owner)</option>
                </select>
              </div>

              {role === "registrar" && (
                <div className="animate-in fade-in slide-in-from-top-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase pl-1">Assigned Branch</label>
                  <select 
                    value={branch} 
                    onChange={e => setBranch(e.target.value)}
                    className="w-full mt-1 p-3 border border-gray-200 rounded-xl bg-gray-50 outline-none focus:border-[#2D5B60] text-sm font-bold text-[#2D5B60] cursor-pointer"
                  >
                    <option value="Irosin">Irosin Branch</option>
                    <option value="Matnog">Matnog Branch</option>
                  </select>
                </div>
              )}

              <button 
                type="submit" 
                disabled={isProcessing} 
                className="w-full bg-[#2D5B60] text-white py-3 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-black transition-all shadow-md disabled:bg-gray-300 mt-2"
              >
                {isProcessing ? "Processing..." : "Grant Access"}
              </button>
            </form>
          </div>
        </div>

        {/* LISTS */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Active Staff */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-600 flex items-center gap-2">
                <CheckCircle size={16} className="text-green-500"/> Active Staff Members
              </h3>
            </div>
            <div className="divide-y divide-gray-100">
              {activeStaff.length === 0 ? (
                <p className="p-6 text-center text-sm text-gray-400 italic">No active staff found.</p>
              ) : (
                activeStaff.map(staff => (
                  <div key={staff.id} className="p-5 flex justify-between items-center hover:bg-gray-50 transition-colors">
                    <div>
                      <p className="font-bold text-gray-800">{staff.email}</p>
                      <div className="flex gap-2 mt-1">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${staff.role === 'superadmin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                          {staff.role}
                        </span>
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[9px] font-black uppercase tracking-wider">
                          Branch: {staff.branch || "ALL"}
                        </span>
                      </div>
                    </div>
                    <button onClick={() => handleRevokeActive(staff.id, staff.email)} className="text-gray-400 hover:text-red-500 p-2" title="Revoke Access">
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Pending Invites */}
          {pendingInvites.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-orange-200 overflow-hidden">
              <div className="p-5 border-b border-orange-100 bg-orange-50/50 flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-widest text-orange-700 flex items-center gap-2">
                  <Clock size={16} className="text-orange-500"/> Pending Invitations
                </h3>
              </div>
              <div className="divide-y divide-gray-100">
                {pendingInvites.map(invite => (
                  <div key={invite.id} className="p-5 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-gray-800">{invite.email}</p>
                      <div className="flex gap-2 mt-1">
                        <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-[9px] font-black uppercase tracking-wider">
                          Waiting for login...
                        </span>
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[9px] font-black uppercase tracking-wider">
                          Assigned: {invite.role} ({invite.branch})
                        </span>
                      </div>
                    </div>
                    <button onClick={() => handleCancelInvite(invite.id)} className="text-gray-400 hover:text-red-500 text-[10px] font-bold uppercase underline">
                      Cancel
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default AdminManagement;