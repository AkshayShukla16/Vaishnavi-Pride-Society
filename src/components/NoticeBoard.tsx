import React, { useState } from 'react';
import { Announcement, NoticePriority, UserRole, AdminUser } from '../types/society';
import { formatDateTime, parseISOToLocalDate } from '../utils/dateFormatter';
import { 
  Megaphone, 
  Pin, 
  Eye, 
  CheckCircle, 
  Plus, 
  AlertTriangle, 
  Wrench, 
  Users, 
  Info, 
  ShieldAlert,
  Search
} from 'lucide-react';

interface NoticeBoardProps {
  announcements: Announcement[];
  onAddNotice: (notice: Omit<Announcement, 'id' | 'createdAt' | 'ackCount'>) => void;
  onUpdateNotice: (noticeId: string, updates: Partial<Announcement>) => void;
  onTogglePin: (noticeId: string) => void;
  currentRole: UserRole;
  currentAdmin: AdminUser | null;
}

export const NoticeBoard: React.FC<NoticeBoardProps> = ({
  announcements,
  onAddNotice,
  onUpdateNotice,
  onTogglePin,
  currentRole,
  currentAdmin,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priorityCategory, setPriorityCategory] = useState<NoticePriority>('GENERAL');
  const [isPinned, setIsPinned] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Local state to track which notice IDs have been acknowledged by this browser
  const [acknowledgedList, setAcknowledgedList] = useState<string[]>(() => {
    const saved = localStorage.getItem('vp_acknowledged_notices');
    return saved ? JSON.parse(saved) : [];
  });

  const handleAcknowledge = (notice: Announcement) => {
    if (acknowledgedList.includes(notice.id)) return;
    
    // Save locally in this browser so they can't click it again
    const updated = [...acknowledgedList, notice.id];
    setAcknowledgedList(updated);
    localStorage.setItem('vp_acknowledged_notices', JSON.stringify(updated));

    // Increment backend count (max 154)
    const newCount = Math.min(154, (notice.ackCount || 0) + 1);
    onUpdateNotice(notice.id, { ackCount: newCount });
  };

  const handleCreateNotice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;

    // Generate Poster Signature e.g., "Super Admin (AKSHAY)" or "Admin (Rajesh Sharma)"
    const adminSignature = currentAdmin 
      ? `${currentAdmin.adminType === 'SuperAdmin' ? 'Super Admin' : 'Admin'} (${currentAdmin.name})`
      : 'Admin';

    onAddNotice({
      title,
      content,
      priorityCategory,
      isPinned,
      byWhom: adminSignature,
    });

    setTitle('');
    setContent('');
    setIsPinned(false);
    setShowModal(false);
  };

  // Sort pinned first, then newest
  const sortedNotices = [...announcements].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return parseISOToLocalDate(b.createdAt).getTime() - parseISOToLocalDate(a.createdAt).getTime();
  }).filter(n => 
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    n.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 glass-panel">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-sky-400" />
            General Announcement Board & Notices
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Official announcements, warnings, and schedules posted by society management.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search announcements..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white focus:border-sky-500 outline-none w-48"
            />
          </div>

          {currentRole === 'Management' && (
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-sky-600/30 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Post Announcement
            </button>
          )}
        </div>
      </div>

      {/* Notices List */}
      <div className="space-y-4">
        {sortedNotices.map((notice) => {
          const isAcknowledged = acknowledgedList.includes(notice.id);
          const safeAckCount = Math.min(154, notice.ackCount || 0);
          const progressPercentage = Math.round((safeAckCount / 154) * 100);

          const isEmergency = notice.priorityCategory === 'EMERGENCY';
          const isMaintenance = notice.priorityCategory === 'MAINTENANCE';
          const isCommunity = notice.priorityCategory === 'COMMUNITY';

          return (
            <div
              key={notice.id}
              className={`glass-panel p-6 transition-all border-l-4 ${
                isEmergency
                  ? 'border-l-rose-500 bg-gradient-to-r from-rose-950/20 via-slate-900 to-slate-900'
                  : isMaintenance
                  ? 'border-l-amber-500'
                  : isCommunity
                  ? 'border-l-indigo-500'
                  : 'border-l-sky-500'
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-2.5 flex-wrap">
                  {/* Category Tag */}
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1 ${
                    isEmergency
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                      : isMaintenance
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : isCommunity
                      ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                      : 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                  }`}>
                    {isEmergency && <ShieldAlert className="w-3 h-3" />}
                    {isMaintenance && <Wrench className="w-3 h-3" />}
                    {isCommunity && <Users className="w-3 h-3" />}
                    {!isEmergency && !isMaintenance && !isCommunity && <Info className="w-3 h-3" />}
                    {notice.priorityCategory} NOTICE
                  </span>

                  {/* Pinned Tag */}
                  {notice.isPinned && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                      <Pin className="w-3 h-3 text-amber-400 fill-amber-400" />
                      PINNED TO TOP
                    </span>
                  )}

                  {/* Posted Timestamp */}
                  <span className="text-[10px] text-slate-400 font-mono">Posted: {formatDateTime(notice.createdAt)}</span>
                  
                  {/* Poster Name */}
                  <span className="text-[10px] text-sky-400 font-medium bg-sky-950/40 px-2 py-0.5 rounded-lg border border-sky-900/30">
                    By: {notice.byWhom}
                  </span>
                </div>

                {/* Admin Pin Toggle */}
                {currentRole === 'Management' && (
                  <button
                    onClick={() => onTogglePin(notice.id)}
                    className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-amber-400 transition-all"
                    title={notice.isPinned ? "Unpin Notice" : "Pin Notice to Top"}
                  >
                    <Pin className={`w-4 h-4 ${notice.isPinned ? 'fill-amber-400 text-amber-400' : ''}`} />
                  </button>
                )}
              </div>

              {/* Title & Body */}
              <h3 className="text-lg font-bold text-white mt-3 leading-snug">{notice.title}</h3>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed whitespace-pre-line bg-slate-950/40 p-3.5 rounded-xl border border-slate-800/80">
                {notice.content}
              </p>

              {/* Action & Counter Footer */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                
                {/* 154 Families Read counter */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <Eye className="w-4 h-4 text-sky-400" />
                    <span className="font-semibold text-white">Acknowledgment:</span>
                    <span className="text-sky-300 font-mono font-bold">
                      {safeAckCount} / 154 Families ({progressPercentage}%)
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-28 bg-slate-800 h-2 rounded-full overflow-hidden hidden sm:block">
                    <div
                      className="bg-gradient-to-r from-sky-500 to-indigo-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                </div>

                {/* Acknowledge Button */}
                <div>
                  {isAcknowledged ? (
                    <span className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-xl font-medium text-xs">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Acknowledged (This Browser)
                    </span>
                  ) : (
                    <button
                      onClick={() => handleAcknowledge(notice)}
                      className="px-4 py-1.5 bg-sky-600/30 hover:bg-sky-600/50 border border-sky-500/40 text-sky-300 rounded-xl font-semibold text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Acknowledge Notice
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Notice Creation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-lg p-6 space-y-5">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-sky-400" />
                Post General Announcement
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateNotice} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Notice Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Overhead Water Tank Cleaning Schedule"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-sky-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Priority Category</label>
                  <select
                    value={priorityCategory}
                    onChange={(e) => setPriorityCategory(e.target.value as NoticePriority)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-sky-500 outline-none"
                  >
                    <option value="EMERGENCY">EMERGENCY</option>
                    <option value="MAINTENANCE">MAINTENANCE</option>
                    <option value="COMMUNITY">COMMUNITY</option>
                    <option value="GENERAL">GENERAL</option>
                  </select>
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-300">
                    <input
                      type="checkbox"
                      checked={isPinned}
                      onChange={(e) => setIsPinned(e.target.checked)}
                      className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-sky-600 focus:ring-sky-500"
                    />
                    Pin to Top of Dashboard
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Notice Content</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Details of announcement..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-sky-500 outline-none"
                />
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
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-sky-600/30"
                >
                  Publish Announcement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
