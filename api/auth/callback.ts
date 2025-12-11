// Google OAuth - Callback handler with domain restriction
import type { VercelRequest, VercelResponse } from '@vercel/node';

interface GoogleTokenResponse {
  access_token: string;
  id_token: string;
  token_type: string;
}

interface GoogleUserInfo {
  email: string;
  name: string;
  picture: string;
  hd?: string; // hosted domain for Google Workspace accounts
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code, error } = req.query;

  if (error) {
    return res.redirect(`/?error=${encodeURIComponent(error as string)}`);
  }

  if (!code) {
    return res.redirect('/?error=no_code');
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || `https://${req.headers.host}/api/auth/callback`;
  const allowedDomain = process.env.ALLOWED_EMAIL_DOMAIN || '';

  if (!clientId || !clientSecret) {
    return res.redirect('/?error=oauth_not_configured');
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
      const errorData = await tokenResponse.text();
      console.error('Token exchange failed:', errorData);
      return res.redirect('/?error=token_exchange_failed');
    }

    const tokens: GoogleTokenResponse = await tokenResponse.json();

    // Get user info
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!userResponse.ok) {
      return res.redirect('/?error=user_info_failed');
    }

    const user: GoogleUserInfo = await userResponse.json();

    // Check domain restriction
    if (allowedDomain) {
      const emailDomain = user.email.split('@')[1];
      if (emailDomain !== allowedDomain) {
        console.log(`Access denied for ${user.email} - domain ${emailDomain} not allowed`);
        return res.redirect(`/?error=unauthorized_domain&domain=${emailDomain}`);
      }
    }

    // Create a simple session token (in production, use proper JWT signing)
    const sessionData = {
      email: user.email,
      name: user.name,
      picture: user.picture,
      exp: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    };

    const sessionToken = Buffer.from(JSON.stringify(sessionData)).toString('base64');

    // Set cookie and redirect
    res.setHeader('Set-Cookie', [
      `auth_token=${sessionToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`,
      `user_email=${user.email}; Path=/; Max-Age=86400`,
      `user_name=${encodeURIComponent(user.name)}; Path=/; Max-Age=86400`,
    ]);

    return res.redirect('/');
  } catch (error) {
    console.error('OAuth callback error:', error);
    return res.redirect('/?error=auth_failed');
  }
}
