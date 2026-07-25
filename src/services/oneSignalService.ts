/**
 * OneSignal Push Notification Service
 * Sends real background push notifications to ALL subscribed residents
 * via OneSignal's REST API — works even when the browser/tab is closed.
 */

import { Ticket, Announcement, AmenityBooking } from '../types/society';
import { notificationService } from './notificationService';

const DEFAULT_ONESIGNAL_APP_ID = 'd97c4252-2c37-42c0-b864-51b88bab013d';
const DEFAULT_ONESIGNAL_REST_KEY = 'os_v2_app_3f6eeurmg5bmbodekg4ixkybhwov5yurdtxu3ruyo7xyk2zsydsxo3zfvzjmbyvpdkfrte4znr6e5vb5csq24nvwmzouw4niqr6xq2a';

const APP_ID      = (import.meta.env.VITE_ONESIGNAL_APP_ID as string) || DEFAULT_ONESIGNAL_APP_ID;
const REST_API_KEY = (import.meta.env.VITE_ONESIGNAL_REST_API_KEY as string) || DEFAULT_ONESIGNAL_REST_KEY;

export interface SOSPayload {
  title: string;
  message: string;
  type: 'FIRE' | 'POWER' | 'WATER' | 'GENERAL';
  flatNumber: string;
}

const ALERT_ICONS: Record<string, string> = {
  FIRE:    '🔥',
  POWER:   '⚡',
  WATER:   '💧',
  GENERAL: '🚨',
};

const ALERT_COLORS: Record<string, string> = {
  FIRE:    'FF3A3A',
  POWER:   'FFC107',
  WATER:   '00B4D8',
  GENERAL: 'FF6B35',
};

/**
 * Common REST API POST caller to OneSignal
 */
async function postOneSignalNotification(body: Record<string, any>): Promise<{
  success: boolean;
  recipientCount?: number;
  error?: string;
}> {
  if (!APP_ID || !REST_API_KEY) {
    console.warn('[OneSignal] Missing App ID or REST API Key');
    return { success: false, error: 'OneSignal not configured.' };
  }

  // Clean payload for API v1
  delete body.target_channel;

  const authHeader = REST_API_KEY.startsWith('os_v2_') ? `Key ${REST_API_KEY}` : `Basic ${REST_API_KEY}`;

  try {
    const response = await fetch('https://api.onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': authHeader,
        'Accept':        'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (response.ok && data.id) {
      console.log(`[OneSignal] ✅ Push Notification Dispatched! ID: ${data.id}, Recipients: ${data.recipients}`);
      return { success: true, recipientCount: data.recipients ?? 0 };
    } else {
      const errMsg = Array.isArray(data.errors) ? data.errors.join(', ') : (data.errors || data.error || `HTTP ${response.status}`);
      console.error('[OneSignal] ❌ Send failed:', errMsg);
      return { success: false, error: String(errMsg) };
    }
  } catch (err: any) {
    console.error('[OneSignal] ❌ Network error:', err);
    return { success: false, error: err?.message || 'Network error.' };
  }
}

/**
 * Sends a SOS push notification to ALL subscribed residents via OneSignal REST API.
 */
export async function sendSOSPushNotification(payload: SOSPayload): Promise<{
  success: boolean;
  recipientCount?: number;
  error?: string;
}> {
  const icon  = ALERT_ICONS[payload.type]  || '🚨';
  const color = ALERT_COLORS[payload.type] || 'FF3A3A';
  const targetUrl = typeof window !== 'undefined' ? window.location.href : 'https://de-society.vercel.app';

  // Trigger local native browser OS push notification immediately
  notificationService.sendNotification(`${icon} ${payload.title}`, payload.message);

  const body = {
    app_id:             APP_ID,
    name:               `VP SOS: ${payload.type} Alert`,
    included_segments:  ['All'],
    headings:           { en: `${icon} ${payload.title}` },
    contents:           { en: payload.message },
    subtitle:           { en: `Triggered by Flat #${payload.flatNumber} · Vaishnavi Pride` },
    url:                targetUrl,
    android_accent_color: color,
    android_visibility: 1,
    priority:           10,
    chrome_web_icon:    '/favicon.svg',
    firefox_icon:       '/favicon.svg',
    web_buttons: [
      { id: 'ack', text: '✅ View Alert', url: targetUrl },
    ],
  };

  return postOneSignalNotification(body);
}

/**
 * Sends a push notification for Ticket events (Raised, Assigned, Resolved)
 */
export async function sendTicketPushNotification(
  type: 'RAISED' | 'ASSIGNED' | 'RESOLVED',
  ticket: Ticket
): Promise<{ success: boolean; recipientCount?: number; error?: string }> {
  let heading = '';
  let contents = '';
  let color = '00B4D8';

  const flatInfo = ticket.flatNumber ? `Flat #${ticket.flatNumber}` : 'Common Area';
  const targetUrl = typeof window !== 'undefined' ? window.location.href : 'https://de-society.vercel.app';

  if (type === 'RAISED') {
    heading = `🛠️ New Ticket Raised (${flatInfo})`;
    contents = `[${ticket.category}] "${ticket.title}" (${ticket.locationTag}) - Priority: ${ticket.priority}`;
    color = 'FFC107'; // Amber
  } else if (type === 'ASSIGNED') {
    heading = `👷 Staff Assigned: Ticket #${ticket.id}`;
    contents = `Ticket "${ticket.title}" (${flatInfo}) has been assigned to ${ticket.assignedVendor || 'Maintenance Staff'}.`;
    color = '00B4D8'; // Cyan
  } else if (type === 'RESOLVED') {
    heading = `✅ Ticket Resolved: #${ticket.id}`;
    contents = `Ticket "${ticket.title}" (${flatInfo}) marked as Resolved! ${ticket.resolutionRemarks ? 'Remarks: ' + ticket.resolutionRemarks : ''}`;
    color = '28A745'; // Green
  }

  // Trigger local native browser OS push notification immediately
  notificationService.sendNotification(heading, contents);

  const body = {
    app_id: APP_ID,
    name: `VP Ticket: ${type} - ${ticket.id}`,
    included_segments: ['All'],
    headings: { en: heading },
    contents: { en: contents },
    subtitle: { en: `Vaishnavi Pride Society Maintenance` },
    url: targetUrl,
    android_accent_color: color,
    android_visibility: 1,
    priority: 10,
    chrome_web_icon: '/favicon.svg',
    firefox_icon: '/favicon.svg',
    web_buttons: [
      { id: 'view_ticket', text: '🔍 View Ticket', url: targetUrl },
    ],
  };

  return postOneSignalNotification(body);
}

/**
 * Sends a push notification for General Announcements & Notice Board posts
 */
export async function sendAnnouncementPushNotification(
  announcement: Announcement
): Promise<{ success: boolean; recipientCount?: number; error?: string }> {
  const categoryIcons: Record<string, string> = {
    EMERGENCY: '🚨',
    MAINTENANCE: '🔧',
    COMMUNITY: '🎉',
    GENERAL: '📢',
  };

  const categoryColors: Record<string, string> = {
    EMERGENCY: 'FF3A3A',
    MAINTENANCE: 'FFC107',
    COMMUNITY: '9C27B0',
    GENERAL: '00B4D8',
  };

  const icon = categoryIcons[announcement.priorityCategory] || '📢';
  const color = categoryColors[announcement.priorityCategory] || '00B4D8';
  const targetUrl = typeof window !== 'undefined' ? window.location.href : 'https://de-society.vercel.app';

  // Trigger local native browser OS push notification immediately
  notificationService.sendNotification(`${icon} ${announcement.priorityCategory}: ${announcement.title}`, announcement.content);

  const body = {
    app_id: APP_ID,
    name: `VP Notice: ${announcement.title}`,
    included_segments: ['All'],
    headings: { en: `${icon} ${announcement.priorityCategory}: ${announcement.title}` },
    contents: { en: announcement.content },
    subtitle: { en: `Posted by ${announcement.byWhom || 'Management'} · Vaishnavi Pride Notice Board` },
    url: targetUrl,
    android_accent_color: color,
    android_visibility: 1,
    priority: 10,
    chrome_web_icon: '/favicon.svg',
    firefox_icon: '/favicon.svg',
    web_buttons: [
      { id: 'read_notice', text: '📖 Read Notice', url: targetUrl },
    ],
  };

  return postOneSignalNotification(body);
}

/**
 * Sends a push notification when an Amenity Slot is reserved
 */
export async function sendAmenityPushNotification(
  booking: AmenityBooking
): Promise<{ success: boolean; recipientCount?: number; error?: string }> {
  const facility = booking.facilityType || booking.amenityName || 'Amenity';
  const targetUrl = typeof window !== 'undefined' ? window.location.href : 'https://de-society.vercel.app';

  const heading = `🎉 Amenity Reserved: ${facility}`;
  const contents = `Booked by ${booking.personName} (Flat #${booking.flatNumber}, Ph: ${booking.mobileNumber}) for ${booking.bookingDate} (${booking.startTime} - ${booking.endTime}).`;

  // Trigger local native browser OS push notification immediately
  notificationService.sendNotification(heading, contents);

  const body = {
    app_id: APP_ID,
    name: `VP Amenity Reserved: ${facility}`,
    included_segments: ['All'],
    headings: { en: heading },
    contents: { en: contents },
    subtitle: { en: `Vaishnavi Pride Amenity Booking Engine` },
    url: targetUrl,
    android_accent_color: '9C27B0',
    android_visibility: 1,
    priority: 10,
    chrome_web_icon: '/favicon.svg',
    firefox_icon: '/favicon.svg',
    web_buttons: [
      { id: 'view_amenity', text: '📅 View Booking', url: targetUrl },
    ],
  };

  return postOneSignalNotification(body);
}

/**
 * Returns how many devices are currently subscribed.
 */
export async function getSubscriberCount(): Promise<number> {
  if (!APP_ID || !REST_API_KEY) return 0;
  try {
    const response = await fetch(`https://api.onesignal.com/api/v1/apps/${APP_ID}`, {
      headers: { 'Authorization': REST_API_KEY.startsWith('os_v2_') ? `Key ${REST_API_KEY}` : `Basic ${REST_API_KEY}` },
    });
    if (response.ok) {
      const data = await response.json();
      return data.players ?? 0;
    }
  } catch { /* silent */ }
  return 0;
}
