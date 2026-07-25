/**
 * Zero-Cost Supabase Backend Integration Adapter
 * Supabase provides a 100% free tier (500 MB Postgres database, 1 GB Storage, 50,000 Monthly Active Users).
 * Below is the ready-to-run SQL schema to deploy to Supabase SQL Editor, including `helper` and `tickets` tables.
 */

import { HelperPerson, Ticket, Announcement, Resident, AdminUser, EmergencyContact, AmenityBooking } from '../types/society';

export const SUPABASE_SQL_SCHEMA = `
-- 1. Create Flats Table (22 Floors / 154 Units)
CREATE TABLE IF NOT EXISTS public.flats (
    id TEXT PRIMARY KEY,
    flat_number VARCHAR(10) NOT NULL UNIQUE,
    floor_number INT NOT NULL CHECK (floor_number BETWEEN 1 AND 22),
    owner_name TEXT NOT NULL,
    resident_contact VARCHAR(20) NOT NULL,
    role VARCHAR(20) DEFAULT 'Resident' CHECK (role IN ('Resident', 'Admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Tickets Table
CREATE TABLE IF NOT EXISTS public.tickets (
    id TEXT PRIMARY KEY,
    flat_number VARCHAR(20),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    location_tag TEXT NOT NULL,
    photo_url TEXT,
    status VARCHAR(20) DEFAULT 'Open' CHECK (status IN ('Open', 'In Progress', 'Resolved')),
    priority VARCHAR(20) DEFAULT 'Normal' CHECK (priority IN ('Urgent', 'Normal', 'Scheduled')),
    assigned_vendor TEXT,
    assigned_at TIMESTAMP WITH TIME ZONE,
    after_photo_url TEXT,
    resolution_remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    resolved_at TIMESTAMP WITH TIME ZONE,
    reopen_window_expiry TIMESTAMP WITH TIME ZONE
);

-- 3. Create Payments Table
CREATE TABLE IF NOT EXISTS public.payments (
    id TEXT PRIMARY KEY,
    flat_id TEXT REFERENCES public.flats(id) ON DELETE CASCADE,
    flat_number VARCHAR(10) NOT NULL,
    owner_name TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    month_year VARCHAR(30) NOT NULL,
    transaction_ref VARCHAR(100) NOT NULL,
    screenshot_url TEXT NOT NULL,
    status VARCHAR(30) DEFAULT 'PENDING VERIFICATION' CHECK (status IN ('PENDING VERIFICATION', 'VERIFIED', 'REJECTED')),
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    verified_at TIMESTAMP WITH TIME ZONE,
    verified_by_admin_id TEXT
);

-- 4. Create Society Expenses Table
CREATE TABLE IF NOT EXISTS public.society_expenses (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    amount_paid NUMERIC(10, 2) NOT NULL,
    vendor_name TEXT NOT NULL,
    invoice_url TEXT NOT NULL,
    date_paid DATE NOT NULL,
    approved_by_admin_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Create Announcements Table
CREATE TABLE IF NOT EXISTS public.announcements (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    is_pinned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    by_whom TEXT NOT NULL,
    ack_count INT DEFAULT 0 NOT NULL
);


-- 6. Create Amenity Bookings Table
CREATE TABLE IF NOT EXISTS public.amenity_bookings (
    id TEXT PRIMARY KEY,
    flat_id TEXT REFERENCES public.flats(id) ON DELETE CASCADE,
    flat_number VARCHAR(10) NOT NULL,
    amenity_name VARCHAR(50) NOT NULL,
    booking_date DATE NOT NULL,
    start_time VARCHAR(10) NOT NULL,
    end_time VARCHAR(10) NOT NULL,
    status VARCHAR(20) DEFAULT 'Confirmed' CHECK (status IN ('Confirmed', 'Cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Create Resident Data Table (Matrix)
CREATE TABLE IF NOT EXISTS public.residentdata (
    id TEXT PRIMARY KEY,
    flat_number VARCHAR(10) NOT NULL,
    name TEXT NOT NULL,
    mobile VARCHAR(20) NOT NULL,
    age INT NOT NULL,
    sex VARCHAR(10) NOT NULL,
    room_type VARCHAR(10) NOT NULL CHECK (room_type IN ('1BHK', '2BHK')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_by TEXT NOT NULL,
    updated_by TEXT
);

-- 7. Create Helper Table (Stores helper directory data)
CREATE TABLE IF NOT EXISTS public.helper (
    id TEXT PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    category VARCHAR(60) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    secondary_phone VARCHAR(30),
    working_hours VARCHAR(100) NOT NULL,
    experience_years INT DEFAULT 5,
    rating NUMERIC(3, 2) DEFAULT 4.8,
    added_by_admin_name VARCHAR(60) NOT NULL,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    notes TEXT
);

-- Row Level Security (RLS) Policies
ALTER TABLE public.flats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.helper ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.residentdata ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Read Access for Financial Transparency" ON public.payments FOR SELECT USING (true);
CREATE POLICY "Public Read Access for Tickets" ON public.tickets FOR SELECT USING (true);
CREATE POLICY "Public Read Access for Expenses" ON public.society_expenses FOR SELECT USING (true);
CREATE POLICY "Public Read Access for Helper Directory" ON public.helper FOR SELECT USING (true);
CREATE POLICY "Public Read Access for Announcements" ON public.announcements FOR SELECT USING (true);
CREATE POLICY "Public Insert Access for Announcements" ON public.announcements FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Access for Announcements" ON public.announcements FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public Delete Access for Announcements" ON public.announcements FOR DELETE USING (true);

CREATE POLICY "Public Read Access for ResidentData" ON public.residentdata FOR SELECT USING (true);
CREATE POLICY "Public Insert Access for ResidentData" ON public.residentdata FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Access for ResidentData" ON public.residentdata FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public Delete Access for ResidentData" ON public.residentdata FOR DELETE USING (true);

-- 8. Create Admin Directory Table
CREATE TABLE IF NOT EXISTS public.admindirectory (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    user_id TEXT UNIQUE NOT NULL,
    cached_password TEXT NOT NULL,
    admin_type VARCHAR(20) DEFAULT 'BaseAdmin' CHECK (admin_type IN ('SuperAdmin', 'BaseAdmin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_by TEXT NOT NULL DEFAULT 'System Seeding',
    updated_by TEXT
);

-- Seed Super Admins
INSERT INTO public.admindirectory (id, name, phone, user_id, cached_password, admin_type, created_by)
VALUES 
('admin-super-16', 'AKSHAY KUMAR SHUKLA', '+91 98765 00016', 'arshukla16@gmail.com', 'Flat707Akshay', 'SuperAdmin', 'System Seeding'),
('admin-super-44', 'ASHISH SHUKLA', '+91 98765 00044', 'arshukla44@gmail.com', 'Flat707Ashish', 'SuperAdmin', 'System Seeding')
ON CONFLICT (user_id) DO UPDATE 
SET name = EXCLUDED.name,
    phone = EXCLUDED.phone,
    cached_password = EXCLUDED.cached_password,
    admin_type = EXCLUDED.admin_type;

-- Enable RLS
ALTER TABLE public.admindirectory ENABLE ROW LEVEL SECURITY;

-- Enable Read/Write Access Policies
CREATE POLICY "Public Read Access for AdminDirectory" ON public.admindirectory FOR SELECT USING (true);
CREATE POLICY "Public Insert Access for AdminDirectory" ON public.admindirectory FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Access for AdminDirectory" ON public.admindirectory FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public Delete Access for AdminDirectory" ON public.admindirectory FOR DELETE USING (true);

-- 9. Create Critical Contact Directory Table
CREATE TABLE IF NOT EXISTS public.critical_contact_directory (
    id TEXT PRIMARY KEY,
    personname TEXT NOT NULL,
    mobilenumber TEXT NOT NULL,
    category TEXT NOT NULL,
    category_info TEXT NOT NULL,
    work_type TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_by TEXT NOT NULL DEFAULT 'System',
    updated_by TEXT
);

ALTER TABLE public.critical_contact_directory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Read Access for CriticalContacts" ON public.critical_contact_directory FOR SELECT USING (true);
CREATE POLICY "Public Insert Access for CriticalContacts" ON public.critical_contact_directory FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Access for CriticalContacts" ON public.critical_contact_directory FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public Delete Access for CriticalContacts" ON public.critical_contact_directory FOR DELETE USING (true);

-- 10. Create Amenity Booking Table
CREATE TABLE IF NOT EXISTS public.amenity_booking (
    id TEXT PRIMARY KEY,
    facility_type TEXT NOT NULL,
    booking_date DATE NOT NULL,
    start_time VARCHAR(10) NOT NULL,
    end_time VARCHAR(10) NOT NULL,
    purpose TEXT,
    flat_number VARCHAR(20) NOT NULL,
    person_name TEXT NOT NULL,
    mobile_number VARCHAR(20) NOT NULL,
    inserted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    has_completed VARCHAR(10) DEFAULT 'No',
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancellation_reason TEXT,
    modified_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.amenity_booking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Read Access for AmenityBooking" ON public.amenity_booking FOR SELECT USING (true);
CREATE POLICY "Public Insert Access for AmenityBooking" ON public.amenity_booking FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Access for AmenityBooking" ON public.amenity_booking FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public Delete Access for AmenityBooking" ON public.amenity_booking FOR DELETE USING (true);
`;

export interface SupabaseConfig {
  url?: string;
  anonKey?: string;
}

export const getSupabaseConfig = (): SupabaseConfig => {
  return {
    url: import.meta.env.VITE_SUPABASE_URL || '',
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || ''
  };
};

/**
 * Fetch all tickets directly from Supabase database (table: `tickets`)
 */
export async function fetchTicketsFromSupabase(): Promise<Ticket[] | null> {
  const config = getSupabaseConfig();
  if (!config.url || !config.anonKey) return null;

  try {
    const response = await fetch(`${config.url}/rest/v1/tickets?select=*&order=created_at.desc`, {
      headers: {
        'apikey': config.anonKey,
        'Authorization': `Bearer ${config.anonKey}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      return data.map((item: any) => ({
        id: item.id,
        flatId: item.flat_id || '',
        flatNumber: item.flat_number || '',
        title: item.title,
        description: item.description,
        category: item.category,
        locationTag: item.location_tag,
        photoUrl: item.photo_url || undefined,
        status: item.status,
        priority: item.priority,
        assignedVendor: item.assigned_vendor || undefined,
        assignedAt: item.assigned_at || undefined,
        afterPhotoUrl: item.after_photo_url || undefined,
        resolutionRemarks: item.resolution_remarks || undefined,
        createdAt: item.created_at,
        resolvedAt: item.resolved_at || undefined,
        reopenWindowExpiry: item.reopen_window_expiry || undefined,
      }));
    }
  } catch (err) {
    console.warn('[Supabase Tickets Fetch Warning]', err);
  }
  return null;
}

/**
 * Sync Ticket item (Create, Assign Vendor, or Resolve) to Supabase database (table: `tickets`)
 */
export async function syncTicketToSupabase(ticket: Ticket): Promise<boolean> {
  const config = getSupabaseConfig();
  if (!config.url || !config.anonKey) return false;

  try {
    const headers = {
      'Content-Type': 'application/json',
      'apikey': config.anonKey,
      'Authorization': `Bearer ${config.anonKey}`,
      'Prefer': 'resolution=merge-duplicates',
    };

    const fullPayload: Record<string, any> = {
      id: ticket.id,
      flat_number: ticket.flatNumber || null,
      title: ticket.title,
      description: ticket.description,
      category: ticket.category,
      location_tag: ticket.locationTag,
      photo_url: ticket.photoUrl || null,
      status: ticket.status,
      priority: ticket.priority,
      assigned_vendor: ticket.assignedVendor || null,
      assigned_at: ticket.assignedAt || null,
      after_photo_url: ticket.afterPhotoUrl || null,
      resolution_remarks: ticket.resolutionRemarks || null,
      created_at: ticket.createdAt,
      resolved_at: ticket.resolvedAt || null,
      reopen_window_expiry: ticket.reopenWindowExpiry || null,
    };

    let response = await fetch(`${config.url}/rest/v1/tickets`, {
      method: 'POST',
      headers,
      body: JSON.stringify(fullPayload),
    });

    if (response.ok) {
      console.log(`[Supabase Ticket Sync Success] Saved ticket ${ticket.id} (${ticket.status}) to table \`tickets\`.`);
      return true;
    }

    // Fallback Payload if assigned_at or resolution_remarks columns don't exist yet on SQL schema
    const basePayload: Record<string, any> = {
      id: ticket.id,
      flat_number: ticket.flatNumber || null,
      title: ticket.title,
      description: ticket.description,
      category: ticket.category,
      location_tag: ticket.locationTag,
      photo_url: ticket.photoUrl || null,
      status: ticket.status,
      priority: ticket.priority,
      assigned_vendor: ticket.assignedVendor || null,
      after_photo_url: ticket.afterPhotoUrl || null,
      created_at: ticket.createdAt,
      resolved_at: ticket.resolvedAt || null,
      reopen_window_expiry: ticket.reopenWindowExpiry || null,
    };

    response = await fetch(`${config.url}/rest/v1/tickets`, {
      method: 'POST',
      headers,
      body: JSON.stringify(basePayload),
    });

    if (response.ok) {
      console.log(`[Supabase Ticket Base Sync Success] Saved base ticket ${ticket.id} (${ticket.status}) to table \`tickets\`.`);
      return true;
    } else {
      const errText = await response.text();
      console.error(`[Supabase Ticket Sync Error] Status ${response.status}:`, errText);
    }
  } catch (err) {
    console.warn('[Supabase Ticket Sync Warning]', err);
  }
  return false;
}

/**
 * Delete Ticket item from Supabase database (table: `tickets`)
 */
export async function deleteTicketFromSupabase(id: string): Promise<boolean> {
  const config = getSupabaseConfig();
  if (!config.url || !config.anonKey) return false;

  try {
    const response = await fetch(`${config.url}/rest/v1/tickets?id=eq.${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: {
        'apikey': config.anonKey,
        'Authorization': `Bearer ${config.anonKey}`,
      },
    });
    if (response.ok) {
      console.log(`[Supabase Delete Ticket Success] Removed ticket ${id} from table \`tickets\`.`);
      return true;
    }
  } catch (err) {
    console.warn('[Supabase Delete Ticket Warning]', err);
  }
  return false;
}

/**
 * Fetch all helper items directly from Supabase database (table: `helper`)
 */
export async function fetchHelpersFromSupabase(): Promise<HelperPerson[] | null> {
  const config = getSupabaseConfig();
  if (!config.url || !config.anonKey) return null;

  try {
    const response = await fetch(`${config.url}/rest/v1/helper?select=*&order=added_at.desc`, {
      headers: {
        'apikey': config.anonKey,
        'Authorization': `Bearer ${config.anonKey}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      return data.map((item: any) => ({
        id: item.id,
        name: item.name,
        category: item.category,
        phone: item.phone,
        secondaryPhone: item.secondary_phone || undefined,
        workingHours: item.working_hours,
        experienceYears: item.experience_years ? Number(item.experience_years) : 5,
        rating: item.rating ? Number(item.rating) : 4.8,
        addedByAdminName: item.added_by_admin_name,
        addedAt: item.added_at,
        notes: item.notes || undefined,
      }));
    }
  } catch (err) {
    console.warn('[Supabase Fetch Warning]', err);
  }
  return null;
}

/**
 * Sync helper item (add or update) to Supabase database (table: `helper`)
 */
export async function syncHelperToSupabase(helper: HelperPerson): Promise<boolean> {
  const config = getSupabaseConfig();
  if (!config.url || !config.anonKey) return false;

  try {
    const payload = {
      id: helper.id,
      name: helper.name,
      category: helper.category,
      phone: helper.phone,
      secondary_phone: helper.secondaryPhone || null,
      working_hours: helper.workingHours,
      experience_years: helper.experienceYears || 5,
      rating: helper.rating || 4.8,
      added_by_admin_name: helper.addedByAdminName,
      added_at: helper.addedAt,
      notes: helper.notes || null,
    };

    const response = await fetch(`${config.url}/rest/v1/helper`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': config.anonKey,
        'Authorization': `Bearer ${config.anonKey}`,
        'Prefer': 'resolution=merge-duplicates',
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      console.log(`[Supabase Sync Success] Persisted/Updated helper ${helper.name} (${helper.id}) in table \`helper\`.`);
      return true;
    } else {
      const errText = await response.text();
      console.error(`[Supabase Sync Error] Status ${response.status}:`, errText);
    }
  } catch (err) {
    console.warn('[Supabase Sync Warning]', err);
  }
  return false;
}

/**
 * Delete helper item from Supabase database (table: `helper`)
 */
export async function deleteHelperFromSupabase(id: string): Promise<boolean> {
  const config = getSupabaseConfig();
  if (!config.url || !config.anonKey) return false;

  try {
    const response = await fetch(`${config.url}/rest/v1/helper?id=eq.${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: {
        'apikey': config.anonKey,
        'Authorization': `Bearer ${config.anonKey}`,
      },
    });
    if (response.ok) {
      console.log(`[Supabase Delete Success] Removed helper ${id} from table \`helper\`.`);
      return true;
    } else {
      const errText = await response.text();
      console.error(`[Supabase Delete Error] Status ${response.status}:`, errText);
    }
  } catch (err) {
    console.warn('[Supabase Delete Warning]', err);
  }
  return false;
}

/**
 * Fetch all announcements directly from Supabase database (table: `announcements`)
 */
export async function fetchAnnouncementsFromSupabase(): Promise<Announcement[] | null> {
  const config = getSupabaseConfig();
  if (!config.url || !config.anonKey) return null;

  try {
    const response = await fetch(`${config.url}/rest/v1/announcements?select=*&order=created_at.desc`, {
      headers: {
        'apikey': config.anonKey,
        'Authorization': `Bearer ${config.anonKey}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      return data.map((item: any) => ({
        id: item.id,
        title: item.title,
        content: item.content,
        priorityCategory: item.category,
        isPinned: item.is_pinned,
        createdAt: item.created_at,
        byWhom: item.by_whom,
        ackCount: item.ack_count ? Number(item.ack_count) : 0,
      }));
    }
  } catch (err) {
    console.warn('[Supabase Announcements Fetch Warning]', err);
  }
  return null;
}

/**
 * Sync Announcement (create or update) to Supabase database (table: `announcements`)
 */
export async function syncAnnouncementToSupabase(announcement: Announcement): Promise<boolean> {
  const config = getSupabaseConfig();
  if (!config.url || !config.anonKey) return false;

  try {
    const payload = {
      id: announcement.id,
      title: announcement.title,
      content: announcement.content,
      category: announcement.priorityCategory,
      is_pinned: announcement.isPinned,
      created_at: announcement.createdAt,
      by_whom: announcement.byWhom,
      ack_count: announcement.ackCount || 0,
    };

    const response = await fetch(`${config.url}/rest/v1/announcements`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': config.anonKey,
        'Authorization': `Bearer ${config.anonKey}`,
        'Prefer': 'resolution=merge-duplicates',
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      console.log(`[Supabase Announcement Sync Success] Saved announcement ${announcement.id} to table \`announcements\`.`);
      return true;
    } else {
      const errText = await response.text();
      console.error(`[Supabase Announcement Sync Error] Status ${response.status}:`, errText);
    }
  } catch (err) {
    console.warn('[Supabase Announcement Sync Warning]', err);
  }
  return false;
}

/**
 * Fetch all resident data from Supabase database (table: `residentdata`)
 */
export async function fetchResidentDataFromSupabase(): Promise<Resident[] | null> {
  const config = getSupabaseConfig();
  if (!config.url || !config.anonKey) return null;

  try {
    const response = await fetch(`${config.url}/rest/v1/residentdata?select=*`, {
      headers: {
        'apikey': config.anonKey,
        'Authorization': `Bearer ${config.anonKey}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      return data.map((item: any) => ({
        id: item.id,
        flatNumber: item.flat_number,
        name: item.name,
        mobile: item.mobile,
        age: Number(item.age),
        sex: item.sex,
        roomType: item.room_type,
        createdAt: item.created_at,
        updatedAt: item.updated_at || undefined,
        createdBy: item.created_by,
        updatedBy: item.updated_by || undefined,
      }));
    }
  } catch (err) {
    console.warn('[Supabase Resident Fetch Warning]', err);
  }
  return null;
}

/**
 * Sync Resident (create or update) to Supabase database (table: `residentdata`)
 */
export async function syncResidentToSupabase(resident: Resident): Promise<boolean> {
  const config = getSupabaseConfig();
  if (!config.url || !config.anonKey) return false;

  try {
    const payload = {
      id: resident.id,
      flat_number: resident.flatNumber,
      name: resident.name,
      mobile: resident.mobile,
      age: resident.age,
      sex: resident.sex,
      room_type: resident.roomType,
      created_at: resident.createdAt,
      updated_at: resident.updatedAt || null,
      created_by: resident.createdBy,
      updated_by: resident.updatedBy || null,
    };

    const response = await fetch(`${config.url}/rest/v1/residentdata`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': config.anonKey,
        'Authorization': `Bearer ${config.anonKey}`,
        'Prefer': 'resolution=merge-duplicates',
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      console.log(`[Supabase Resident Sync Success] Saved resident ${resident.name} (${resident.id}) to table \`residentdata\`.`);
      return true;
    } else {
      const errText = await response.text();
      console.error(`[Supabase Resident Sync Error] Status ${response.status}:`, errText);
    }
  } catch (err) {
    console.warn('[Supabase Resident Sync Warning]', err);
  }
  return false;
}

/**
 * Delete Resident from Supabase database (table: `residentdata`)
 */
export async function deleteResidentFromSupabase(id: string): Promise<boolean> {
  const config = getSupabaseConfig();
  if (!config.url || !config.anonKey) return false;

  try {
    const response = await fetch(`${config.url}/rest/v1/residentdata?id=eq.${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: {
        'apikey': config.anonKey,
        'Authorization': `Bearer ${config.anonKey}`,
      },
    });
    if (response.ok) {
      console.log(`[Supabase Resident Delete Success] Removed resident ${id} from table \`residentdata\`.`);
      return true;
    } else {
      const errText = await response.text();
      console.error(`[Supabase Resident Delete Error] Status ${response.status}:`, errText);
    }
  } catch (err) {
    console.warn('[Supabase Resident Delete Warning]', err);
  }
  return false;
}

/**
 * Fetch all admins from Supabase database (table: `admindirectory`)
 */
export async function fetchAdminsFromSupabase(): Promise<AdminUser[] | null> {
  const config = getSupabaseConfig();
  if (!config.url || !config.anonKey) return null;

  try {
    const response = await fetch(`${config.url}/rest/v1/admindirectory?select=*`, {
      headers: {
        'apikey': config.anonKey,
        'Authorization': `Bearer ${config.anonKey}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      return data.map((item: any) => ({
        id: item.id,
        email: item.user_id,
        passwordHash: item.cached_password,
        name: item.name,
        phone: item.phone || undefined,
        adminType: item.admin_type,
        createdAt: item.created_at,
        updatedAt: item.updated_at || undefined,
        createdBy: item.created_by,
        updatedBy: item.updated_by || undefined,
      }));
    }
  } catch (err) {
    console.warn('[Supabase Admins Fetch Warning]', err);
  }
  return null;
}

/**
 * Sync Admin (create or update) to Supabase database (table: `admindirectory`)
 */
export async function syncAdminToSupabase(admin: AdminUser): Promise<boolean | string> {
  const config = getSupabaseConfig();
  if (!config.url || !config.anonKey) return false;

  try {
    const payload = {
      id: admin.id,
      name: admin.name,
      phone: admin.phone || null,
      user_id: admin.email,
      cached_password: admin.passwordHash,
      admin_type: admin.adminType,
      created_at: admin.createdAt,
      updated_at: admin.updatedAt || null,
      created_by: admin.createdBy || 'System Seeding',
      updated_by: admin.updatedBy || null,
    };

    const response = await fetch(`${config.url}/rest/v1/admindirectory`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': config.anonKey,
        'Authorization': `Bearer ${config.anonKey}`,
        'Prefer': 'resolution=merge-duplicates',
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      console.log(`[Supabase Admin Sync Success] Saved admin ${admin.name} to table \`admindirectory\`.`);
      return true;
    } else {
      const errText = await response.text();
      if (errText.includes('duplicate key') || errText.includes('violates unique constraint')) {
        return 'duplicate';
      }
      console.error(`[Supabase Admin Sync Error] Status ${response.status}:`, errText);
    }
  } catch (err) {
    console.warn('[Supabase Admin Sync Warning]', err);
  }
  return false;
}

/**
 * Delete Admin from Supabase database (table: `admindirectory`)
 */
export async function deleteAdminFromSupabase(id: string): Promise<boolean> {
  const config = getSupabaseConfig();
  if (!config.url || !config.anonKey) return false;

  try {
    const response = await fetch(`${config.url}/rest/v1/admindirectory?id=eq.${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: {
        'apikey': config.anonKey,
        'Authorization': `Bearer ${config.anonKey}`,
      },
    });
    if (response.ok) {
      console.log(`[Supabase Admin Delete Success] Removed admin ${id} from table \`admindirectory\`.`);
      return true;
    }
  } catch (err) {
    console.warn('[Supabase Admin Delete Warning]', err);
  }
  return false;
}

/**
 * Fetch all critical contacts from Supabase database (table: `critical_contact_directory`)
 */
export async function fetchContactsFromSupabase(): Promise<EmergencyContact[] | null> {
  const config = getSupabaseConfig();
  if (!config.url || !config.anonKey) return null;

  try {
    const response = await fetch(`${config.url}/rest/v1/critical_contact_directory?select=*&order=created_at.asc`, {
      headers: {
        'apikey': config.anonKey,
        'Authorization': `Bearer ${config.anonKey}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      return data.map((item: any) => ({
        id: item.id,
        name: item.personname,
        phone: item.mobilenumber,
        category: item.category,
        categoryInfo: item.category_info,
        workType: item.work_type,
        createdAt: item.created_at,
        updatedAt: item.updated_at || undefined,
        createdBy: item.created_by || undefined,
        updatedBy: item.updated_by || undefined,
      }));
    }
  } catch (err) {
    console.warn('[Supabase Contacts Fetch Warning]', err);
  }
  return null;
}

/**
 * Sync Contact (create or update) to Supabase database (table: `critical_contact_directory`)
 */
export async function syncContactToSupabase(contact: EmergencyContact): Promise<boolean> {
  const config = getSupabaseConfig();
  if (!config.url || !config.anonKey) return false;

  try {
    const payload = {
      id: contact.id,
      personname: contact.name,
      mobilenumber: contact.phone,
      category: contact.category,
      category_info: contact.categoryInfo,
      work_type: contact.workType,
      created_at: contact.createdAt,
      updated_at: contact.updatedAt || null,
      created_by: contact.createdBy || 'System',
      updated_by: contact.updatedBy || null,
    };

    const response = await fetch(`${config.url}/rest/v1/critical_contact_directory`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': config.anonKey,
        'Authorization': `Bearer ${config.anonKey}`,
        'Prefer': 'resolution=merge-duplicates',
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      console.log(`[Supabase Contact Sync Success] Saved contact ${contact.name} to table \`critical_contact_directory\`.`);
      return true;
    } else {
      const errText = await response.text();
      console.error(`[Supabase Contact Sync Error] Status ${response.status}:`, errText);
    }
  } catch (err) {
    console.warn('[Supabase Contact Sync Warning]', err);
  }
  return false;
}

/**
 * Delete Contact from Supabase database (table: `critical_contact_directory`)
 */
export async function deleteContactFromSupabase(id: string): Promise<boolean> {
  const config = getSupabaseConfig();
  if (!config.url || !config.anonKey) return false;

  try {
    const response = await fetch(`${config.url}/rest/v1/critical_contact_directory?id=eq.${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: {
        'apikey': config.anonKey,
        'Authorization': `Bearer ${config.anonKey}`,
      },
    });
    if (response.ok) {
      console.log(`[Supabase Contact Delete Success] Removed contact ${id} from table \`critical_contact_directory\`.`);
      return true;
    }
  } catch (err) {
    console.warn('[Supabase Contact Delete Warning]', err);
  }
  return false;
}

/**
 * Fetch all amenity bookings from Supabase database (table: `amenity_booking`)
 */
export async function fetchBookingsFromSupabase(): Promise<AmenityBooking[] | null> {
  const config = getSupabaseConfig();
  if (!config.url || !config.anonKey) return null;

  try {
    const response = await fetch(`${config.url}/rest/v1/amenity_booking?select=*&order=inserted_at.desc`, {
      headers: {
        'apikey': config.anonKey,
        'Authorization': `Bearer ${config.anonKey}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      return data.map((item: any) => ({
        id: item.id,
        facilityType: item.facility_type,
        amenityName: item.facility_type,
        bookingDate: item.booking_date,
        startTime: item.start_time,
        endTime: item.end_time,
        purpose: item.purpose || undefined,
        flatNumber: item.flat_number,
        personName: item.person_name,
        mobileNumber: item.mobile_number,
        insertedAt: item.inserted_at,
        hasCompleted: item.has_completed || 'No',
        cancelledAt: item.cancelled_at || undefined,
        cancellationReason: item.cancellation_reason || undefined,
        modifiedAt: item.modified_at || undefined,
        status: item.cancelled_at ? 'Cancelled' : 'Confirmed',
      }));
    }
  } catch (err) {
    console.warn('[Supabase Bookings Fetch Warning]', err);
  }
  return null;
}

/**
 * Sync Amenity Booking (create or update) to Supabase database (table: `amenity_booking`)
 */
export async function syncBookingToSupabase(booking: AmenityBooking): Promise<boolean> {
  const config = getSupabaseConfig();
  if (!config.url || !config.anonKey) return false;

  try {
    const payload = {
      id: booking.id,
      facility_type: booking.facilityType || booking.amenityName,
      booking_date: booking.bookingDate,
      start_time: booking.startTime,
      end_time: booking.endTime,
      purpose: booking.purpose || null,
      flat_number: booking.flatNumber,
      person_name: booking.personName,
      mobile_number: booking.mobileNumber,
      inserted_at: booking.insertedAt || new Date().toISOString(),
      has_completed: booking.hasCompleted || 'No',
      cancelled_at: booking.cancelledAt || null,
      cancellation_reason: booking.cancellationReason || null,
      modified_at: booking.modifiedAt || null,
    };

    const response = await fetch(`${config.url}/rest/v1/amenity_booking`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': config.anonKey,
        'Authorization': `Bearer ${config.anonKey}`,
        'Prefer': 'resolution=merge-duplicates',
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      console.log(`[Supabase Booking Sync Success] Saved amenity booking ${booking.id} to table \`amenity_booking\`.`);
      return true;
    } else {
      const errText = await response.text();
      console.error(`[Supabase Booking Sync Error] Status ${response.status}:`, errText);
    }
  } catch (err) {
    console.warn('[Supabase Booking Sync Warning]', err);
  }
  return false;
}

/**
 * Delete Amenity Booking from Supabase database (table: `amenity_booking`)
 */
export async function deleteBookingFromSupabase(id: string): Promise<boolean> {
  const config = getSupabaseConfig();
  if (!config.url || !config.anonKey) return false;

  try {
    const response = await fetch(`${config.url}/rest/v1/amenity_booking?id=eq.${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: {
        'apikey': config.anonKey,
        'Authorization': `Bearer ${config.anonKey}`,
      },
    });
    if (response.ok) {
      console.log(`[Supabase Booking Delete Success] Removed booking ${id} from table \`amenity_booking\`.`);
      return true;
    }
  } catch (err) {
    console.warn('[Supabase Booking Delete Warning]', err);
  }
  return false;
}

