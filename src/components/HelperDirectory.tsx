import React, { useState, useEffect } from 'react';
import { HelperPerson, HelperCategory, UserRole, AdminUser } from '../types/society';
import { storageService } from '../services/storageService';
import { getLocalISOString } from '../utils/dateFormatter';
import { 
  Wrench, 
  Zap, 
  Sparkles, 
  Hammer, 
  Paintbrush, 
  Tv, 
  Bug, 
  Shield, 
  Phone, 
  MessageSquare, 
  Plus, 
  Search, 
  Clock, 
  Star, 
  Trash2, 
  Edit3, 
  X, 
  UserCheck, 
  CheckCircle2,
  HeartHandshake,
  HelpCircle,
  AlertTriangle
} from 'lucide-react';

interface HelperDirectoryProps {
  currentRole: UserRole;
  currentAdmin: AdminUser | null;
}

const CATEGORY_CONFIG: Record<HelperCategory, { icon: any; color: string; bg: string }> = {
  Plumber: { icon: Wrench, color: 'text-sky-400', bg: 'bg-sky-500/10 border-sky-500/30' },
  Electrician: { icon: Zap, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30' },
  Housekeeping: { icon: Sparkles, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' },
  Carpenter: { icon: Hammer, color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/30' },
  Painter: { icon: Paintbrush, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/30' },
  'Appliance Repair': { icon: Tv, color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/30' },
  'Pest Control': { icon: Bug, color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/30' },
  'Driver & Security': { icon: Shield, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/30' },
  Other: { icon: HelpCircle, color: 'text-teal-400', bg: 'bg-teal-500/10 border-teal-500/30' },
};

export const HelperDirectory: React.FC<HelperDirectoryProps> = ({ currentRole, currentAdmin }) => {
  const [helpers, setHelpers] = useState<HelperPerson[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingHelper, setEditingHelper] = useState<HelperPerson | null>(null);
  
  // Custom Centered Deletion Confirmation Modal State
  const [deletingHelper, setDeletingHelper] = useState<HelperPerson | null>(null);

  // STRICT PERMISSION RULE: ONLY authenticated Management Admins (SuperAdmin or BaseAdmin) can add, edit, or delete helpers
  const canManage = currentRole === 'Management' && currentAdmin !== null;

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    category: 'Plumber' as HelperCategory,
    phone: '', // Raw 10 digits
    secondaryPhone: '', // Raw 10 digits
    workingHours: '09:00 AM - 07:00 PM',
    experienceYears: 5,
    rating: 4.8,
    notes: '',
  });

  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    loadHelpers();
    storageService.syncWithSupabaseDatabase();

    const syncInterval = setInterval(() => {
      storageService.syncWithSupabaseDatabase();
    }, 5000);

    const handleUpdate = () => loadHelpers();
    window.addEventListener('society_helpers_updated', handleUpdate);

    return () => {
      clearInterval(syncInterval);
      window.removeEventListener('society_helpers_updated', handleUpdate);
    };
  }, []);

  const loadHelpers = () => {
    setHelpers(storageService.getHelpers());
  };

  const handleOpenAdd = () => {
    if (!canManage) return;
    setEditingHelper(null);
    setPhoneError(null);
    const initialCategory: HelperCategory = selectedCategory !== 'ALL' 
      ? (selectedCategory as HelperCategory) 
      : 'Plumber';

    setFormData({
      name: '',
      category: initialCategory,
      phone: '',
      secondaryPhone: '',
      workingHours: '09:00 AM - 07:00 PM',
      experienceYears: 5,
      rating: 4.8,
      notes: '',
    });
    setShowAddModal(true);
  };

  const handleOpenEdit = (helper: HelperPerson) => {
    if (!canManage) return;
    setEditingHelper(helper);
    setPhoneError(null);
    
    // Strip non-digits for editing form input
    const cleanPhone = helper.phone.replace(/[^0-9]/g, '').slice(-10);
    const cleanSecondary = helper.secondaryPhone ? helper.secondaryPhone.replace(/[^0-9]/g, '').slice(-10) : '';

    setFormData({
      name: helper.name,
      category: helper.category,
      phone: cleanPhone,
      secondaryPhone: cleanSecondary,
      workingHours: helper.workingHours,
      experienceYears: helper.experienceYears || 5,
      rating: helper.rating || 4.8,
      notes: helper.notes || '',
    });
    setShowAddModal(true);
  };

  // Enforce numeric-only phone input
  const handlePhoneChange = (val: string, field: 'phone' | 'secondaryPhone') => {
    const digitsOnly = val.replace(/[^0-9]/g, '').slice(0, 10);
    setFormData(prev => ({ ...prev, [field]: digitsOnly }));
    if (field === 'phone') {
      if (digitsOnly.length > 0 && digitsOnly.length < 10) {
        setPhoneError('Phone number must be exactly 10 digits.');
      } else {
        setPhoneError(null);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) return;
    if (!formData.name.trim()) return;

    if (formData.phone.length !== 10) {
      setPhoneError('Please enter a valid 10-digit mobile number.');
      return;
    }

    const formatPhone = (raw: string) => {
      if (raw.length === 10) {
        return `+91 ${raw.slice(0, 5)} ${raw.slice(5)}`;
      }
      return raw;
    };

    const formattedPhone = formatPhone(formData.phone);
    const formattedSecondary = formData.secondaryPhone ? formatPhone(formData.secondaryPhone) : undefined;

    const adminSignature = currentAdmin 
      ? (currentAdmin.adminType === 'SuperAdmin' ? 'SuperAdmin' : 'Admin')
      : 'SuperAdmin';

    if (editingHelper) {
      const updated = helpers.map(h => h.id === editingHelper.id ? {
        ...h,
        name: formData.name.trim(),
        category: formData.category,
        phone: formattedPhone,
        secondaryPhone: formattedSecondary,
        workingHours: formData.workingHours.trim(),
        experienceYears: Number(formData.experienceYears),
        rating: Number(formData.rating),
        notes: formData.notes.trim() || undefined,
      } : h);
      storageService.saveHelpers(updated);
      setNotification(`Updated helper record for ${formData.name}`);
    } else {
      const newHelper: HelperPerson = {
        id: `hlp-${Date.now()}`,
        name: formData.name.trim(),
        category: formData.category,
        phone: formattedPhone,
        secondaryPhone: formattedSecondary,
        workingHours: formData.workingHours.trim(),
        experienceYears: Number(formData.experienceYears),
        rating: Number(formData.rating),
        notes: formData.notes.trim() || undefined,
        addedByAdminName: adminSignature,
        addedAt: getLocalISOString(),
      };
      storageService.saveHelpers([newHelper, ...helpers]);
      setNotification(`Added new helper: ${formData.name}`);
    }

    setShowAddModal(false);
    setTimeout(() => setNotification(null), 4000);
  };

  // Perform actual deletion after custom modal confirmation
  const handleConfirmDelete = () => {
    if (!deletingHelper || !canManage) return;
    const name = deletingHelper.name;
    const targetId = deletingHelper.id;
    storageService.deleteHelper(targetId);
    setDeletingHelper(null);
    setNotification(`Successfully deleted ${name} and all associated records from directory & Supabase.`);
    setTimeout(() => setNotification(null), 4000);
  };

  const filteredHelpers = helpers.filter(h => {
    const matchesCategory = selectedCategory === 'ALL' || h.category === selectedCategory;
    const matchesSearch = 
      h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.phone.includes(searchQuery) ||
      (h.notes && h.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const categories: HelperCategory[] = [
    'Plumber',
    'Electrician',
    'Housekeeping',
    'Carpenter',
    'Painter',
    'Appliance Repair',
    'Pest Control',
    'Driver & Security',
    'Other',
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* HEADER BANNER */}
      <div className="glass-panel p-8 space-y-4 border-sky-500/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30 mb-2">
              <HeartHandshake className="w-3.5 h-3.5 text-sky-400" />
              Verified Society Household Assistance
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              Helper People Directory
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl mt-1">
              Direct access to verified plumbers, electricians, maids, carpenters, appliance technicians, and household help for Vaishnavi Pride residents.
            </p>
          </div>

          {/* MAIN BUTTON: ALWAYS "Add Helper" (ONLY SHOWN TO AUTHENTICATED MANAGEMENT ADMINS) */}
          {canManage && (
            <button
              onClick={handleOpenAdd}
              className="px-5 py-3 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white rounded-2xl text-xs font-bold shadow-lg shadow-sky-600/30 flex items-center gap-2 transition-transform hover:scale-105"
            >
              <Plus className="w-4 h-4 text-white" />
              Add Helper
            </button>
          )}
        </div>
      </div>

      {/* NOTIFICATION TOAST */}
      {notification && (
        <div className="p-4 bg-emerald-950/90 border border-emerald-500/40 text-emerald-200 rounded-2xl text-xs font-semibold flex items-center gap-3 animate-in fade-in duration-200 shadow-xl">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* SEARCH BAR & CATEGORY FILTER TABS */}
      <div className="space-y-4">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="relative flex-1 min-w-[260px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, category, phone, or service..."
              className="w-full bg-slate-900/90 border border-slate-700/80 focus:border-sky-500 rounded-2xl pl-11 pr-4 py-3 text-xs text-white placeholder-slate-500 outline-none transition-all shadow-inner"
            />
          </div>

          <div className="text-xs text-slate-400 font-medium">
            Showing <strong className="text-sky-400">{filteredHelpers.length}</strong> of {helpers.length} verified helpers
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-2 pt-2">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              selectedCategory === 'ALL'
                ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/30 ring-1 ring-sky-400'
                : 'bg-slate-900/80 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800'
            }`}
          >
            All Categories ({helpers.length})
          </button>

          {categories.map((cat) => {
            const Config = CATEGORY_CONFIG[cat] || CATEGORY_CONFIG.Other;
            const Icon = Config.icon;
            const count = helpers.filter(h => h.category === cat).length;
            const isSelected = selectedCategory === cat;

            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
                  isSelected
                    ? 'bg-gradient-to-r from-sky-900 to-indigo-900 text-white border-sky-400 shadow-md ring-1 ring-sky-400'
                    : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 border-slate-800'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${Config.color}`} />
                <span>{cat}</span>
                <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px] text-slate-400">
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* HELPER CARDS GRID */}
      {filteredHelpers.length === 0 ? (
        <div className="glass-panel p-12 text-center space-y-4 border-slate-800">
          <UserCheck className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">No Helpers Found</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            No matching helper records found in {selectedCategory === 'ALL' ? 'the directory' : `${selectedCategory} section`}.
          </p>
          {canManage && (
            <button
              onClick={handleOpenAdd}
              className="mt-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-md"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Helper
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredHelpers.map((helper) => {
            const Config = CATEGORY_CONFIG[helper.category] || CATEGORY_CONFIG.Other;
            const Icon = Config.icon;

            return (
              <div
                key={helper.id}
                className="glass-panel p-6 space-y-4 hover-glow-card border-slate-800 hover:border-sky-500/50 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Top Bar: Category Badge & Admin Actions */}
                  <div className="flex items-center justify-between gap-2">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-extrabold border ${Config.bg} ${Config.color}`}>
                      <Icon className="w-3.5 h-3.5" />
                      {helper.category}
                    </span>

                    {/* ONLY SHOW EDIT/DELETE FOR AUTHENTICATED MANAGEMENT ADMINS */}
                    {canManage && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(helper)}
                          className="p-1.5 text-slate-400 hover:text-sky-300 hover:bg-slate-800 rounded-lg transition-colors"
                          title="Edit Helper Details"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingHelper(helper)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                          title="Delete Helper"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Helper Name & Rating */}
                  <div>
                    <h3 className="text-xl font-bold text-white flex items-center justify-between">
                      <span>{helper.name}</span>
                      {helper.rating && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          {helper.rating}
                        </span>
                      )}
                    </h3>
                    {helper.experienceYears && (
                      <span className="text-[11px] font-medium text-slate-400">
                        {helper.experienceYears} Years Experience in High-Rise Servicing
                      </span>
                    )}
                  </div>

                  {/* Working Hours */}
                  <div className="flex items-center gap-2 text-xs text-slate-300 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
                    <Clock className="w-4 h-4 text-sky-400 shrink-0" />
                    <span>Working Hours: <strong className="text-white">{helper.workingHours}</strong></span>
                  </div>

                  {/* Notes / Specialization */}
                  {helper.notes && (
                    <p className="text-xs text-slate-400 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 leading-relaxed">
                      "{helper.notes}"
                    </p>
                  )}
                </div>

                {/* Bottom Contact Actions */}
                <div className="pt-4 border-t border-slate-800/80 space-y-2">
                  <a
                    href={`tel:${helper.phone.replace(/\s+/g, '')}`}
                    className="w-full px-4 py-3 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-sky-600/30 flex items-center justify-center gap-2 transition-transform hover:scale-[1.02]"
                  >
                    <Phone className="w-4 h-4 text-white" />
                    Call {helper.phone}
                  </a>

                  {/* Verified by Admin or Super Admin credit signature (NO NAME) */}
                  <div className="text-[11px] text-slate-400 text-center pt-2 border-t border-slate-800/80 flex items-center justify-center gap-1.5 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>
                      Verified by <strong className="text-slate-200">{helper.addedByAdminName.includes('Super') ? 'SuperAdmin' : 'Admin'}</strong>
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ADD / EDIT HELPER MODAL POPUP (ALWAYS "Add Helper") */}
      {showAddModal && canManage && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-lg p-6 space-y-5 border-sky-500/40 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <HeartHandshake className="w-5 h-5 text-sky-400" />
                {editingHelper ? 'Edit Helper Details' : 'Add Helper'}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Helper Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Ramesh Plumber"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-sky-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Helper Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as HelperCategory })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-sky-500 outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c === 'Other' ? 'Other (Unspecified Category)' : c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* PHONE INPUTS WITH NUMERIC-ONLY VALIDATION */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Phone Number (Numbers Only, 10 Digits) *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={10}
                    value={formData.phone}
                    onChange={(e) => handlePhoneChange(e.target.value, 'phone')}
                    placeholder="e.g. 9823011223"
                    className={`w-full bg-slate-900 border ${phoneError ? 'border-rose-500 ring-1 ring-rose-500/50' : 'border-slate-700'} rounded-xl px-3 py-2 text-xs text-white focus:border-sky-500 outline-none font-mono`}
                  />
                  {phoneError && (
                    <p className="text-[10px] text-rose-400 mt-1">{phoneError}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Secondary Phone (Numbers Only, Optional)
                  </label>
                  <input
                    type="text"
                    maxLength={10}
                    value={formData.secondaryPhone}
                    onChange={(e) => handlePhoneChange(e.target.value, 'secondaryPhone')}
                    placeholder="e.g. 9823099887"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-sky-500 outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Working Hours
                  </label>
                  <input
                    type="text"
                    value={formData.workingHours}
                    onChange={(e) => setFormData({ ...formData, workingHours: e.target.value })}
                    placeholder="08:00 AM - 08:00 PM"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-sky-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Rating (1 to 5)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    value={formData.rating}
                    onChange={(e) => setFormData({ ...formData, rating: parseFloat(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-sky-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Specialization Notes / Scope of Work
                </label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="e.g. Tap leakage repair, water tank valve replacement, motor servicing..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white focus:border-sky-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-sky-600/40"
                >
                  {editingHelper ? 'Save Changes' : 'Add Helper'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CUSTOM CENTERED DELETION CONFIRMATION POPUP MODAL */}
      {deletingHelper && canManage && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md p-6 space-y-4 border-rose-500/40 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <span className="p-2 bg-rose-500/20 text-rose-300 rounded-xl border border-rose-500/30">
                <AlertTriangle className="w-6 h-6 text-rose-400" />
              </span>
              <div>
                <h3 className="font-bold text-white text-base">Confirm Helper Deletion</h3>
                <p className="text-xs text-slate-400">Admin Management Action</p>
              </div>
            </div>

            <p className="text-xs text-slate-200 leading-relaxed">
              Are you sure you want to delete <strong className="text-white font-bold">{deletingHelper.name}</strong> ({deletingHelper.category}) with all associated data?
            </p>

            <div className="p-3 bg-rose-950/40 border border-rose-500/20 rounded-xl text-[11px] text-rose-300 space-y-1">
              <p>⚠️ <strong>Warning:</strong> This action is permanent.</p>
              <p>The helper entry and contact numbers will be completely removed from the society directory for all 154 flat units.</p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setDeletingHelper(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-600/40 flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Yes, Delete Helper & Associated Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
