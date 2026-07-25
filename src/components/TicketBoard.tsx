import React, { useState } from 'react';
import { Ticket, TicketCategory, TicketPriority, TicketStatus, UserRole, Flat } from '../types/society';
import { compressImage } from '../services/imageCompressor';
import { formatDateTime, getLocalISOString, parseISOToLocalDate } from '../utils/dateFormatter';
import { notificationService } from '../services/notificationService';
import { ImageViewerModal } from './ImageViewerModal';
import { 
  Wrench, 
  Plus, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Upload, 
  Camera,
  MapPin, 
  UserCheck, 
  RotateCcw, 
  Radio, 
  Filter,
  Image as ImageIcon,
  ShieldAlert,
  Sparkles,
  Home
} from 'lucide-react';

interface TicketBoardProps {
  tickets: Ticket[];
  onAddTicket: (ticket: Omit<Ticket, 'id' | 'createdAt'>) => void;
  onUpdateTicket: (ticketId: string, updates: Partial<Ticket>) => void;
  currentFlat: Flat;
  currentRole: UserRole;
}

export const TicketBoard: React.FC<TicketBoardProps> = ({
  tickets,
  onAddTicket,
  onUpdateTicket,
  currentFlat,
  currentRole,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [broadcastAlert, setBroadcastAlert] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TicketCategory>('Elevator');
  const [locationTag, setLocationTag] = useState('');
  const [priority, setPriority] = useState<TicketPriority>('Normal');
  const [flatNumberInput, setFlatNumberInput] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [isCompressing, setIsCompressing] = useState(false);
  const [fileSizeNotice, setFileSizeNotice] = useState<string>('');

  // Admin Assignment State
  const [assigningTicketId, setAssigningTicketId] = useState<string | null>(null);
  const [vendorName, setVendorName] = useState('');

  // Resolution State with Image Upload & Remarks
  const [resolvingTicketId, setResolvingTicketId] = useState<string | null>(null);
  const [afterPhotoUrl, setAfterPhotoUrl] = useState('');
  const [resolutionRemarksInput, setResolutionRemarksInput] = useState('');
  const [isCompressingAfter, setIsCompressingAfter] = useState(false);
  const [afterSizeNotice, setAfterSizeNotice] = useState('');

  // Image Modal Viewer State
  const [viewingImage, setViewingImage] = useState<{ url: string; title: string } | null>(null);

  const handleOpenModal = () => {
    setFlatNumberInput('');
    setShowModal(true);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressing(true);
    const originalKb = (file.size / 1024).toFixed(1);
    try {
      const compressedDataUrl = await compressImage(file, 150);
      const compressedKb = (compressedDataUrl.length * 0.75 / 1024).toFixed(1);
      setPhotoUrl(compressedDataUrl);
      setFileSizeNotice(`Stored photo proof: Compressed from ${originalKb} KB to ~${compressedKb} KB`);
    } catch (err) {
      console.error('Compression error:', err);
    } finally {
      setIsCompressing(false);
    }
  };

  const handleAfterPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressingAfter(true);
    const originalKb = (file.size / 1024).toFixed(1);
    try {
      const compressedDataUrl = await compressImage(file, 150);
      const compressedKb = (compressedDataUrl.length * 0.75 / 1024).toFixed(1);
      setAfterPhotoUrl(compressedDataUrl);
      setAfterSizeNotice(`Resolution proof stored: ~${compressedKb} KB`);
    } catch (err) {
      console.error('Compression error:', err);
    } finally {
      setIsCompressingAfter(false);
    }
  };

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !locationTag) return;

    const targetFlatNumber = flatNumberInput.trim();

    onAddTicket({
      flatId: currentFlat.id,
      flatNumber: targetFlatNumber,
      title,
      description,
      category,
      locationTag,
      priority,
      photoUrl,
      status: 'Open',
    });

    // Trigger Real-Time Broadcast Notice & Native OS Push Notification
    const flatLabel = targetFlatNumber ? `Flat #${targetFlatNumber} ` : '';
    const alertMsg = `New ticket raised for ${flatLabel}(${locationTag}).`;
    setBroadcastAlert(`🔔 Real-Time Event Notice sent to all 154 Flats: ${alertMsg}`);
    notificationService.sendNotification(`Vaishnavi Pride: New Ticket (${targetFlatNumber ? 'Flat #' + targetFlatNumber : 'Common Area'})`, `${title} - ${locationTag}`);
    setTimeout(() => setBroadcastAlert(null), 8000);

    // Reset Form
    setTitle('');
    setDescription('');
    setLocationTag('');
    setPhotoUrl('');
    setFileSizeNotice('');
    setShowModal(false);
  };

  const handleAssignVendor = (ticketId: string) => {
    if (!vendorName) return;
    onUpdateTicket(ticketId, {
      assignedVendor: vendorName,
      assignedAt: getLocalISOString(), // Captured IST timestamp of staff assignment
      status: 'In Progress',
    });
    setAssigningTicketId(null);
    setVendorName('');
  };

  const handleResolveTicket = (ticketId: string) => {
    const now = new Date();
    const expiry = new Date(now.getTime() + 86400000);
    onUpdateTicket(ticketId, {
      status: 'Resolved',
      afterPhotoUrl: afterPhotoUrl || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=60',
      resolutionRemarks: resolutionRemarksInput.trim() || undefined,
      resolvedAt: getLocalISOString(now),
      reopenWindowExpiry: getLocalISOString(expiry), // 24-hr reopen deadline in IST
    });
    setResolvingTicketId(null);
    setAfterPhotoUrl('');
    setResolutionRemarksInput('');
    setAfterSizeNotice('');
  };

  const handleReopenTicket = (ticketId: string) => {
    const ticket = tickets.find(t => t.id === ticketId);
    onUpdateTicket(ticketId, {
      status: 'Open',
      reopenedCount: (ticket?.reopenedCount ?? 0) + 1,
    });
  };

  const filteredTickets = tickets.filter(t => {
    if (categoryFilter !== 'ALL' && t.category !== categoryFilter) return false;
    if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;

    // 24-Hour Visibility Rule for Resolved Tickets:
    // Resolved tickets remain visible on frontend UI for 24 hours post-resolution.
    // After 24 hours, they hide from UI view but remain 100% preserved in database table `tickets`.
    if (t.status === 'Resolved') {
      const currentLocalTime = parseISOToLocalDate(getLocalISOString()).getTime();
      const expiryTime = t.reopenWindowExpiry 
        ? parseISOToLocalDate(t.reopenWindowExpiry).getTime() 
        : (t.resolvedAt ? parseISOToLocalDate(t.resolvedAt).getTime() + 86400000 : currentLocalTime + 86400000);
      if (currentLocalTime > expiryTime) {
        return false;
      }
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Broadcast Alert Banner */}
      {broadcastAlert && (
        <div className="p-4 bg-sky-950/80 border border-sky-500/60 rounded-2xl flex items-start gap-3 shadow-lg shadow-sky-500/10 animate-bounce">
          <Radio className="w-5 h-5 text-sky-400 shrink-0 mt-0.5 animate-pulse" />
          <div className="text-xs text-sky-200 font-medium">
            <span className="font-bold text-sky-300 uppercase tracking-wider block mb-0.5">Real-Time Broadcast Engine Active</span>
            {broadcastAlert}
          </div>
        </div>
      )}

      {/* Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 glass-panel">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Wrench className="w-6 h-6 text-sky-400" />
            Transparent Maintenance & Ticket Board
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time public ticket tracking across 22 floors & 154 units. Attaches proof photos for issue & resolution.
          </p>
        </div>

        {currentRole !== 'Auditor' && (
          <button
            onClick={handleOpenModal}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-sky-600/30 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Raise Maintenance Ticket
          </button>
        )}
      </div>

      {/* Filters (Includes 'Other' Category) */}
      <div className="flex flex-wrap items-center gap-3 px-2">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Filter className="w-3.5 h-3.5" />
          <span>Filter Category:</span>
        </div>
        {['ALL', 'Elevator', 'Plumbing', 'Lighting', 'Cleanliness', 'Parking', 'Security', 'Other'].map(cat => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              categoryFilter === cat
                ? 'bg-sky-600/30 text-sky-300 border border-sky-500/40'
                : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            {cat}
          </button>
        ))}

        <div className="ml-auto flex items-center gap-2">
          {['ALL', 'Open', 'In Progress', 'Resolved'].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                statusFilter === st
                  ? 'bg-slate-800 text-slate-100 border border-slate-600'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Ticket Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredTickets.map(ticket => {
          const isOpen = ticket.status === 'Open';
          const isInProgress = ticket.status === 'In Progress';
          const isResolved = ticket.status === 'Resolved';
          const isOwnTicket = ticket.flatId === currentFlat.id;

          // Reopen deadline check
          const reopenValid = isResolved && ticket.reopenWindowExpiry && 
            parseISOToLocalDate(getLocalISOString()).getTime() < parseISOToLocalDate(ticket.reopenWindowExpiry).getTime();

          return (
            <div key={ticket.id} className="glass-panel-interactive p-5 flex flex-col justify-between space-y-4">
              <div>
                {/* Header Badge */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase ${
                    ticket.priority === 'Urgent'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : 'bg-slate-800 text-slate-300'
                  }`}>
                    {ticket.priority} Priority
                  </span>

                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1 ${
                    isOpen
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : isInProgress
                      ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}>
                    {isOpen && <Clock className="w-3 h-3" />}
                    {isInProgress && <Wrench className="w-3 h-3 animate-spin" />}
                    {isResolved && <CheckCircle2 className="w-3 h-3" />}
                    {ticket.status}
                  </span>
                </div>

                {/* Title & Tag */}
                <h3 className="font-bold text-white text-base leading-snug">{ticket.title}</h3>
                <div className="flex items-center gap-1.5 text-xs text-sky-400 mt-1">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  <span>{ticket.locationTag}</span>
                  {ticket.flatNumber && (
                    <span className="text-slate-300 font-semibold">| Flat #{ticket.flatNumber}</span>
                  )}
                  <span className="text-slate-500">({ticket.category})</span>
                </div>

                <p className="text-xs text-slate-300 mt-2 line-clamp-3 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/60">
                  {ticket.description}
                </p>

                {/* Photos */}
                <div className="mt-3 flex gap-2">
                  {ticket.photoUrl && (
                    <div 
                      onClick={() => setViewingImage({ url: ticket.photoUrl!, title: `Issue Photo Proof - Ticket #${ticket.id}` })}
                      className="relative group cursor-pointer hover:opacity-90 transition-all"
                      title="Click to view full photo"
                    >
                      <img src={ticket.photoUrl} alt="Initial issue proof" className="w-16 h-16 object-cover rounded-xl border border-slate-700" />
                      <span className="absolute bottom-0 inset-x-0 bg-black/70 text-[9px] text-center text-slate-300 py-0.5 rounded-b-xl flex items-center justify-center gap-0.5">
                        <ImageIcon className="w-2.5 h-2.5" /> Before
                      </span>
                    </div>
                  )}
                  {ticket.afterPhotoUrl && (
                    <div 
                      onClick={() => setViewingImage({ url: ticket.afterPhotoUrl!, title: `Completed Work Proof - Ticket #${ticket.id}` })}
                      className="relative group cursor-pointer hover:opacity-90 transition-all"
                      title="Click to view full photo"
                    >
                      <img src={ticket.afterPhotoUrl} alt="Resolved proof" className="w-16 h-16 object-cover rounded-xl border border-emerald-600/50" />
                      <span className="absolute bottom-0 inset-x-0 bg-emerald-950/90 text-[9px] text-center text-emerald-300 py-0.5 rounded-b-xl font-bold flex items-center justify-center gap-0.5">
                        <ImageIcon className="w-2.5 h-2.5" /> After
                      </span>
                    </div>
                  )}
                </div>

                {/* Vendor Assigned with Timestamp */}
                {ticket.assignedVendor && (
                  <div className="mt-3 p-2 bg-slate-950/60 rounded-xl border border-slate-800 flex flex-col gap-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Assigned Staff / Vendor:</span>
                      <span className="font-semibold text-slate-200 flex items-center gap-1">
                        <UserCheck className="w-3.5 h-3.5 text-sky-400" />
                        {ticket.assignedVendor}
                      </span>
                    </div>
                    {ticket.assignedAt && (
                      <div className="text-[10px] text-sky-400/80 text-right font-mono">
                        Assigned on: {formatDateTime(ticket.assignedAt)}
                      </div>
                    )}
                  </div>
                )}

                {/* Resolution Remarks Block */}
                {ticket.resolutionRemarks && (
                  <div className="mt-3 p-2.5 bg-emerald-950/40 rounded-xl border border-emerald-500/30 text-xs text-emerald-200">
                    <span className="font-bold text-emerald-300 block mb-0.5">Admin Work Resolution Remarks:</span>
                    {ticket.resolutionRemarks}
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              <div className="pt-3 border-t border-slate-800/80 flex flex-col gap-2">
                {/* Admin Vendor Assign Controls */}
                {currentRole === 'Management' && isOpen && (
                  <div>
                    {assigningTicketId === ticket.id ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Vendor Name / Staff"
                          value={vendorName}
                          onChange={(e) => setVendorName(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white"
                        />
                        <button
                          onClick={() => handleAssignVendor(ticket.id)}
                          className="px-3 py-1 bg-sky-600 text-white rounded-lg text-xs font-medium"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setAssigningTicketId(ticket.id)}
                        className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-sky-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        Assign Staff & Mark In Progress
                      </button>
                    )}
                  </div>
                )}

                {/* Admin Mark Resolved with Proof Photo Upload & Remarks */}
                {currentRole === 'Management' && isInProgress && (
                  <div>
                    {resolvingTicketId === ticket.id ? (
                      <div className="space-y-3 p-3 bg-slate-950 rounded-xl border border-slate-800">
                        <label className="block text-xs font-semibold text-slate-300">
                          Upload Completed Work Photo Proof (Stored in DB)
                        </label>
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Live Camera Button */}
                          <label className="cursor-pointer px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 shadow-sm">
                            <Camera className="w-3.5 h-3.5" />
                            {isCompressingAfter ? 'Uploading...' : 'Take Live Photo'}
                            <input type="file" accept="image/*" capture="environment" onChange={handleAfterPhotoUpload} className="hidden" />
                          </label>

                          {/* Choose File Button */}
                          <label className="cursor-pointer px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 rounded-lg text-xs font-medium flex items-center gap-1.5">
                            <Upload className="w-3.5 h-3.5" />
                            Choose File
                            <input type="file" accept="image/*" onChange={handleAfterPhotoUpload} className="hidden" />
                          </label>

                          {afterPhotoUrl && (
                            <img src={afterPhotoUrl} alt="After Work Preview" className="w-9 h-9 object-cover rounded-lg border border-emerald-500/60" />
                          )}
                        </div>
                        {afterSizeNotice && (
                          <p className="text-[10px] text-emerald-400 font-mono">{afterSizeNotice}</p>
                        )}

                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1">
                            Admin Remarks / Work Summary (Optional)
                          </label>
                          <textarea
                            rows={2}
                            placeholder="e.g. Replaced elevator cable sensor and verified smooth operation..."
                            value={resolutionRemarksInput}
                            onChange={(e) => setResolutionRemarksInput(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-emerald-500"
                          />
                        </div>

                        <button
                          onClick={() => handleResolveTicket(ticket.id)}
                          className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-md shadow-emerald-600/30"
                        >
                          Confirm Resolved & Save Proof
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setResolvingTicketId(ticket.id)}
                        className="w-full py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Attach After Proof & Resolve
                      </button>
                    )}
                  </div>
                )}

                {/* 24-Hr Reopen Button for Reporter */}
                {isOwnTicket && reopenValid && (
                  <button
                    onClick={() => handleReopenTicket(ticket.id)}
                    className="w-full py-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reopen Ticket (24-Hr Window Active)
                  </button>
                )}

                <div className="text-[10px] text-slate-500 flex justify-between">
                  <span>Raised: {formatDateTime(ticket.createdAt)}</span>
                  <span>ID: {ticket.id}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Ticket Creation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-lg p-6 space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-sky-400" />
                Raise Public Maintenance Ticket
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Issue Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Elevator #1 Banging Noise on Floor 14"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-sky-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Flat Number (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. 707 (Optional)"
                    value={flatNumberInput}
                    onChange={(e) => setFlatNumberInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-sky-500 outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as TicketCategory)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-sky-500 outline-none"
                  >
                    <option value="Elevator">Elevator</option>
                    <option value="Plumbing">Plumbing</option>
                    <option value="Lighting">Lighting</option>
                    <option value="Cleanliness">Cleanliness</option>
                    <option value="Parking">Parking</option>
                    <option value="Security">Security</option>
                    <option value="Other">Other Category</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TicketPriority)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-sky-500 outline-none"
                  >
                    <option value="Urgent">Urgent</option>
                    <option value="Normal">Normal</option>
                    <option value="Scheduled">Scheduled</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Location Tag (Building Floor/Area)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Floor 14 Common Hallway / Basement B1"
                  value={locationTag}
                  onChange={(e) => setLocationTag(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-sky-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description & Details</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Provide precise details to help vendor/staff fix quickly..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-sky-500 outline-none"
                />
              </div>

              {/* Zero-Cost Image Storage Attachment */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Upload Issue Photo Proof (Stored in DB / LocalStorage)
                </label>
                <div className="flex flex-wrap items-center gap-3 p-3 bg-slate-950 border border-slate-800 rounded-xl">
                  {/* Live Camera Button */}
                  <label className="cursor-pointer px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 shadow-sm">
                    <Camera className="w-3.5 h-3.5" />
                    {isCompressing ? 'Compressing...' : 'Take Live Photo'}
                    <input type="file" accept="image/*" capture="environment" onChange={handlePhotoUpload} className="hidden" />
                  </label>

                  {/* Choose File Button */}
                  <label className="cursor-pointer px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-sky-300 rounded-lg text-xs font-medium flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" />
                    Choose File
                    <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                  </label>

                  {photoUrl && (
                    <img src={photoUrl} alt="Preview" className="w-10 h-10 object-cover rounded-lg border border-sky-500/50" />
                  )}
                </div>
                {fileSizeNotice && (
                  <p className="text-[11px] text-emerald-400 mt-1 font-mono">{fileSizeNotice}</p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCompressing}
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-sky-600/30"
                >
                  Submit & Broadcast Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Full-Screen Image Viewer Modal */}
      {viewingImage && (
        <ImageViewerModal
          imageUrl={viewingImage.url}
          title={viewingImage.title}
          onClose={() => setViewingImage(null)}
        />
      )}
    </div>
  );
};
