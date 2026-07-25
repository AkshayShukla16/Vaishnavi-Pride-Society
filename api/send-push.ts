import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Allow CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { title, message, url } = req.body || {};

  if (!title || !message) {
    return res.status(400).json({ error: 'Title and message are required' });
  }

  const APP_ID = process.env.VITE_ONESIGNAL_APP_ID || 'd97c4252-2c37-42c0-b864-51b88bab013d';
  const REST_KEY = process.env.VITE_ONESIGNAL_REST_API_KEY || 'os_v2_app_3f6eeurmg5bmbodekg4ixkybhwov5yurdtxu3ruyo7xyk2zsydsxo3zfvzjmbyvpdkfrte4znr6e5vb5csq24nvwmzouw4niqr6xq2a';

  const targetUrl = url || 'https://de-society.vercel.app';
  const originUrl = 'https://de-society.vercel.app';

  try {
    const response = await fetch('https://api.onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Key ${REST_KEY}`,
      },
      body: JSON.stringify({
        app_id: APP_ID,
        included_segments: ['All'],
        headings: { en: title },
        contents: { en: message },
        subtitle: { en: 'Vaishnavi Pride Society' },
        url: targetUrl,
        priority: 10,
        android_visibility: 1,
        chrome_web_icon: `${originUrl}/favicon.svg`,
        chrome_web_badge: `${originUrl}/favicon.svg`,
        firefox_icon: `${originUrl}/favicon.svg`,
        web_buttons: [
          { id: 'open_app', text: '🔔 Open App', url: targetUrl }
        ]
      }),
    });

    const data = await response.json();
    return res.status(200).json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Internal server error' });
  }
}
