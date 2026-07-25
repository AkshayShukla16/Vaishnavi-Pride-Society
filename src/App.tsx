import React, { useState, useEffect } from 'react';
import { UserRole, Flat, Ticket, Payment, SocietyExpense, Announcement, AmenityBooking, PaymentStatus, AdminUser, Resident, EmergencyContact } from './types/society';
import { storageService } from './services/storageService';
import { notificationService } from './services/notificationService';
import { sendTicketPushNotification, sendAnnouncementPushNotification, sendAmenityPushNotification } from './services/oneSignalService';
import { getLocalISOString } from './utils/dateFormatter';
import { Navbar, ThemeId } from './components/Navbar';
import { HomePage } from './components/HomePage';
import { HelperDirectory } from './components/HelperDirectory';
import { TicketBoard } from './components/TicketBoard';
import { NoticeBoard } from './components/NoticeBoard';
import { FinancialTracker } from './components/FinancialTracker';
import { AmenityBookingComponent } from './components/AmenityBooking';
import { EmergencyDirectory } from './components/EmergencyDirectory';
import { ResidentDirectory } from './components/ResidentDirectory';
import { AdminLoginModal } from './components/AdminLoginModal';
import { AdminManagementPanel } from './components/AdminManagementPanel';
import { Building2, Database } from 'lucide-react';
import { SUPABASE_SQL_SCHEMA, deleteResidentFromSupabase, deleteContactFromSupabase } from './services/supabaseClient';

export function App() {
  const [currentRole, setCurrentRole] = useState<UserRole>('Resident');
  const [activeTab, setActiveTab] = useState<string>('home');
  const [isHamburgerOpen, setIsHamburgerOpen] = useState(false);
  const [flats, setFlats] = useState<Flat[]>([]);
  const [currentFlat, setCurrentFlat] = useState<Flat | null>(null);

  // Theme state: 4 vibrant dark themes ('cyber' | 'emerald' | 'amethyst' | 'amber')
  const [theme, setTheme] = useState<ThemeId>(() => {
    return (localStorage.getItem('vaishnavi_theme_id') as ThemeId) || 'cyber';
  });

  useEffect(() => {
    document.documentElement.classList.remove('theme-cyber', 'theme-emerald', 'theme-amethyst', 'theme-amber', 'light');
    document.documentElement.classList.add(`theme-${theme}`);
    localStorage.setItem('vaishnavi_theme_id', theme);
  }, [theme]);

  // Admin Auth State
  const [currentAdmin, setCurrentAdmin] = useState<AdminUser | null>(null);
  const [showAdminLogin, setShowAdminLogin] = useState(false);

  // App Data State
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [expenses, setExpenses] = useState<SocietyExpense[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [bookings, setBookings] = useState<AmenityBooking[]>([]);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [showSqlModal, setShowSqlModal] = useState(false);

  // Load initial data
  const loadData = () => {
    const loadedFlats = storageService.getFlats();
    setFlats(loadedFlats);

    const currentFlatId = storageService.getCurrentFlatId();
    const foundFlat = loadedFlats.find(f => f.id === currentFlatId) || loadedFlats[0];
    setCurrentFlat(foundFlat);

    setCurrentAdmin(storageService.getCurrentAdmin());

    setTickets(storageService.getTickets());
    setPayments(storageService.getPayments());
    setExpenses(storageService.getExpenses());
    setAnnouncements(storageService.getAnnouncements());
    setBookings(storageService.getBookings());
    setResidents(storageService.getResidents());
    setContacts(storageService.getContacts());
  };

  useEffect(() => {
    loadData();
    storageService.syncTicketsWithSupabaseDatabase();
    storageService.syncWithSupabaseDatabase();
    storageService.syncAnnouncementsWithSupabaseDatabase();
    storageService.syncResidentsWithSupabaseDatabase();
    storageService.syncAdminsWithSupabaseDatabase();
    storageService.syncContactsWithSupabaseDatabase();
    storageService.syncBookingsWithSupabaseDatabase();
    notificationService.requestPermission();

    // Optimized Background Sync Engine (45-Second Polling Loop to prevent Supabase Egress quota drain)
    const syncInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        storageService.syncTicketsWithSupabaseDatabase();
        storageService.syncWithSupabaseDatabase();
        storageService.syncAnnouncementsWithSupabaseDatabase();
        storageService.syncResidentsWithSupabaseDatabase();
        storageService.syncAdminsWithSupabaseDatabase();
        storageService.syncContactsWithSupabaseDatabase();
        storageService.syncBookingsWithSupabaseDatabase();
      }
    }, 45000);

    const handleUpdate = () => loadData();
    window.addEventListener('society_data_updated', handleUpdate);
    window.addEventListener('society_helpers_updated', handleUpdate);
    window.addEventListener('society_flat_changed', handleUpdate);
    window.addEventListener('society_admin_session_changed', handleUpdate);
    window.addEventListener('society_admins_updated', handleUpdate);
    window.addEventListener('society_contacts_updated', handleUpdate);

    return () => {
      clearInterval(syncInterval);
      window.removeEventListener('society_data_updated', handleUpdate);
      window.removeEventListener('society_helpers_updated', handleUpdate);
      window.removeEventListener('society_flat_changed', handleUpdate);
      window.removeEventListener('society_admin_session_changed', handleUpdate);
      window.removeEventListener('society_admins_updated', handleUpdate);
      window.removeEventListener('society_contacts_updated', handleUpdate);
    };
  }, []);

  const handleFlatSelect = (flatId: string) => {
    storageService.setCurrentFlatId(flatId);
    const found = flats.find(f => f.id === flatId);
    if (found) setCurrentFlat(found);
  };

  const handleAdminLogout = () => {
    storageService.setCurrentAdmin(null);
    setCurrentAdmin(null);
  };

  // Ticket Handlers
  const handleAddTicket = (newTicketData: Omit<Ticket, 'id' | 'createdAt'>) => {
    const newTicket: Ticket = {
      ...newTicketData,
      id: `tkt-${Date.now().toString().slice(-4)}`,
      createdAt: getLocalISOString(),
    };
    const updated = [newTicket, ...tickets];
    setTickets(updated);
    storageService.saveTickets(updated);

    // OneSignal Push Notification: Ticket Raised
    sendTicketPushNotification('RAISED', newTicket).catch(err => {
      console.warn('[OneSignal Ticket Push Error]', err);
    });
  };

  const handleUpdateTicket = (ticketId: string, updates: Partial<Ticket>) => {
    const existingTicket = tickets.find(t => t.id === ticketId);
    const updated = tickets.map(t => t.id === ticketId ? { ...t, ...updates } : t);
    setTickets(updated);
    storageService.saveTickets(updated);

    if (existingTicket) {
      const mergedTicket = { ...existingTicket, ...updates };

      // 1. Check if Vendor/Staff assigned
      if (updates.assignedVendor && updates.assignedVendor !== existingTicket.assignedVendor) {
        sendTicketPushNotification('ASSIGNED', mergedTicket).catch(err => {
          console.warn('[OneSignal Ticket Assigned Push Error]', err);
        });
      }

      // 2. Check if Status updated to Resolved / Closed
      if (updates.status === 'Resolved' && existingTicket.status !== 'Resolved') {
        sendTicketPushNotification('RESOLVED', mergedTicket).catch(err => {
          console.warn('[OneSignal Ticket Resolved Push Error]', err);
        });
      }
    }
  };

  // Payment Handlers
  const handleAddPayment = (newPaymentData: Omit<Payment, 'id' | 'submittedAt'>) => {
    const newPayment: Payment = {
      ...newPaymentData,
      id: `pay-${Date.now().toString().slice(-4)}`,
      submittedAt: getLocalISOString(),
    };
    const updated = [newPayment, ...payments];
    setPayments(updated);
    storageService.savePayments(updated);
  };

  const handleVerifyPayment = (paymentId: string, status: PaymentStatus, reason?: string) => {
    const updated = payments.map(p => {
      if (p.id === paymentId) {
        return {
          ...p,
          status,
          verifiedAt: getLocalISOString(),
          verifiedByAdminId: currentAdmin?.id || 'admin-super-16',
          rejectionReason: reason
        };
      }
      return p;
    });
    setPayments(updated);
    storageService.savePayments(updated);
  };

  // Expense Handlers
  const handleAddExpense = (newExpData: Omit<SocietyExpense, 'id'>) => {
    const newExp: SocietyExpense = {
      ...newExpData,
      id: `exp-${Date.now().toString().slice(-4)}`,
    };
    const updated = [newExp, ...expenses];
    setExpenses(updated);
    storageService.saveExpenses(updated);
  };

  // Announcement Handlers
  const handleAddNotice = (newNoticeData: Omit<Announcement, 'id' | 'createdAt' | 'ackCount'>) => {
    const newNotice: Announcement = {
      ...newNoticeData,
      id: `ann-${Date.now().toString().slice(-4)}`,
      createdAt: getLocalISOString(),
      ackCount: 0,
    };
    const updated = [newNotice, ...announcements];
    setAnnouncements(updated);
    storageService.saveAnnouncements(updated);

    // OneSignal Push Notification: General Announcement / Notice
    sendAnnouncementPushNotification(newNotice).catch(err => {
      console.warn('[OneSignal Notice Push Error]', err);
    });
  };

  const handleTogglePin = (noticeId: string) => {
    const updated = announcements.map(a => a.id === noticeId ? { ...a, isPinned: !a.isPinned } : a);
    setAnnouncements(updated);
    storageService.saveAnnouncements(updated);
  };

  const handleUpdateNotice = (noticeId: string, updates: Partial<Announcement>) => {
    const updated = announcements.map(a => a.id === noticeId ? { ...a, ...updates } : a);
    setAnnouncements(updated);
    storageService.saveAnnouncements(updated);
  };

  // Resident Handlers (Only Admin / Super Admin)
  const handleAddResident = (newResidentData: Omit<Resident, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>) => {
    const adminSignature = currentAdmin 
      ? `${currentAdmin.adminType === 'SuperAdmin' ? 'Super Admin' : 'Admin'} (${currentAdmin.name})`
      : 'Admin';
    const newResident: Resident = {
      ...newResidentData,
      id: `res-${Date.now().toString().slice(-4)}`,
      createdAt: getLocalISOString(),
      createdBy: adminSignature,
    };
    const updated = [...residents, newResident];
    setResidents(updated);
    storageService.saveResidents(updated);
  };

  const handleUpdateResident = (residentId: string, updates: Omit<Resident, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>) => {
    const adminSignature = currentAdmin 
      ? `${currentAdmin.adminType === 'SuperAdmin' ? 'Super Admin' : 'Admin'} (${currentAdmin.name})`
      : 'Admin';
    const updated = residents.map(r => r.id === residentId ? { 
      ...r, 
      ...updates, 
      updatedAt: getLocalISOString(), 
      updatedBy: adminSignature 
    } : r);
    setResidents(updated);
    storageService.saveResidents(updated);
  };

  const handleDeleteResident = (residentId: string) => {
    const updated = residents.filter(r => r.id !== residentId);
    setResidents(updated);
    storageService.saveResidents(updated);
    deleteResidentFromSupabase(residentId).catch(() => {});
  };

  // Contact Handlers (Only Admin / Super Admin)
  const adminSignature = () => currentAdmin
    ? `${currentAdmin.adminType === 'SuperAdmin' ? 'Super Admin' : 'Admin'} (${currentAdmin.name})`
    : 'Admin';

  const handleAddContact = (data: Omit<EmergencyContact, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>) => {
    const newContact: EmergencyContact = {
      ...data,
      id: `cc-${Date.now().toString().slice(-6)}`,
      createdAt: getLocalISOString(),
      createdBy: adminSignature(),
    };
    const updated = [...contacts, newContact];
    setContacts(updated);
    storageService.saveContacts(updated);
  };

  const handleUpdateContact = (id: string, data: Omit<EmergencyContact, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>) => {
    const updated = contacts.map(c => c.id === id ? {
      ...c, ...data,
      updatedAt: getLocalISOString(),
      updatedBy: adminSignature(),
    } : c);
    setContacts(updated);
    storageService.saveContacts(updated);
  };

  const handleDeleteContact = (id: string) => {
    const updated = contacts.filter(c => c.id !== id);
    setContacts(updated);
    storageService.saveContacts(updated);
    deleteContactFromSupabase(id).catch(() => {});
  };

  // Booking Handlers
  const handleAddBooking = (newBookingData: Omit<AmenityBooking, 'id' | 'insertedAt' | 'hasCompleted' | 'status'>) => {
    const nowISO = getLocalISOString();
    const newBooking: AmenityBooking = {
      ...newBookingData,
      id: `bk-${Date.now().toString().slice(-6)}`,
      insertedAt: nowISO,
      hasCompleted: 'No',
      status: 'Confirmed',
    };
    const updated = [newBooking, ...bookings];
    setBookings(updated);
    storageService.saveBookings(updated);

    // OneSignal Push Notification: Amenity Slot Reserved
    sendAmenityPushNotification(newBooking).catch(err => {
      console.warn('[OneSignal Amenity Push Error]', err);
    });
  };

  const handleCancelBooking = (bookingId: string, reason?: string) => {
    const nowISO = getLocalISOString();
    const updated = bookings.map(b => {
      if (b.id === bookingId) {
        return {
          ...b,
          status: 'Cancelled' as const,
          cancelledAt: nowISO,
          cancellationReason: reason || 'Cancelled by Management',
          modifiedAt: nowISO,
        };
      }
      return b;
    });
    setBookings(updated);
    storageService.saveBookings(updated);
  };

  if (!currentFlat) return null;

  const emergencyCount = announcements.filter(a => a.priorityCategory === 'EMERGENCY').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
      <div>
        {/* Main Navbar */}
        <Navbar
          currentRole={currentRole}
          onRoleChange={setCurrentRole}
          currentAdmin={currentAdmin}
          onAdminLogout={handleAdminLogout}
          onOpenAdminLogin={() => setShowAdminLogin(true)}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          emergencyCount={emergencyCount}
          isHamburgerOpen={isHamburgerOpen}
          onToggleHamburger={() => setIsHamburgerOpen(!isHamburgerOpen)}
          theme={theme}
          onThemeChange={setTheme}
        />

        {/* Content Body */}
        <main className="max-w-7xl mx-auto px-4 py-6">
          {activeTab === 'home' && (
            <HomePage onOpenMenu={() => setIsHamburgerOpen(true)} />
          )}

          {activeTab === 'helpers' && (
            <HelperDirectory
              currentRole={currentRole}
              currentAdmin={currentAdmin}
            />
          )}

          {activeTab === 'tickets' && (
            <TicketBoard
              tickets={tickets}
              onAddTicket={handleAddTicket}
              onUpdateTicket={handleUpdateTicket}
              currentFlat={currentFlat}
              currentRole={currentRole}
            />
          )}

          {activeTab === 'notices' && (
            <NoticeBoard
              announcements={announcements}
              onAddNotice={handleAddNotice}
              onUpdateNotice={handleUpdateNotice}
              onTogglePin={handleTogglePin}
              currentRole={currentRole}
              currentAdmin={currentAdmin}
            />
          )}

          {activeTab === 'finance' && (
            <FinancialTracker
              payments={payments}
              expenses={expenses}
              onAddPayment={handleAddPayment}
              onVerifyPayment={handleVerifyPayment}
              onAddExpense={handleAddExpense}
              currentFlat={currentFlat}
              currentRole={currentRole}
            />
          )}

          {activeTab === 'amenities' && (
            <AmenityBookingComponent
              bookings={bookings}
              onAddBooking={handleAddBooking}
              onCancelBooking={handleCancelBooking}
              currentFlat={currentFlat}
              currentRole={currentRole}
              currentAdmin={currentAdmin}
            />
          )}

          {activeTab === 'directory' && (
            <ResidentDirectory
              residents={residents}
              onAddResident={handleAddResident}
              onUpdateResident={handleUpdateResident}
              onDeleteResident={handleDeleteResident}
              currentRole={currentRole}
            />
          )}

          {activeTab === 'emergency' && (
            <EmergencyDirectory
              contacts={contacts}
              currentFlat={currentFlat}
              currentRole={currentRole}
              currentAdmin={currentAdmin}
              onAddContact={handleAddContact}
              onUpdateContact={handleUpdateContact}
              onDeleteContact={handleDeleteContact}
            />
          )}

          {activeTab === 'admins' && (
            <AdminManagementPanel
              currentAdmin={currentAdmin}
              currentRole={currentRole}
              onAdminsUpdated={loadData}
            />
          )}
        </main>
      </div>

      {/* Admin Login Modal */}
      <AdminLoginModal
        isOpen={showAdminLogin}
        onClose={() => setShowAdminLogin(false)}
        onLoginSuccess={(admin) => {
          setCurrentAdmin(admin);
          setCurrentRole('Management');
        }}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 px-4 text-xs text-slate-500 mt-12">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-sky-400" />
            <span className="font-semibold text-slate-300">Vaishnavi Pride High-Rise Society</span>
            <span>| 22 Floors (154 Units)</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowSqlModal(true)}
              className="text-sky-400 hover:underline flex items-center gap-1 font-mono text-[11px]"
            >
              <Database className="w-3.5 h-3.5" />
              View Zero-Cost Supabase SQL Schema
            </button>
            <span>•</span>
            <span className="text-slate-400">100% Free Infrastructure ($0.00 / Mo)</span>
          </div>
        </div>
      </footer>

      {/* SQL Migration Modal */}
      {showSqlModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-2xl p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Database className="w-5 h-5 text-sky-400" />
                Supabase Zero-Cost PostgreSQL Migration Schema
              </h3>
              <button onClick={() => setShowSqlModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <p className="text-xs text-slate-300">
              Run this SQL script in your free Supabase SQL Editor to provision cloud database tables for all society entities including Admin hierarchy.
            </p>

            <pre className="bg-slate-950 p-4 rounded-xl text-[11px] font-mono text-emerald-400 border border-slate-800 overflow-x-auto select-all">
              {SUPABASE_SQL_SCHEMA}
            </pre>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowSqlModal(false)}
                className="px-4 py-1.5 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-xl text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
