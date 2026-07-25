import React, { useState } from 'react';
import { EmergencyContact, UserRole, Flat, AdminUser } from '../types/society';
import {
  PhoneCall,
  Bell,
  ShieldAlert,
  Zap,
  Flame,
  Droplets,
  CheckCircle2,
  WifiOff,
  Radio,
  Plus,
  Pencil,
  Trash2,
  X,
  Phone,
  Shield,
  Wrench,
  HeartPulse,
  Users,
  Tag,
  Briefcase,
  Clock,
  User,
  AlertTriangle,
} from 'lucide-react';
import { sendSOSPushNotification, getSubscriberCount } from '../services/oneSignalService';

// ─────────────────────────────────────────────────────────────────────────────
// Constants & helpers (module-level so they are stable across renders)
// ─────────────────────────────────────────────────────────────────────────────
const CATEGORY_OPTIONS = [
  'Security', 'Maintenance', 'Emergency Services', 'Management',
  'Utility', 'Medical', 'Fire & Safety', 'Other',
];

const CATEGORY_CONFIG: Record<string, { bg: string; text: string; border: string; icon: React.ReactNode }> = {
  'Security':           { bg: 'bg-sky-500/15',     text: 'text-sky-300',     border: 'border-sky-500/30',     icon: <Shield    className="w-3.5 h-3.5" /> },
  'Maintenance':        { bg: 'bg-amber-500/15',   text: 'text-amber-300',   border: 'border-amber-500/30',   icon: <Wrench    className="w-3.5 h-3.5" /> },
  'Emergency Services': { bg: 'bg-rose-500/15',    text: 'text-rose-300',    border: 'border-rose-500/30',    icon: <HeartPulse className="w-3.5 h-3.5" /> },
  'Management':         { bg: 'bg-violet-500/15',  text: 'text-violet-300',  border: 'border-violet-500/30',  icon: <Users     className="w-3.5 h-3.5" /> },
  'Medical':            { bg: 'bg-emerald-500/15', text: 'text-emerald-300', border: 'border-emerald-500/30', icon: <HeartPulse className="w-3.5 h-3.5" /> },
  'Fire & Safety':      { bg: 'bg-orange-500/15',  text: 'text-orange-300',  border: 'border-orange-500/30',  icon: <Flame     className="w-3.5 h-3.5" /> },
  'Utility':            { bg: 'bg-cyan-500/15',    text: 'text-cyan-300',    border: 'border-cyan-500/30',    icon: <Zap       className="w-3.5 h-3.5" /> },
  'Other':              { bg: 'bg-slate-500/15',   text: 'text-slate-300',   border: 'border-slate-500/30',   icon: <Tag       className="w-3.5 h-3.5" /> },
};

function getCategoryConfig(category: string) {
  return CATEGORY_CONFIG[category] ?? CATEGORY_CONFIG['Other'];
}

// ─────────────────────────────────────────────────────────────────────────────
// ContactFormModal — defined at MODULE LEVEL so React never recreates its type
// ─────────────────────────────────────────────────────────────────────────────
interface ContactFormValues {
  name: string;
  phone: string;
  category: string;
  categoryInfo: string;
  workType: string;
}

interface ContactFormModalProps {
  title: string;
  form: ContactFormValues;
  onChange: (updated: ContactFormValues) => void;
  onSave: () => void;
  onCancel: () => void;
  formError: string;
}

const ContactFormModal: React.FC<ContactFormModalProps> = ({
  title, form, onChange, onSave, onCancel, formError,
}) => {
  const set = (key: keyof ContactFormValues) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    if (key === 'phone') {
      // Strip non-digits, cap at 10 characters
      const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 10);
      onChange({ ...form, phone: digitsOnly });
    } else {
      onChange({ ...form, [key]: e.target.value });
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backdropFilter: 'blur(6px)', backgroundColor: 'rgba(0,0,0,0.75)' }}
    >
      <div className="glass-panel w-full max-w-lg p-6 space-y-4 shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <PhoneCall className="w-5 h-5 text-rose-400" />
            {title}
          </h3>
          <button
            onClick={onCancel}
            className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error */}
        {formError && (
          <div className="p-3 bg-rose-950/60 border border-rose-500/40 rounded-xl text-xs text-rose-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" /> {formError}
          </div>
        )}

        <div className="space-y-3">
          {/* Person Name */}
          <div>
            <label className="text-xs text-slate-400 font-semibold block mb-1.5">
              Person Name <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
              <input
                autoComplete="off"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/30 outline-none transition-all"
                placeholder="e.g. Rajesh Sharma"
                value={form.name}
                onChange={set('name')}
              />
            </div>
          </div>

          {/* Mobile Number */}
          <div>
            <label className="text-xs text-slate-400 font-semibold block mb-1.5">
              Mobile Number <span className="text-rose-400">*</span>
              <span className="ml-2 font-normal text-slate-500">(10 digits only)</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
              <input
                autoComplete="off"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/30 outline-none transition-all"
                placeholder="10-digit mobile number"
                value={form.phone}
                onChange={set('phone')}
                maxLength={10}
                inputMode="numeric"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="text-xs text-slate-400 font-semibold block mb-1.5">
              Category <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
              <select
                className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:border-rose-500 focus:ring-1 focus:ring-rose-500/30 outline-none appearance-none transition-all"
                value={form.category}
                onChange={set('category')}
              >
                {CATEGORY_OPTIONS.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Category Info */}
          <div>
            <label className="text-xs text-slate-400 font-semibold block mb-1.5">
              Category Info <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
              <input
                autoComplete="off"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/30 outline-none transition-all"
                placeholder="e.g. Main Security Gate Desk"
                value={form.categoryInfo}
                onChange={set('categoryInfo')}
              />
            </div>
          </div>

          {/* Work Type */}
          <div>
            <label className="text-xs text-slate-400 font-semibold block mb-1.5">
              Work Type <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
              <input
                autoComplete="off"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/30 outline-none transition-all"
                placeholder="e.g. 24/7 Gate Guard"
                value={form.workType}
                onChange={set('workType')}
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-xl text-xs font-semibold transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-rose-600/30 transition-all"
          >
            <CheckCircle2 className="w-4 h-4" /> Save Contact
          </button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// DeleteConfirmModal — module-level
// ─────────────────────────────────────────────────────────────────────────────
interface DeleteConfirmModalProps {
  contact: EmergencyContact;
  onConfirm: () => void;
  onCancel: () => void;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({ contact, onConfirm, onCancel }) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center p-4"
    style={{ backdropFilter: 'blur(6px)', backgroundColor: 'rgba(0,0,0,0.75)' }}
  >
    <div className="glass-panel w-full max-w-sm p-6 space-y-4 text-center shadow-2xl">
      <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center">
        <Trash2 className="w-7 h-7 text-rose-400" />
      </div>
      <div>
        <h3 className="text-white font-bold text-base">Delete Contact?</h3>
        <p className="text-slate-400 text-xs mt-2 leading-relaxed">
          Remove <span className="text-white font-semibold">{contact.name}</span> from the
          Critical Contact Directory? This cannot be undone.
        </p>
      </div>
      <div className="flex justify-center gap-3 pt-1">
        <button
          onClick={onCancel}
          className="px-5 py-2 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-xl text-xs font-semibold transition-all"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-rose-600/30 transition-all"
        >
          <Trash2 className="w-4 h-4" /> Delete
        </button>
      </div>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
interface EmergencyDirectoryProps {
  contacts: EmergencyContact[];
  currentFlat: Flat;
  currentRole: UserRole;
  currentAdmin: AdminUser | null;
  onAddContact: (data: Omit<EmergencyContact, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>) => void;
  onUpdateContact: (id: string, data: Omit<EmergencyContact, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>) => void;
  onDeleteContact: (id: string) => void;
}

const EMPTY_FORM: ContactFormValues = {
  name: '', phone: '', category: 'Security', categoryInfo: '', workType: '',
};

export const EmergencyDirectory: React.FC<EmergencyDirectoryProps> = ({
  contacts,
  currentFlat,
  currentRole,
  onAddContact,
  onUpdateContact,
  onDeleteContact,
}) => {
  // ── SOS Broadcast ──────────────────────────────────────────────────────────
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastType, setBroadcastType] = useState<'FIRE' | 'POWER' | 'WATER' | 'GENERAL'>('WATER');
  const [sentNotice, setSentNotice]   = useState<string | null>(null);
  const [telegramStatus, setTelegramStatus] = useState<string | null>(null);
  const [isSending, setIsSending]     = useState(false);
  const [subscriberCount, setSubscriberCount] = useState<number | null>(null);

  // Load subscriber count on mount
  React.useEffect(() => {
    getSubscriberCount().then(count => {
      if (count > 0) setSubscriberCount(count);
    });
  }, []);

  // ── Directory CRUD ─────────────────────────────────────────────────────────
  const isAdmin = currentRole === 'Management';
  const [showAddModal, setShowAddModal]       = useState(false);
  const [editingContact, setEditingContact]   = useState<EmergencyContact | null>(null);
  const [deleteTarget, setDeleteTarget]       = useState<EmergencyContact | null>(null);
  const [form, setForm]                       = useState<ContactFormValues>(EMPTY_FORM);
  const [formError, setFormError]             = useState('');
  const [flashMsg, setFlashMsg]               = useState<{ type: 'success' | 'warn'; text: string } | null>(null);

  // ── Filter ─────────────────────────────────────────────────────────────────
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const allCategories = ['All', ...Array.from(new Set(contacts.map(c => c.category)))];
  const filtered = filterCategory === 'All' ? contacts : contacts.filter(c => c.category === filterCategory);

  // ── SOS handlers ───────────────────────────────────────────────────────────
  const handleSendOneTapAlert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMessage) return;
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`🚨 VAISHNAVI PRIDE SOS: ${broadcastType} ALERT`, {
        body: broadcastMessage,
        icon: '/favicon.svg',
      });
    }
    setTelegramStatus(
      `[SOS Message DISPATCH] 📢 Vaishnavi Pride Building Broadcast: ${broadcastType} ALERT — "${broadcastMessage}")`
    );
    setSentNotice('✅ One-Tap Push Broadcast dispatched to all 154 Flats! Browser push triggered.');
    setTimeout(() => setSentNotice(null), 10000);
    setBroadcastMessage('');
  };

  const handleQuickTemplate = (type: 'FIRE' | 'POWER' | 'WATER', msg: string) => {
    setBroadcastType(type);
    setBroadcastMessage(msg);
  };

  // ── CRUD helpers ───────────────────────────────────────────────────────────
  const showFlash = (type: 'success' | 'warn', text: string) => {
    setFlashMsg({ type, text });
    setTimeout(() => setFlashMsg(null), 4000);
  };

  const validate = (f: ContactFormValues): string => {
    if (!f.name.trim())         return 'Person name is required.';
    if (!f.phone.trim())        return 'Mobile number is required.';
    if (!/^\d{10}$/.test(f.phone)) return 'Mobile number must be exactly 10 digits.';
    if (!f.category.trim())     return 'Category is required.';
    if (!f.categoryInfo.trim()) return 'Category info is required.';
    if (!f.workType.trim())     return 'Work type is required.';
    return '';
  };

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setFormError('');
    setShowAddModal(true);
  };

  const openEdit = (c: EmergencyContact) => {
    setForm({
      name: c.name, phone: c.phone, category: c.category,
      categoryInfo: c.categoryInfo, workType: c.workType,
    });
    setFormError('');
    setEditingContact(c);
  };

  const handleSubmitAdd = () => {
    const err = validate(form);
    if (err) { setFormError(err); return; }
    onAddContact({
      name: form.name.trim(), phone: form.phone.trim(), category: form.category,
      categoryInfo: form.categoryInfo.trim(), workType: form.workType.trim(),
    });
    setShowAddModal(false);
    setForm(EMPTY_FORM);
    showFlash('success', '✅ Contact added successfully!');
  };

  const handleSubmitEdit = () => {
    if (!editingContact) return;
    const err = validate(form);
    if (err) { setFormError(err); return; }

    // ── No-changes detection ──────────────────────────────────────────────
    const unchanged =
      form.name.trim()         === editingContact.name &&
      form.phone.trim()        === editingContact.phone &&
      form.category            === editingContact.category &&
      form.categoryInfo.trim() === editingContact.categoryInfo &&
      form.workType.trim()     === editingContact.workType;

    if (unchanged) {
      setFormError('⚠️ No changes have been performed.');
      return;
    }

    onUpdateContact(editingContact.id, {
      name: form.name.trim(), phone: form.phone.trim(), category: form.category,
      categoryInfo: form.categoryInfo.trim(), workType: form.workType.trim(),
    });
    setEditingContact(null);
    showFlash('success', '✅ Changes done successfully!');
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    onDeleteContact(deleteTarget.id);
    setDeleteTarget(null);
    showFlash('success', '🗑️ Contact removed from directory.');
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* Flash Banner */}
      {flashMsg && (
        <div className={`p-3 rounded-2xl text-xs flex items-center gap-2 font-semibold animate-fade-in border ${
          flashMsg.type === 'success'
            ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
            : 'bg-amber-950/80 border-amber-500/50 text-amber-300'
        }`}>
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {flashMsg.text}
        </div>
      )}

      {/* SOS Dispatch Success Banner */}
      {sentNotice && (
        <div className="p-4 bg-emerald-950/80 border border-emerald-500/60 rounded-2xl flex flex-col gap-2 text-xs text-emerald-200 shadow-xl shadow-emerald-500/10 animate-fade-in">
          <div className="flex items-center gap-2 font-bold text-emerald-300">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span>{sentNotice}</span>
          </div>
          {telegramStatus && (
            <p className="font-mono text-[11px] bg-emerald-900/60 p-2 rounded-xl border border-emerald-700 text-emerald-200">
              {telegramStatus}
            </p>
          )}
        </div>
      )}

      {/* ── SOS One-Tap Broadcast ──────────────────────────────────────── */}
      <div className="p-6 glass-panel bg-gradient-to-br from-slate-900 via-slate-900 to-rose-950/30 border-rose-500/40 space-y-4">
        <div className="flex flex-wrap justify-between items-start gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-rose-400 animate-pulse" />
              One-Tap Push SOS Emergency Broadcast
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              Sends real push notifications to all subscribed residents via OneSignal — works even when the app is closed.
            </p>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <span className="px-3 py-1 bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded-full text-xs font-bold flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 animate-ping" />
              OneSignal Live Push Active
            </span>
            {subscriberCount !== null && (
              <span className="text-[11px] text-slate-400 font-mono">
                📱 {subscriberCount} device{subscriberCount !== 1 ? 's' : ''} subscribed
              </span>
            )}
          </div>
        </div>

        {/* Quick Templates */}
        <div className="flex flex-wrap gap-2 pt-2">
          <span className="text-xs text-slate-400 flex items-center mr-1">Quick SOS Templates:</span>
          <button
            onClick={() => handleQuickTemplate('WATER', 'Sudden Main Line Water Outage due to valve repair. Water supply will resume by 06:00 PM.')}
            className="px-3 py-1 rounded-xl bg-sky-950/80 hover:bg-sky-900 text-sky-300 border border-sky-700/60 text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <Droplets className="w-3.5 h-3.5 text-sky-400" /> Water Supply Outage
          </button>
          <button
            onClick={() => handleQuickTemplate('POWER', 'Substation Power Grid Failure. Main DG Backup Generator Auto-Initiated for Elevators & Common Lighting.')}
            className="px-3 py-1 rounded-xl bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-700/60 text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" /> Power Outage & DG Backup
          </button>
          <button
            onClick={() => handleQuickTemplate('FIRE', 'FIRE ALARM EVACUATION: Fire sensor triggered on Floor 12. Please proceed calmly via staircases!')}
            className="px-3 py-1 rounded-xl bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-700/60 text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <Flame className="w-3.5 h-3.5 text-rose-400" /> Fire Alarm Evacuation
          </button>
        </div>

        <form onSubmit={handleSendOneTapAlert} className="space-y-3 pt-2">
          <div className="flex gap-2">
            <input
              type="text"
              required
              disabled={isSending}
              placeholder="Type urgent broadcast message to all residents..."
              value={broadcastMessage}
              onChange={(e) => setBroadcastMessage(e.target.value)}
              className="w-full bg-slate-950 border border-rose-900/60 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-rose-500 outline-none disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isSending || !broadcastMessage.trim()}
              className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl text-xs font-extrabold flex items-center gap-2 shadow-lg shadow-rose-600/40 shrink-0 transition-all min-w-[130px] justify-center"
            >
              {isSending ? (
                <><span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full inline-block" /> Sending...</>
              ) : (
                <><Bell className="w-4 h-4" /> Dispatch SOS</>
              )}
            </button>
          </div>
          <p className="text-[11px] text-slate-500">
            ⚡ This will send a real push notification to all {subscriberCount ?? '—'} subscribed devices — even if their browser is closed.
          </p>
        </form>
      </div>

      {/* ── Critical Contact Directory ─────────────────────────────────── */}
      <div className="glass-panel p-5 space-y-4">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <PhoneCall className="w-5 h-5 text-sky-400" />
              Critical Contact Directory
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Emergency contacts — available offline. Tap <span className="text-emerald-400 font-semibold">Call</span> to dial directly.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-medium flex items-center gap-1.5">
              Contact Info!
            </span>
            {isAdmin && (
              <button
                id="btn-add-contact"
                onClick={openAdd}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-rose-600/30 transition-all"
              >
                <Plus className="w-4 h-4" /> Add Contact
              </button>
            )}
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2">
          {allCategories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                filterCategory === cat
                  ? 'bg-sky-500/30 text-sky-200 border-sky-500/60 shadow-md'
                  : 'bg-slate-900/60 text-slate-400 border-slate-700/60 hover:border-sky-700'
              }`}
            >
              {cat}
              {cat !== 'All' && (
                <span className="ml-1.5 text-[10px] opacity-70">
                  ({contacts.filter(c => c.category === cat).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Cards Grid */}
        {filtered.length === 0 ? (
          <div className="py-10 text-center text-slate-500 text-sm">
            <PhoneCall className="w-8 h-8 mx-auto mb-2 opacity-30" />
            No contacts found in this category.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((contact) => {
              const cfg = getCategoryConfig(contact.category);
              return (
                <div
                  key={contact.id}
                  className="relative group p-4 bg-slate-950/70 rounded-2xl border border-slate-800/80 hover:border-slate-700 transition-all duration-200 flex flex-col gap-3"
                >
                  {/* Top Row: badge + admin actions */}
                  <div className="flex items-center justify-between">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                      {cfg.icon}
                      {contact.category}
                    </span>
                    {isAdmin && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEdit(contact)}
                          title="Edit"
                          className="w-7 h-7 rounded-lg bg-sky-500/15 hover:bg-sky-500/30 text-sky-400 flex items-center justify-center transition-all"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(contact)}
                          title="Delete"
                          className="w-7 h-7 rounded-lg bg-rose-500/15 hover:bg-rose-500/30 text-rose-400 flex items-center justify-center transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Name & Category Info */}
                  <div>
                    <h4 className="font-bold text-white text-sm leading-tight">{contact.name}</h4>
                    <p className="text-xs text-sky-300 mt-0.5 font-medium">{contact.categoryInfo}</p>
                  </div>

                  {/* Work Type */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Briefcase className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>{contact.workType}</span>
                  </div>

                  {/* Phone + Call */}
                  <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-800/60">
                    <a
                      href={`tel:${contact.phone}`}
                      className="text-xs font-mono font-bold text-emerald-400 hover:text-emerald-300 hover:underline transition-colors"
                    >
                      {contact.phone}
                    </a>
                    <a
                      href={`tel:${contact.phone}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-bold transition-all shadow-md hover:shadow-emerald-500/20"
                      title={`Call ${contact.name}`}
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      Call
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Modals (rendered last so they are on top) ─────────────────── */}
      {showAddModal && (
        <ContactFormModal
          title="Add Critical Contact"
          form={form}
          onChange={setForm}
          onSave={handleSubmitAdd}
          onCancel={() => { setShowAddModal(false); setFormError(''); }}
          formError={formError}
        />
      )}

      {editingContact && (
        <ContactFormModal
          title="Edit Critical Contact"
          form={form}
          onChange={setForm}
          onSave={handleSubmitEdit}
          onCancel={() => { setEditingContact(null); setFormError(''); }}
          formError={formError}
        />
      )}

      {deleteTarget && (
        <DeleteConfirmModal
          contact={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
};
