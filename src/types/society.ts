export type UserRole = 'Resident' | 'Management' | 'Auditor';
export type AdminType = 'SuperAdmin' | 'BaseAdmin';

export interface AdminUser {
  id: string;
  email: string;
  passwordHash: string; // Plain/hashed password for zero-cost demo auth
  name: string;
  phone?: string;
  adminType: AdminType;
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface Flat {
  id: string;
  flatNumber: string; // e.g. "1402"
  floorNumber: number; // 1 to 22
  ownerName: string;
  residentContact: string;
  role: 'Resident' | 'Admin';
}

export type TicketCategory = 'Elevator' | 'Plumbing' | 'Lighting' | 'Cleanliness' | 'Parking' | 'Security' | 'Other';
export type TicketStatus = 'Open' | 'In Progress' | 'Resolved';
export type TicketPriority = 'Urgent' | 'Normal' | 'Scheduled';

export interface Ticket {
  id: string;
  flatId: string; // Flat reference
  flatNumber: string;
  title: string;
  description: string;
  category: TicketCategory;
  locationTag: string; // e.g. "Floor 14 Common Hallway"
  photoUrl?: string;
  status: TicketStatus;
  priority: TicketPriority;
  assignedVendor?: string;
  assignedAt?: string; // Timestamp when vendor/staff was assigned
  afterPhotoUrl?: string;
  resolutionRemarks?: string; // Admin work resolution remarks
  createdAt: string;
  resolvedAt?: string;
  reopenWindowExpiry?: string; // 24-hr reopen deadline ISO string
  reopenedCount?: number;
}

export type PaymentStatus = 'PENDING VERIFICATION' | 'VERIFIED' | 'REJECTED';

export interface Payment {
  id: string;
  flatId: string;
  flatNumber: string;
  ownerName: string;
  amount: number;
  monthYear: string; // e.g. "July 2026"
  transactionRef: string;
  screenshotUrl: string;
  status: PaymentStatus;
  submittedAt: string;
  verifiedAt?: string;
  verifiedByAdminId?: string;
  rejectionReason?: string;
}

export interface SocietyExpense {
  id: string;
  title: string;
  category: 'Wages' | 'Utilities' | 'Security' | 'Maintenance' | 'Vendor AMC' | 'Misc';
  amountPaid: number;
  vendorName: string;
  invoiceUrl: string; // Soft copy PDF / photo
  datePaid: string;
  approvedByAdminId: string;
}

export type NoticePriority = 'EMERGENCY' | 'MAINTENANCE' | 'COMMUNITY' | 'GENERAL';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  priorityCategory: NoticePriority;
  isPinned: boolean;
  createdAt: string;
  byWhom: string; // The name and role of the admin posting the announcement (e.g. "Super Admin (AKSHAY)")
  ackCount: number; // Counter for unique browser acknowledgments (max 154)
}

export type AmenityType = 'Club House' | 'Gym' | 'Rooftop Open Space' | 'Meeting point Space' | 'All Space';

export interface AmenityBooking {
  id: string;
  flatId?: string;
  flatNumber: string;       // Mandatory
  personName: string;       // Mandatory
  mobileNumber: string;     // Mandatory (10 digits)
  facilityType: AmenityType;
  bookingDate: string;      // YYYY-MM-DD
  startTime: string;        // HH:mm
  endTime: string;          // HH:mm
  purpose?: string;
  insertedAt: string;       // ISO timestamp
  hasCompleted: 'Yes' | 'No';
  cancelledAt?: string;
  cancellationReason?: string;
  modifiedAt?: string;
  status: 'Confirmed' | 'Cancelled';
  amenityName?: AmenityType; // Alias for backward compatibility
}

export interface EmergencyContact {
  id: string;
  name: string;          // Personname
  phone: string;         // mobilenumber
  category: string;      // Category (e.g. "Security")
  categoryInfo: string;  // Category info (e.g. "Main Security Gate Desk")
  workType: string;      // Work type (e.g. "24/7 Gate Guard")
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

export type HelperCategory = 'Plumber' | 'Electrician' | 'Housekeeping' | 'Carpenter' | 'Painter' | 'Appliance Repair' | 'Pest Control' | 'Driver & Security' | 'Other';

export interface HelperPerson {
  id: string;
  name: string;
  category: HelperCategory;
  phone: string;
  secondaryPhone?: string;
  workingHours: string;
  experienceYears?: number;
  rating?: number; // e.g. 4.8
  addedByAdminName: string;
  addedAt: string;
  notes?: string;
}

export interface Resident {
  id: string;
  flatNumber: string;
  name: string;
  mobile: string;
  age: number;
  sex: string;
  roomType: '1BHK' | '2BHK';
  createdAt: string;
  updatedAt?: string;
  createdBy: string;
  updatedBy?: string;
}
