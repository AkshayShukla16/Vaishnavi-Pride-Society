import { Flat, Ticket, Payment, SocietyExpense, Announcement, AmenityBooking, EmergencyContact, AdminUser, HelperPerson, Resident } from '../types/society';
import { syncHelperToSupabase, deleteHelperFromSupabase, fetchHelpersFromSupabase, syncTicketToSupabase, fetchTicketsFromSupabase, deleteTicketFromSupabase, fetchAnnouncementsFromSupabase, syncAnnouncementToSupabase, fetchResidentDataFromSupabase, syncResidentToSupabase, deleteResidentFromSupabase, fetchAdminsFromSupabase, syncAdminToSupabase, deleteAdminFromSupabase, fetchContactsFromSupabase, syncContactToSupabase, deleteContactFromSupabase, fetchBookingsFromSupabase, syncBookingToSupabase, deleteBookingFromSupabase } from './supabaseClient';

const STORAGE_KEYS = {
  FLATS: 'vp_flats_v1',
  TICKETS: 'vp_tickets_v1',
  PAYMENTS: 'vp_payments_v1',
  EXPENSES: 'vp_expenses_v1',
  ANNOUNCEMENTS: 'vp_announcements_v1',
  BOOKINGS: 'vp_bookings_v3',
  RESIDENTS: 'vp_residents_v1',
  CONTACTS: 'vp_contacts_v2',
  HELPERS: 'vp_helpers_v1',
  CURRENT_FLAT_ID: 'vp_current_flat_id',
  ADMINS: 'vp_admins_v2', // bumped version to force exact credentials update
  CURRENT_ADMIN: 'vp_current_admin_v2',
};

// Designated Super Admins with EXACT credentials
const INITIAL_ADMINS: AdminUser[] = [
  {
    id: 'admin-super-16',
    email: 'arshukla16@gmail.com',
    passwordHash: 'Flat707Akshay',
    name: 'AKSHAY KUMAR SHUKLA',
    phone: '+91 98765 00016',
    adminType: 'SuperAdmin',
    createdAt: new Date('2026-01-01').toISOString(),
    createdBy: 'System Seeding',
  },
  {
    id: 'admin-super-44',
    email: 'arshukla44@gmail.com',
    passwordHash: 'Flat707Ashish',
    name: 'ASHISH SHUKLA',
    phone: '+91 98765 00044',
    adminType: 'SuperAdmin',
    createdAt: new Date('2026-01-01').toISOString(),
    createdBy: 'System Seeding',
  },
  {
    id: 'admin-base-1',
    email: 'secretary@vaishnavipride.com',
    passwordHash: 'secretary123',
    name: 'Rajesh Sharma (Society Secretary)',
    phone: '+91 98765 10101',
    adminType: 'BaseAdmin',
    createdAt: new Date('2026-02-01').toISOString(),
    createdBy: 'System Seeding',
  }
];

const INITIAL_HELPERS: HelperPerson[] = [];

// Seed 154 units across 22 floors
function generateInitialFlats(): Flat[] {
  const flats: Flat[] = [];
  const sampleNames = [
    'Rajesh Sharma', 'Priya Patel', 'Amitabh Verma', 'Ananya Deshmukh',
    'Vikram Malhotra', 'Sunita Rao', 'Karan Gupta', 'Meera Nair',
    'Siddharth Joshi', 'Deepika Roy', 'Rohan Kulkarni', 'Kavita Mehta'
  ];

  for (let floor = 1; floor <= 22; floor++) {
    for (let unit = 1; unit <= 7; unit++) {
      const flatNum = `${floor}${unit < 10 ? '0' + unit : unit}`;
      const isCommittee = (floor === 15 && unit === 1) || (floor === 1 && unit === 1);
      const nameIndex = (floor * 7 + unit) % sampleNames.length;
      
      flats.push({
        id: `flat-${flatNum}`,
        flatNumber: flatNum,
        floorNumber: floor,
        ownerName: sampleNames[nameIndex] + (unit === 1 ? ' (Owner)' : ''),
        residentContact: `+91 98765 ${Math.floor(10000 + Math.random() * 90000)}`,
        role: isCommittee ? 'Admin' : 'Resident',
      });
    }
  }
  return flats;
}

const INITIAL_TICKETS: Ticket[] = [
  {
    id: 'tkt-101',
    flatId: 'flat-1407',
    flatNumber: '1407',
    title: 'Tower A Lift #2 Emergency Stop Sensor Glitch',
    description: 'Elevator #2 Jerks violently near 14th floor landing and displays error code E-04.',
    category: 'Elevator',
    locationTag: 'Elevator Shaft A - 14th Floor Landing',
    status: 'In Progress',
    priority: 'Urgent',
    assignedVendor: 'KONE Elevator Services India',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: 'tkt-102',
    flatId: 'flat-804',
    flatNumber: '804',
    title: 'Corridor Light Tube Flickering',
    description: 'Common corridor LED tube light flickering outside flat 804 & 805.',
    category: 'Lighting',
    locationTag: 'Floor 8 West Corridor',
    status: 'Resolved',
    priority: 'Normal',
    assignedVendor: 'In-House Electrician (Suresh)',
    afterPhotoUrl: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=500&auto=format&fit=crop&q=60',
    createdAt: new Date(Date.now() - 3600000 * 28).toISOString(),
    resolvedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    reopenWindowExpiry: new Date(Date.now() + 3600000 * 20).toISOString(),
  },
  {
    id: 'tkt-103',
    flatId: 'flat-301',
    flatNumber: '301',
    title: 'Basement B2 Water Leakage Near Column B-12',
    description: 'Seepage noticed near drainage pipe in basement parking B2.',
    category: 'Plumbing',
    locationTag: 'Basement B2 Parking Column 12',
    status: 'Open',
    priority: 'Urgent',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  }
];

const INITIAL_PAYMENTS: Payment[] = [
  {
    id: 'pay-1',
    flatId: 'flat-1402',
    flatNumber: '1402',
    ownerName: 'Vikram Malhotra',
    amount: 4500,
    monthYear: 'July 2026',
    transactionRef: 'UPI/619204928104/SBI',
    screenshotUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=500&auto=format&fit=crop&q=60',
    status: 'PENDING VERIFICATION',
    submittedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
  {
    id: 'pay-2',
    flatId: 'flat-804',
    flatNumber: '804',
    ownerName: 'Ananya Deshmukh',
    amount: 4500,
    monthYear: 'July 2026',
    transactionRef: 'UPI/619200192831/HDFC',
    screenshotUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=500&auto=format&fit=crop&q=60',
    status: 'VERIFIED',
    submittedAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    verifiedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    verifiedByAdminId: 'admin-super-16',
  },
  {
    id: 'pay-3',
    flatId: 'flat-101',
    flatNumber: '101',
    ownerName: 'Rajesh Sharma',
    amount: 4500,
    monthYear: 'July 2026',
    transactionRef: 'UPI/619208837192/ICICI',
    screenshotUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=500&auto=format&fit=crop&q=60',
    status: 'VERIFIED',
    submittedAt: new Date(Date.now() - 3600000 * 72).toISOString(),
    verifiedAt: new Date(Date.now() - 3600000 * 50).toISOString(),
    verifiedByAdminId: 'admin-super-16',
  }
];

const INITIAL_EXPENSES: SocietyExpense[] = [
  {
    id: 'exp-1',
    title: 'Monthly Security Guard Agency Salary (12 Guards)',
    category: 'Security',
    amountPaid: 185000,
    vendorName: 'Apex Security & Vigilance Services',
    invoiceUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=500&auto=format&fit=crop&q=60',
    datePaid: '2026-07-05',
    approvedByAdminId: 'admin-super-16',
  },
  {
    id: 'exp-2',
    title: 'Elevator Comprehensive AMC Q2 Payment',
    category: 'Vendor AMC',
    amountPaid: 65000,
    vendorName: 'KONE Elevators India Pvt Ltd',
    invoiceUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=500&auto=format&fit=crop&q=60',
    datePaid: '2026-07-10',
    approvedByAdminId: 'admin-super-16',
  },
  {
    id: 'exp-3',
    title: 'Common Area & Water Pump Electricity Bill',
    category: 'Utilities',
    amountPaid: 92400,
    vendorName: 'State Electricity Board (BESCOM/MSEDCL)',
    invoiceUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=500&auto=format&fit=crop&q=60',
    datePaid: '2026-07-15',
    approvedByAdminId: 'admin-super-16',
  }
];

const INITIAL_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann-1',
    title: 'CRITICAL: Scheduled Water Tank Cleaning on Sunday',
    content: 'Overhead and underground water tanks for Vaishnavi Pride will be cleaned on Sunday from 08:00 AM to 02:00 PM. Water supply will remain suspended during this window. Please store adequate water.',
    priorityCategory: 'EMERGENCY',
    isPinned: true,
    createdAt: new Date(Date.now() - 3600000 * 10).toISOString(),
    byWhom: 'Super Admin (AKSHAY)',
    ackCount: 142, // Start with some active confirmations for realistic demo
  },
  {
    id: 'ann-2',
    title: 'Independence Day Cultural Event Sign-Ups',
    content: 'We invite children and residents of all 22 floors to register for performance acts in the Clubhouse for August 15 Celebration.',
    priorityCategory: 'COMMUNITY',
    isPinned: false,
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    byWhom: 'Super Admin (AKSHAY)',
    ackCount: 89,
  }
];

const INITIAL_BOOKINGS: AmenityBooking[] = [];

const INITIAL_RESIDENTS: Resident[] = [
  {
    id: 'res-1',
    flatNumber: '1402',
    name: 'Akshay Sharma',
    mobile: '9876543210',
    age: 38,
    sex: 'Male',
    roomType: '2BHK',
    createdAt: new Date().toISOString(),
    createdBy: 'Super Admin (AKSHAY)',
  },
  {
    id: 'res-2',
    flatNumber: '1402',
    name: 'Priya Sharma',
    mobile: '9876543211',
    age: 34,
    sex: 'Female',
    roomType: '2BHK',
    createdAt: new Date().toISOString(),
    createdBy: 'Super Admin (AKSHAY)',
  },
  {
    id: 'res-3',
    flatNumber: '101',
    name: 'Rajesh Kumar',
    mobile: '9812345678',
    age: 45,
    sex: 'Male',
    roomType: '1BHK',
    createdAt: new Date().toISOString(),
    createdBy: 'Super Admin (AKSHAY)',
  }
];

const INITIAL_CONTACTS: EmergencyContact[] = [
  { id: 'cc-001', name: 'Rajesh Sharma',                    phone: '9800011101', category: 'Security',           categoryInfo: 'Main Security Gate Desk',        workType: '24/7 Gate Guard',             createdAt: new Date('2026-01-01').toISOString(), createdBy: 'Super Admin (AKSHAY KUMAR SHUKLA)' },
  { id: 'cc-002', name: 'KONE Elevator Helpline',           phone: '9800011102', category: 'Maintenance',         categoryInfo: 'KONE Elevator Technician',        workType: 'Emergency Lift Operator',      createdAt: new Date('2026-01-01').toISOString(), createdBy: 'Super Admin (AKSHAY KUMAR SHUKLA)' },
  { id: 'cc-003', name: 'Suresh (Electrician)',             phone: '9800011103', category: 'Maintenance',         categoryInfo: 'Primary Resident Electrician',    workType: 'High Voltage & Common Lights', createdAt: new Date('2026-01-01').toISOString(), createdBy: 'Super Admin (AKSHAY KUMAR SHUKLA)' },
  { id: 'cc-004', name: 'Ramesh (Plumber)',                 phone: '9800011104', category: 'Maintenance',         categoryInfo: 'Emergency Plumber',               workType: 'Pump & Overhead Leakage',      createdAt: new Date('2026-01-01').toISOString(), createdBy: 'Super Admin (AKSHAY KUMAR SHUKLA)' },
  { id: 'cc-005', name: 'Apollo Super Speciality Hospital', phone: '8026300000', category: 'Emergency Services',  categoryInfo: 'Medical Trauma & Ambulance',      workType: '24/7 Emergency Response',      createdAt: new Date('2026-01-01').toISOString(), createdBy: 'Super Admin (AKSHAY KUMAR SHUKLA)' },
  { id: 'cc-006', name: 'Mr. Rajesh Sharma',               phone: '9876510101', category: 'Management',          categoryInfo: 'Society Secretary',               workType: 'Management Committee',         createdAt: new Date('2026-01-01').toISOString(), createdBy: 'Super Admin (AKSHAY KUMAR SHUKLA)' },
];

export const storageService = {
  getAdmins(): AdminUser[] {
    const data = localStorage.getItem(STORAGE_KEYS.ADMINS);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.ADMINS, JSON.stringify(INITIAL_ADMINS));
      return INITIAL_ADMINS;
    }
    return JSON.parse(data);
  },

  saveAdmins(admins: AdminUser[]) {
    localStorage.setItem(STORAGE_KEYS.ADMINS, JSON.stringify(admins));
    window.dispatchEvent(new Event('society_admins_updated'));
    // Sync admins to Supabase
    admins.forEach(a => {
      syncAdminToSupabase(a).catch(() => {});
    });
  },

  async syncAdminsWithSupabaseDatabase() {
    const remoteAdmins = await fetchAdminsFromSupabase();
    if (remoteAdmins !== null) {
      localStorage.setItem(STORAGE_KEYS.ADMINS, JSON.stringify(remoteAdmins));
      window.dispatchEvent(new Event('society_admins_updated'));
    }
  },

  getCurrentAdmin(): AdminUser | null {
    const data = localStorage.getItem(STORAGE_KEYS.CURRENT_ADMIN);
    if (!data) return null;
    return JSON.parse(data);
  },

  setCurrentAdmin(admin: AdminUser | null) {
    if (admin) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_ADMIN, JSON.stringify(admin));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_ADMIN);
    }
    window.dispatchEvent(new Event('society_admin_session_changed'));
  },

  getFlats(): Flat[] {
    const data = localStorage.getItem(STORAGE_KEYS.FLATS);
    if (!data) {
      const initial = generateInitialFlats();
      localStorage.setItem(STORAGE_KEYS.FLATS, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(data);
  },

  getHelpers(): HelperPerson[] {
    const data = localStorage.getItem(STORAGE_KEYS.HELPERS);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.HELPERS, JSON.stringify(INITIAL_HELPERS));
      return INITIAL_HELPERS;
    }
    return JSON.parse(data);
  },

  saveHelpers(helpers: HelperPerson[]) {
    localStorage.setItem(STORAGE_KEYS.HELPERS, JSON.stringify(helpers));
    window.dispatchEvent(new Event('society_helpers_updated'));
    // Automatically sync helpers (addition or update) to Supabase table `helper`
    helpers.forEach(h => {
      syncHelperToSupabase(h).catch(() => {});
    });
  },

  deleteHelper(id: string) {
    const helpers = this.getHelpers();
    const updated = helpers.filter(h => h.id !== id);
    localStorage.setItem(STORAGE_KEYS.HELPERS, JSON.stringify(updated));
    window.dispatchEvent(new Event('society_helpers_updated'));
    // Delete from Supabase database table `helper`
    deleteHelperFromSupabase(id).catch(() => {});
  },

  async syncWithSupabaseDatabase() {
    const remoteHelpers = await fetchHelpersFromSupabase();
    if (remoteHelpers !== null) {
      localStorage.setItem(STORAGE_KEYS.HELPERS, JSON.stringify(remoteHelpers));
      window.dispatchEvent(new Event('society_helpers_updated'));
    }
  },

  getTickets(): Ticket[] {
    const data = localStorage.getItem(STORAGE_KEYS.TICKETS);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(INITIAL_TICKETS));
      return INITIAL_TICKETS;
    }
    return JSON.parse(data);
  },

  saveTickets(tickets: Ticket[]) {
    localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(tickets));
    window.dispatchEvent(new Event('society_data_updated'));
    // Automatically sync tickets (Creation, Vendor Assignment, Resolution) to Supabase table `tickets`
    tickets.forEach(t => {
      syncTicketToSupabase(t).catch(() => {});
    });
  },

  async syncTicketsWithSupabaseDatabase() {
    const remoteTickets = await fetchTicketsFromSupabase();
    if (remoteTickets !== null) {
      localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(remoteTickets));
      window.dispatchEvent(new Event('society_data_updated'));
    }
  },

  deleteTicket(id: string) {
    const tickets = this.getTickets();
    const updated = tickets.filter(t => t.id !== id);
    localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(updated));
    window.dispatchEvent(new Event('society_data_updated'));
    deleteTicketFromSupabase(id).catch(() => {});
  },

  getPayments(): Payment[] {
    const data = localStorage.getItem(STORAGE_KEYS.PAYMENTS);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(INITIAL_PAYMENTS));
      return INITIAL_PAYMENTS;
    }
    return JSON.parse(data);
  },

  savePayments(payments: Payment[]) {
    localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(payments));
    window.dispatchEvent(new Event('society_data_updated'));
  },

  getExpenses(): SocietyExpense[] {
    const data = localStorage.getItem(STORAGE_KEYS.EXPENSES);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(INITIAL_EXPENSES));
      return INITIAL_EXPENSES;
    }
    return JSON.parse(data);
  },

  saveExpenses(expenses: SocietyExpense[]) {
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
    window.dispatchEvent(new Event('society_data_updated'));
  },

  getAnnouncements(): Announcement[] {
    const data = localStorage.getItem(STORAGE_KEYS.ANNOUNCEMENTS);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(INITIAL_ANNOUNCEMENTS));
      return INITIAL_ANNOUNCEMENTS;
    }
    return JSON.parse(data);
  },

  saveAnnouncements(announcements: Announcement[]) {
    localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(announcements));
    window.dispatchEvent(new Event('society_data_updated'));
    // Sync announcements to Supabase
    announcements.forEach(a => {
      syncAnnouncementToSupabase(a).catch(() => {});
    });
  },

  async syncAnnouncementsWithSupabaseDatabase() {
    const remoteNotices = await fetchAnnouncementsFromSupabase();
    if (remoteNotices !== null) {
      localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(remoteNotices));
      window.dispatchEvent(new Event('society_data_updated'));
    }
  },

  getBookings(): AmenityBooking[] {
    const data = localStorage.getItem(STORAGE_KEYS.BOOKINGS);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(INITIAL_BOOKINGS));
      return INITIAL_BOOKINGS;
    }
    return JSON.parse(data);
  },

  saveBookings(bookings: AmenityBooking[]) {
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));
    window.dispatchEvent(new Event('society_data_updated'));
    bookings.forEach(b => {
      syncBookingToSupabase(b).catch(() => {});
    });
  },

  async syncBookingsWithSupabaseDatabase() {
    const remoteBookings = await fetchBookingsFromSupabase();
    if (remoteBookings !== null) {
      localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(remoteBookings));
      window.dispatchEvent(new Event('society_data_updated'));
    }
  },

  getContacts(): EmergencyContact[] {
    const data = localStorage.getItem(STORAGE_KEYS.CONTACTS);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.CONTACTS, JSON.stringify(INITIAL_CONTACTS));
      return INITIAL_CONTACTS;
    }
    return JSON.parse(data);
  },

  saveContacts(contacts: EmergencyContact[]) {
    localStorage.setItem(STORAGE_KEYS.CONTACTS, JSON.stringify(contacts));
    window.dispatchEvent(new Event('society_contacts_updated'));
    contacts.forEach(c => {
      syncContactToSupabase(c).catch(() => {});
    });
  },

  deleteContact(id: string) {
    const contacts = this.getContacts();
    const updated = contacts.filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEYS.CONTACTS, JSON.stringify(updated));
    window.dispatchEvent(new Event('society_contacts_updated'));
    deleteContactFromSupabase(id).catch(() => {});
  },

  async syncContactsWithSupabaseDatabase() {
    const remoteContacts = await fetchContactsFromSupabase();
    // null = Supabase not configured, keep local data unchanged
    // [] = DB is genuinely empty (e.g. all deleted), clear localStorage so UI reflects DB truth
    if (remoteContacts !== null) {
      localStorage.setItem(STORAGE_KEYS.CONTACTS, JSON.stringify(remoteContacts));
      window.dispatchEvent(new Event('society_contacts_updated'));
    }
  },

  getCurrentFlatId(): string {
    return localStorage.getItem(STORAGE_KEYS.CURRENT_FLAT_ID) || 'flat-1402';
  },

  setCurrentFlatId(id: string) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_FLAT_ID, id);
    window.dispatchEvent(new Event('society_flat_changed'));
  },

  getResidents(): Resident[] {
    const data = localStorage.getItem(STORAGE_KEYS.RESIDENTS);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.RESIDENTS, JSON.stringify(INITIAL_RESIDENTS));
      return INITIAL_RESIDENTS;
    }
    return JSON.parse(data);
  },

  saveResidents(residents: Resident[]) {
    localStorage.setItem(STORAGE_KEYS.RESIDENTS, JSON.stringify(residents));
    window.dispatchEvent(new Event('society_data_updated'));
    // Sync residents to Supabase
    residents.forEach(r => {
      syncResidentToSupabase(r).catch(() => {});
    });
  },

  async syncResidentsWithSupabaseDatabase() {
    const remoteResidents = await fetchResidentDataFromSupabase();
    if (remoteResidents !== null) {
      localStorage.setItem(STORAGE_KEYS.RESIDENTS, JSON.stringify(remoteResidents));
      window.dispatchEvent(new Event('society_data_updated'));
    }
  }
};
