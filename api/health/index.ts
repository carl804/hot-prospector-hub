// Health Check API - validates all environment variables
import type { VercelRequest, VercelResponse } from '@vercel/node';

interface EnvStatus {
  configured: boolean;
  required: boolean;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const envVars: Record<string, EnvStatus> = {
    GHL_API_KEY: {
      configured: !!process.env.GHL_API_KEY,
      required: true,
    },
    GHL_LOCATION_ID: {
      configured: !!process.env.GHL_LOCATION_ID,
      required: true,
    },
    OPENAI_API_KEY: {
      configured: !!process.env.OPENAI_API_KEY,
      required: false,
    },
    GOOGLE_SHEET_ID: {
      configured: !!process.env.GOOGLE_SHEET_ID,
      required: false,
    },
    GOOGLE_SHEET_CREDENTIALS: {
      configured: !!process.env.GOOGLE_SHEET_CREDENTIALS,
      required: false,
    },
  };

  const requiredMissing = Object.entries(envVars)
    .filter(([_, status]) => status.required && !status.configured)
    .map(([name]) => name);

  const optionalMissing = Object.entries(envVars)
    .filter(([_, status]) => !status.required && !status.configured)
    .map(([name]) => name);

  const allRequiredConfigured = requiredMissing.length === 0;

  return res.status(allRequiredConfigured ? 200 : 503).json({
    status: allRequiredConfigured ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    environment: {
      variables: envVars,
      requiredMissing,
      optionalMissing,
    },
    summary: {
      total: Object.keys(envVars).length,
      configured: Object.values(envVars).filter(v => v.configured).length,
      requiredConfigured: Object.values(envVars).filter(v => v.required && v.configured).length,
      requiredTotal: Object.values(envVars).filter(v => v.required).length,
    },
  });
}
