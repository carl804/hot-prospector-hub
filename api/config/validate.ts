// Environment Variable Validation using Zod
import { z } from 'zod';

// Schema for required GHL environment variables
const ghlEnvSchema = z.object({
  GHL_API_KEY: z.string().min(1, 'GHL_API_KEY is required'),
  GHL_LOCATION_ID: z.string().min(1, 'GHL_LOCATION_ID is required'),
});

// Schema for optional environment variables
const optionalEnvSchema = z.object({
  OPENAI_API_KEY: z.string().optional(),
  GOOGLE_SHEET_ID: z.string().optional(),
  GOOGLE_SHEET_CREDENTIALS: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_REDIRECT_URI: z.string().optional(),
  ALLOWED_EMAIL_DOMAIN: z.string().optional(),
  ADMIN_EMAILS: z.string().optional(),
  VITE_API_BASE_URL: z.string().optional(),
});

// Combined schema
export const envSchema = ghlEnvSchema.merge(optionalEnvSchema);

export type EnvConfig = z.infer<typeof envSchema>;

// Validation result type
interface ValidationResult {
  success: boolean;
  data?: EnvConfig;
  errors?: string[];
}

// Validate environment variables on startup
export function validateEnv(): ValidationResult {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const errors = result.error.errors.map(err =>
      `${err.path.join('.')}: ${err.message}`
    );
    return { success: false, errors };
  }

  return { success: true, data: result.data };
}

// Get validated environment (throws if invalid)
export function getValidatedEnv(): EnvConfig {
  const result = validateEnv();

  if (!result.success) {
    throw new Error(
      `Environment validation failed:\n${result.errors?.join('\n')}`
    );
  }

  return result.data!;
}

// Check if GHL is properly configured
export function validateGHLConfig(): { valid: boolean; missing: string[] } {
  const result = ghlEnvSchema.safeParse(process.env);

  if (!result.success) {
    const missing = result.error.errors.map(err => err.path[0] as string);
    return { valid: false, missing };
  }

  return { valid: true, missing: [] };
}

// Check if Google OAuth is configured
export function validateGoogleOAuth(): boolean {
  return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

// Check if Google Sheets is configured
export function validateGoogleSheets(): boolean {
  return !!(process.env.GOOGLE_SHEET_ID && process.env.GOOGLE_SHEET_CREDENTIALS);
}
