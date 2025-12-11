// Google OAuth - Callback handler with GHL user verification
import type { VercelRequest, VercelResponse } from '@vercel/node';

const GHL_API_BASE = 'https://services.leadconnectorhq.com';

interface GoogleTokenResponse {
  access_token: string;
  id_token: string;
  token_type: string;
}

interface GoogleUserInfo {
  email: string;
  name: string;
  picture: string;
  hd?: string;
}

interface GHLUser {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions?: Record<string, any>;
}

async function verifyGHLUser(email: string): Promise<GHLUser | null> {
  const apiKey = process.env.GHL_API_KEY;
  const locationId = process.env.GHL_LOCATION_ID;

  if (!apiKey || !locationId) {
    console.error('GHL not configured for user verification');
    return null;
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
      return null;
    }

    const data = await response.json();
    const users = data.users || [];
    
    return users.find(
      (user: GHLUser) => user.email?.toLowerCase() === email.toLowerCase()
    ) || null;
  } catch (error) {
    console.error('GHL verification error:', error);
    return null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code, error } = req.query;

  if (error) {
    return res.redirect(`/login?error=${encodeURIComponent(error as string)}`);
  }

  if (!code) {
    return res.redirect('/login?error=no_code');
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || `https://${req.headers.host}/api/auth/callback`;

  if (!clientId || !clientSecret) {
    return res.redirect('/login?error=oauth_not_configured');
  }

  try {
    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: code as string,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      console.error('Token exchange failed:', await tokenResponse.text());
      return res.redirect('/login?error=token_exchange_failed');
    }

    const tokens: GoogleTokenResponse = await tokenResponse.json();

    // Get Google user info
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!userResponse.ok) {
      return res.redirect('/login?error=user_info_failed');
    }

    const googleUser: GoogleUserInfo = await userResponse.json();

    // Verify user exists in GHL
    const ghlUser = await verifyGHLUser(googleUser.email);

    if (!ghlUser) {
      console.log(`Access denied for ${googleUser.email} - not found in GHL`);
      return res.redirect('/login?error=user_not_in_ghl');
    }

    // Create session with GHL user data
    const sessionData = {
      email: googleUser.email,
      name: ghlUser.name || googleUser.name,
      picture: googleUser.picture,
      ghlUserId: ghlUser.id,
      ghlRole: ghlUser.role,
      exp: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    };

    const sessionToken = Buffer.from(JSON.stringify(sessionData)).toString('base64');

    res.setHeader('Set-Cookie', [
      `auth_token=${sessionToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`,
      `user_email=${googleUser.email}; Path=/; Max-Age=86400`,
      `user_name=${encodeURIComponent(ghlUser.name || googleUser.name)}; Path=/; Max-Age=86400`,
    ]);

    return res.redirect('/');
  } catch (error) {
    console.error('OAuth callback error:', error);
    return res.redirect('/login?error=auth_failed');
  }
}
