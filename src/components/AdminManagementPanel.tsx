import React, { useState } from 'react';
import { AdminUser, UserRole } from '../types/society';
import { storageService } from '../services/storageService';
import { getLocalISOString, formatDateTime } from '../utils/dateFormatter';
import { syncAdminToSupabase, deleteAdminFromSupabase } from '../services/supabaseClient';
import { 
  ShieldCheck, 
  UserPlus, 
  Users, 
  Key, 
  Mail, 
  Phone, 
  CheckCircle2, 
  ShieldAlert, 
  GitFork, 
  Network, 
  Building, 
  Layers, 
  Info,
  Shield,
  Trash2,
  Edit3,
  Eye,
  EyeOff
} from 'lucide-react';

interface AdminManagementPanelProps {
  currentAdmin: AdminUser | null;
  currentRole?: UserRole;
  onAdminsUpdated: () => void;
}

export const AdminManagementPanel: React.FC<AdminManagementPanelProps> = ({
  currentAdmin,
  currentRole = 'Resident',
  onAdminsUpdated,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null);

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  // Password visibility toggles
  const [showAddPassword, setShowAddPassword] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);

  const [notice, setNotice] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const isSuperAdmin = currentRole === 'Management' && currentAdmin?.adminType === 'SuperAdmin';
  const admins = storageService.getAdmins();

  const superAdmins = admins.filter(a => a.adminType === 'SuperAdmin');
  const baseAdmins = admins.filter(a => a.adminType === 'BaseAdmin');

  const showTemporaryNotice = (text: string, type: 'success' | 'error' = 'success') => {
    setNotice({ text, type });
    setTimeout(() => setNotice(null), 7000);
  };

  const handleAddBaseAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !name || !phone) return;

    // Validate phone number is exactly 10 digits
    const cleanPhone = phone.trim().replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      showTemporaryNotice('⚠️ Phone number must be exactly 10 digits.', 'error');
      return;
    }

    // Check locally first
    const existingLocal = admins.find(a => a.email.toLowerCase() === email.trim().toLowerCase());
    if (existingLocal) {
      showTemporaryNotice(`⚠️ Admin account for ${email} already exists in local cache.`, 'error');
      return;
    }

    const adminSignature = currentAdmin 
      ? `Super Admin (${currentAdmin.name})`
      : 'Super Admin';

    const newBaseAdmin: AdminUser = {
      id: `admin-base-${Date.now().toString().slice(-4)}`,
      email: email.trim().toLowerCase(),
      passwordHash: password,
      name: name.trim(),
      phone: cleanPhone,
      adminType: 'BaseAdmin',
      createdAt: getLocalISOString(),
      createdBy: adminSignature,
    };

    // 1. Sync to Supabase database first to check database unique constraint duplication
    const syncRes = await syncAdminToSupabase(newBaseAdmin);
    if (syncRes === 'duplicate') {
      showTemporaryNotice(`⚠️ Database Error: Admin account with user ID "${email}" already exists.`, 'error');
      return;
    }

    if (syncRes === false) {
      showTemporaryNotice(`⚠️ Sync Error: Could not verify database connection, saved to local cache only.`, 'error');
    }

    // 2. Save locally
    const updated = [...admins, newBaseAdmin];
    storageService.saveAdmins(updated);
    onAdminsUpdated();

    showTemporaryNotice(`✅ Base Admin "${name}" (${email}) successfully registered by Super Admin.`);
    
    setEmail('');
    setPassword('');
    setName('');
    setPhone('');
    setShowAddModal(false);
  };

  const handleOpenEditModal = (admin: AdminUser) => {
    setEditingAdmin(admin);
    setName(admin.name);
    setEmail(admin.email);
    setPassword(admin.passwordHash); // Show existing cached password
    setPhone(admin.phone || '');
    setShowEditModal(true);
  };

  const handleSaveEditAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAdmin || !email || !password || !name || !phone) return;

    // Validate phone number is exactly 10 digits
    const cleanPhone = phone.trim().replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      showTemporaryNotice('⚠️ Phone number must be exactly 10 digits.', 'error');
      return;
    }

    // Check if any fields actually changed
    const hasChanges = 
      name.trim() !== editingAdmin.name ||
      email.trim().toLowerCase() !== editingAdmin.email.toLowerCase() ||
      password !== editingAdmin.passwordHash ||
      cleanPhone !== (editingAdmin.phone || '');

    if (!hasChanges) {
      showTemporaryNotice('⚠️ Validation: No changes detected. Please modify the fields before saving.', 'error');
      return;
    }

    // Check database level email duplicacy (if changed)
    if (email.trim().toLowerCase() !== editingAdmin.email.toLowerCase()) {
      const existingOther = admins.find(a => a.id !== editingAdmin.id && a.email.toLowerCase() === email.trim().toLowerCase());
      if (existingOther) {
        showTemporaryNotice(`⚠️ User ID "${email}" is already used by another admin.`, 'error');
        return;
      }
    }

    const adminSignature = currentAdmin 
      ? `Super Admin (${currentAdmin.name})`
      : 'Super Admin';

    const updatedAdmin: AdminUser = {
      ...editingAdmin,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      passwordHash: password, // SuperAdmin can edit password offline as requested
      phone: cleanPhone,
      updatedAt: getLocalISOString(),
      updatedBy: adminSignature,
    };

    // Sync update to Supabase
    const syncRes = await syncAdminToSupabase(updatedAdmin);
    if (syncRes === 'duplicate') {
      showTemporaryNotice(`⚠️ Database Error: User ID "${email}" already exists.`, 'error');
      return;
    }

    // Save locally
    const updatedAdmins = admins.map(a => a.id === editingAdmin.id ? updatedAdmin : a);
    storageService.saveAdmins(updatedAdmins);
    onAdminsUpdated();

    showTemporaryNotice(`✅ Changes done successfully!`);
    setShowEditModal(false);
    setEditingAdmin(null);
  };

  const handleDeleteAdmin = async (id: string, adminName: string) => {
    if (confirm(`Are you sure you want to revoke admin privileges for "${adminName}"?`)) {
      // 1. Remove from database
      await deleteAdminFromSupabase(id);

      // 2. Remove locally
      const updatedAdmins = admins.filter(a => a.id !== id);
      storageService.saveAdmins(updatedAdmins);
      onAdminsUpdated();

      showTemporaryNotice(`🗑️ Revoked privileges for Admin "${adminName}".`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Resident Public Transparency Banner */}
      {currentRole === 'Resident' && (
        <div className="p-4 bg-sky-950/80 border border-sky-500/50 rounded-2xl flex items-start gap-3 text-xs text-sky-200 shadow-xl">
          <Info className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-white block">Resident Transparency Mode Enabled:</span>
            As a resident of Vaishnavi Pride, you have full visibility to inspect the complete Management Hierarchy, including designated Super Admins (<strong>AKSHAY KUMAR SHUKLA</strong> & <strong>ASHISH SHUKLA</strong>) and Base Admins.
          </div>
        </div>
      )}

      {/* Notice Banner */}
      {notice && (
        <div className={`p-4 border rounded-2xl flex items-center gap-3 text-xs shadow-lg ${
          notice.type === 'success' 
            ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-200' 
            : 'bg-rose-950/80 border-rose-500/60 text-rose-200'
        }`}>
          <CheckCircle2 className={`w-5 h-5 shrink-0 ${notice.type === 'success' ? 'text-emerald-400' : 'text-rose-400'}`} />
          <span>{notice.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 glass-panel border-indigo-500/30">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Network className="w-6 h-6 text-sky-400" />
            Hierarchical Governance & Admin Tree Graph
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Super Admins control society registration, security directory access, and base admin privileges.
          </p>
        </div>

        {isSuperAdmin ? (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
          >
            <UserPlus className="w-4 h-4" />
            Add New Base Admin
          </button>
        ) : (
          <div className="px-3.5 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-slate-400 flex items-center gap-1.5 font-medium">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span>Admin registration reserved for Super Admins</span>
          </div>
        )}
      </div>

      {/* HIERARCHICAL TREE GRAPH VISUALIZATION */}
      <div className="glass-panel p-6 space-y-6 overflow-x-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <GitFork className="w-5 h-5 text-indigo-400" />
            Organizational Tree Diagram
          </h3>
          <span className="text-xs text-slate-400 font-mono">2-Tier Role Authority Model</span>
        </div>

        {/* Tree Render */}
        <div className="min-w-[650px] flex flex-col items-center space-y-8 py-4">
          
          {/* Level 1: Root Node */}
          <div className="flex flex-col items-center">
            <div className="px-6 py-2.5 bg-gradient-to-r from-indigo-900 to-sky-900 border border-indigo-500/60 rounded-2xl text-center shadow-xl shadow-indigo-500/20">
              <span className="text-[10px] uppercase tracking-widest font-extrabold text-sky-300 block">Root Level 0</span>
              <span className="text-sm font-bold text-white flex items-center gap-1.5 justify-center">
                <Building className="w-4 h-4 text-sky-400" />
                Vaishnavi Pride Governing Apex Body
              </span>
            </div>
            {/* Connecting Vertical Line */}
            <div className="w-0.5 h-8 bg-indigo-500/60"></div>
          </div>

          {/* Level 2: Super Admins Layer */}
          <div className="w-full flex flex-col items-center">
            <span className="text-[11px] font-bold text-sky-400 uppercase tracking-wider mb-3 flex items-center gap-1">
              <Shield className="w-3.5 h-3.5" />
              Level 1: Super Admin Root Nodes (Exclusive Member Registration Rights)
            </span>

            {/* Horizontal Branch Bar */}
            <div className="relative flex justify-center items-center w-3/4 max-w-2xl">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-sky-500/50"></div>
            </div>

            <div className="grid grid-cols-2 gap-8 w-full max-w-2xl pt-4">
              {superAdmins.map((superAdmin) => (
                <div key={superAdmin.id} className="relative p-4 bg-slate-900/90 border border-sky-500/60 rounded-2xl shadow-xl flex flex-col items-center text-center space-y-2 ring-1 ring-sky-500/30">
                  <div className="w-3 h-3 bg-sky-400 rounded-full absolute -top-1.5 shadow-md shadow-sky-400"></div>
                  
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-sky-500/20 text-sky-300 border border-sky-500/40">
                    SUPER ADMIN
                  </span>

                  <h4 className="font-extrabold text-white text-sm">{superAdmin.name}</h4>
                  <p className="text-xs text-sky-300 font-mono">{superAdmin.email}</p>
                  <span className="text-[10px] text-slate-400">ID: {superAdmin.id}</span>
                </div>
              ))}
            </div>

            {/* Vertical Line down to Base Layer */}
            <div className="w-0.5 h-8 bg-indigo-500/60 mt-4"></div>
          </div>

          {/* Level 3: Base Admins Layer */}
          <div className="w-full flex flex-col items-center">
            <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider mb-3 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5" />
              Level 2: Base Admin Execution Layer ({baseAdmins.length} Members Registered)
            </span>

            {/* Horizontal Connector Line for Base Admins */}
            {baseAdmins.length > 0 && (
              <div className="relative flex justify-center items-center w-5/6">
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-indigo-500/50"></div>
              </div>
            )}

            {baseAdmins.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-900/20 border border-slate-800 text-slate-500 text-xs text-center min-w-[200px] mt-2">
                No Base Admins registered yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-4xl pt-4">
                {baseAdmins.map((baseAdmin) => (
                  <div key={baseAdmin.id} className="relative p-5 bg-slate-950/80 border border-indigo-500/40 rounded-xl space-y-2 text-center flex flex-col items-center group">
                    <div className="w-2.5 h-2.5 bg-indigo-400 rounded-full absolute -top-1.5 shadow-md"></div>
                    
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-indigo-500/20 text-indigo-300">
                      BASE ADMIN
                    </span>

                    <h4 className="font-bold text-white text-xs">{baseAdmin.name}</h4>
                    <p className="text-[11px] text-indigo-300 font-mono">{baseAdmin.email}</p>
                    
                    {baseAdmin.phone && (
                      <p className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-500" /> {baseAdmin.phone}
                      </p>
                    )}

                    {/* Admin Audit Trail - ONLY visible to Management role */}
                    {currentRole === 'Management' && (
                      <div className="pt-2 border-t border-slate-900/50 w-full text-[9px] text-slate-500 font-mono flex flex-col gap-0.5 text-left">
                        <div>
                          <span className="text-slate-600">Added:</span> {baseAdmin.createdAt ? formatDateTime(baseAdmin.createdAt) : 'N/A'}
                        </div>
                        {baseAdmin.createdBy && (
                          <div>
                            <span className="text-slate-600">By:</span> {baseAdmin.createdBy}
                          </div>
                        )}
                        {baseAdmin.updatedAt && (
                          <div className="text-sky-400/70 border-t border-slate-900/30 pt-1 mt-1">
                            <div><span className="text-sky-400/50">Edited:</span> {formatDateTime(baseAdmin.updatedAt)}</div>
                            {baseAdmin.updatedBy && <div><span className="text-sky-400/50">By:</span> {baseAdmin.updatedBy}</div>}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Super Admin Manage Controls */}
                    {isSuperAdmin && (
                      <div className="flex gap-2 pt-2 border-t border-slate-900 w-full justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleOpenEditModal(baseAdmin)}
                          className="flex items-center gap-1 px-2.5 py-1 bg-sky-600/20 hover:bg-sky-600/40 border border-sky-500/30 text-sky-400 rounded-lg text-[10px] font-bold"
                          title="Edit Admin (Reset Password)"
                        >
                          <Edit3 className="w-3 h-3" /> Edit
                        </button>
                        <button
                          onClick={() => handleDeleteAdmin(baseAdmin.id, baseAdmin.name)}
                          className="flex items-center gap-1 px-2.5 py-1 bg-rose-600/20 hover:bg-rose-600/40 border border-rose-500/30 text-rose-400 rounded-lg text-[10px] font-bold"
                          title="Revoke Admin Access"
                        >
                          <Trash2 className="w-3 h-3" /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Add Base Admin Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-lg p-6 space-y-5">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-400" />
                Register New Base Admin Member
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <p className="text-xs text-slate-300">
              Super Admin Privilege: Base Admins can perform society management operations (resolving tickets, approving payments, logging expenses, posting announcements) but cannot add other admins.
            </p>

            <form onSubmit={handleAddBaseAdmin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Suresh Kumar (Treasurer)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Admin Email (User ID) *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. treasurer@vaishnavipride.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                  <Key className="w-3.5 h-3.5 text-indigo-400" />
                  Password *
                </label>
                <div className="relative">
                  <input
                    type={showAddPassword ? "text" : "password"}
                    required
                    placeholder="Set initial password..."
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-3.5 pr-10 py-2 text-xs text-white outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAddPassword(!showAddPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                    title={showAddPassword ? "Hide Password" : "Show Password"}
                  >
                    {showAddPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Phone Number *</label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  pattern="\d{10}"
                  placeholder="e.g. 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30"
                >
                  Register Base Admin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Admin Modal */}
      {showEditModal && editingAdmin && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-lg p-6 space-y-5">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-sky-400" />
                Edit Admin / Reset Password
              </h3>
              <button onClick={() => { setShowEditModal(false); setEditingAdmin(null); }} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSaveEditAdmin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Admin Email (User ID) *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                  <Key className="w-3.5 h-3.5 text-indigo-400" />
                  Password (Reset requested offline) *
                </label>
                <div className="relative">
                  <input
                    type={showEditPassword ? "text" : "password"}
                    required
                    placeholder="Enter new password..."
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-3.5 pr-10 py-2 text-xs text-white outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditPassword(!showEditPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                    title={showEditPassword ? "Hide Password" : "Show Password"}
                  >
                    {showEditPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Phone Number *</label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  pattern="\d{10}"
                  placeholder="e.g. 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => { setShowEditModal(false); setEditingAdmin(null); }}
                  className="px-4 py-2 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-sky-600/30"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
