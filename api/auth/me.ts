// Get current user session
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Cookie');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const cookies = req.headers.cookie || '';
  const authToken = cookies.split(';').find(c => c.trim().startsWith('auth_token='));

  if (!authToken) {
    return res.status(401).json({ authenticated: false, user: null });
  }

  try {
    const token = authToken.split('=')[1];
    const sessionData = JSON.parse(Buffer.from(token, 'base64').toString());

    // Check expiration
    if (sessionData.exp < Date.now()) {
      return res.status(401).json({ authenticated: false, user: null, error: 'Session expired' });
    }

    return res.status(200).json({
      authenticated: true,
      user: {
        email: sessionData.email,
        name: sessionData.name,
        picture: sessionData.picture,
      },
    });
  } catch (error) {
    return res.status(401).json({ authenticated: false, user: null, error: 'Invalid session' });
  }
}
