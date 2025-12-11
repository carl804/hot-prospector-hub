# Vercel Environment Variables

Add these environment variables in your Vercel project settings:

## Required Variables

| Variable | Description |
|----------|-------------|
| `GHL_API_KEY` | GoHighLevel API Key for accessing contacts, opportunities, tasks, etc. |
| `GHL_LOCATION_ID` | GoHighLevel Location ID for your agency |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID from Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret from Google Cloud Console |

## Optional Variables

| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | OpenAI API Key for AI features |
| `GOOGLE_SHEET_ID` | Google Sheet ID for data storage/logging |
| `GOOGLE_SHEET_CREDENTIALS` | Google Service Account credentials (JSON string) |
| `GOOGLE_REDIRECT_URI` | OAuth redirect URI (defaults to `https://yourdomain.com/api/auth/callback`) |
| `ALLOWED_EMAIL_DOMAIN` | Email domain restriction (e.g., `hotprospector.com`) - leave empty to allow all |

## How to Add in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable with its value
4. Select the environments (Production, Preview, Development) as needed
5. Redeploy your project

## Notes

- `GOOGLE_SHEET_CREDENTIALS` should be the full JSON service account key, Base64 encoded or as a JSON string
- Never commit these values to your repository
- Use different values for Production vs Preview/Development if needed
