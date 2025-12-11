// Google OAuth - Logout handler
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Clear auth cookies
  res.setHeader('Set-Cookie', [
    'auth_token=; Path=/; HttpOnly; Max-Age=0',
    'user_email=; Path=/; Max-Age=0',
    'user_name=; Path=/; Max-Age=0',
  ]);

  return res.redirect('/');
}
