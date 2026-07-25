import React, { useState } from 'react';
import { AdminUser } from '../types/society';
import { storageService } from '../services/storageService';
import { getSupabaseConfig } from '../services/supabaseClient';
import { ShieldCheck, Mail, Phone, Key, AlertCircle } from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (admin: AdminUser) => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const config = getSupabaseConfig();
    let found: AdminUser | null = null;

    if (config.url && config.anonKey) {
      try {
        const response = await fetch(`${config.url}/rest/v1/admindirectory?user_id=eq.${encodeURIComponent(email.trim().toLowerCase())}`, {
          headers: {
            'apikey': config.anonKey,
            'Authorization': `Bearer ${config.anonKey}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          if (data && data.length > 0) {
            const item = data[0];
            found = {
              id: item.id,
              email: item.user_id,
              passwordHash: item.cached_password,
              name: item.name,
              phone: item.phone || undefined,
              adminType: item.admin_type,
              createdAt: item.created_at,
            };
          }
        }
      } catch (err) {
        console.warn('[Supabase Login Query Error]', err);
      }
    }

    // Fallback to local storage if DB is not set up or offline
    if (!found) {
      const admins = storageService.getAdmins();
      const localFound = admins.find(a => a.email.toLowerCase() === email.trim().toLowerCase());
      if (localFound) found = localFound;
    }

    if (!found) {
      setError(`No admin account found for "${email}". Super Admin access requires valid credentials.`);
      return;
    }

    if (found.passwordHash !== password) {
      setError('Invalid password. Authentication failed.');
      return;
    }

    // Success
    storageService.setCurrentAdmin(found);
    onLoginSuccess(found);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="glass-panel w-full max-w-md p-6 space-y-5 border-indigo-500/40">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
            Management Admin Sign In
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>

        <p className="text-xs text-slate-300">
          Enter your registered Admin User ID (Email) and Password. Only authenticated Super Admins (AKSHAY, ASHISH) or Base Admins can sign in.
        </p>

        {error && (
          <div className="p-3 bg-rose-950/80 border border-rose-500/60 rounded-xl text-xs text-rose-200 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>{error}</div>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
              <Mail className="w-3.5 h-3.5 text-sky-400" />
              Admin User ID (Email Address) *
            </label>
            <input
              type="email"
              required
              placeholder="e.g. arshukla16@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-sky-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
              <Key className="w-3.5 h-3.5 text-indigo-400" />
              Password *
            </label>
            <input
              type="password"
              required
              placeholder="Enter password..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-sky-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              Phone Number (Optional)
            </label>
            <input
              type="tel"
              placeholder="+91 98765 00000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-sky-500 outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-xl text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30"
            >
              Sign In
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
