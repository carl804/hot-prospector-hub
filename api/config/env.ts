// Environment Variables Configuration for Vercel Deployment
// All these variables should be set in Vercel Environment Variables

export const ENV = {
  // GoHighLevel API Configuration
  GHL_API_KEY: process.env.GHL_API_KEY || '',
  GHL_LOCATION_ID: process.env.GHL_LOCATION_ID || '',
  
  // OpenAI Configuration
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  
  // Google Sheets Configuration
  GOOGLE_SHEET_ID: process.env.GOOGLE_SHEET_ID || '',
  GOOGLE_SHEET_CREDENTIALS: process.env.GOOGLE_SHEET_CREDENTIALS || '',
} as const;

// Validation helper
export function validateEnv(required: (keyof typeof ENV)[]): { valid: boolean; missing: string[] } {
  const missing = required.filter(key => !ENV[key]);
  return {
    valid: missing.length === 0,
    missing,
  };
}

// Check if GHL is configured
export function isGHLConfigured(): boolean {
  return !!ENV.GHL_API_KEY && !!ENV.GHL_LOCATION_ID;
}

// Check if OpenAI is configured
export function isOpenAIConfigured(): boolean {
  return !!ENV.OPENAI_API_KEY;
}

// Check if Google Sheets is configured
export function isGoogleSheetsConfigured(): boolean {
  return !!ENV.GOOGLE_SHEET_ID && !!ENV.GOOGLE_SHEET_CREDENTIALS;
}
