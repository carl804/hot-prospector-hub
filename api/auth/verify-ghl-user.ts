// Verify if email exists in GHL users
import type { VercelRequest, VercelResponse } from '@vercel/node';

const GHL_API_BASE = 'https://services.leadconnectorhq.com';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required', verified: false });
  }

  const apiKey = process.env.GHL_API_KEY;
  const locationId = process.env.GHL_LOCATION_ID;

  if (!apiKey || !locationId) {
    return res.status(500).json({ error: 'GHL not configured', verified: false });
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
      console.error('GHL Users API error:', await response.text());
      return res.status(500).json({ error: 'Failed to verify user', verified: false });
    }

    const data = await response.json();
    const users = data.users || [];
    
    // Find user by email (case-insensitive)
    const matchedUser = users.find(
      (user: any) => user.email?.toLowerCase() === email.toLowerCase()
    );

    if (matchedUser) {
      return res.status(200).json({
        verified: true,
        user: {
          id: matchedUser.id,
          name: matchedUser.name,
          email: matchedUser.email,
          role: matchedUser.role,
          permissions: matchedUser.permissions,
        },
      });
    }

    return res.status(403).json({
      verified: false,
      error: 'User not found in GHL. Please contact your administrator.',
    });
  } catch (error) {
    console.error('GHL User verification error:', error);
    return res.status(500).json({ error: 'Internal server error', verified: false });
  }
}
