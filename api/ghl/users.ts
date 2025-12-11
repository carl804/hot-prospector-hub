// GHL Users API - Get users from GoHighLevel
import type { VercelRequest, VercelResponse } from '@vercel/node';

const GHL_API_BASE = 'https://services.leadconnectorhq.com';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GHL_API_KEY;
  const locationId = process.env.GHL_LOCATION_ID;

  if (!apiKey || !locationId) {
    return res.status(500).json({ error: 'GHL not configured' });
  }

  try {
    const response = await fetch(
      `${GHL_API_BASE}/users/?locationId=${locationId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Version': '2021-07-28',
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('GHL Users API error:', errorText);
      return res.status(response.status).json({ error: 'Failed to fetch users from GHL' });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('GHL Users API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
