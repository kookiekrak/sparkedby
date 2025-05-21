/**
 * Environment variable validation utility
 * 
 * This utility is used to check and validate that all required environment variables
 * are present at application startup.
 */

// List of required environment variables for the application
const REQUIRED_ENV_VARS = [
  'AWS_REGION',
  'WHISPER_QUEUE_URL'
];

// List of environment variables required for local development
const LOCAL_DEV_ENV_VARS = [
  'AWS_ENDPOINT_URL',
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'S3_BUCKET_NAME'
];

/**
 * Validates that all required environment variables are set
 * @returns {boolean} True if all required variables are set, false otherwise
 */
export function validateEnvVars(): boolean {
  const isLocalDev = process.env.NODE_ENV === 'development' || process.env.IS_LOCAL === 'true';
  let isValid = true;
  const missingVars: string[] = [];

  // Check required environment variables
  REQUIRED_ENV_VARS.forEach(envVar => {
    if (!process.env[envVar]) {
      isValid = false;
      missingVars.push(envVar);
    }
  });

  // Check local development variables if in development mode
  if (isLocalDev) {
    LOCAL_DEV_ENV_VARS.forEach(envVar => {
      if (!process.env[envVar]) {
        console.warn(`[ENV] Local development environment variable ${envVar} is not set`);
      }
    });
  }

  // Log validation results
  if (missingVars.length > 0) {
    console.error(`[ENV] Missing required environment variables: ${missingVars.join(', ')}`);
  } else {
    console.log('[ENV] All required environment variables are set');
  }

  // Log current environment and application mode
  console.log(`[ENV] Running in ${process.env.NODE_ENV || 'undefined'} mode`);
  console.log(`[ENV] Local development mode: ${isLocalDev}`);

  return isValid;
}

/**
 * Logs all environment variables (redacting sensitive information)
 */
export function logEnvVars(): void {
  console.log('[ENV] Environment Variables:');
  const envVars = { ...process.env };
  
  // Redact sensitive information
  const sensitiveKeys = ['KEY', 'SECRET', 'PASSWORD', 'TOKEN'];
  Object.keys(envVars).forEach(key => {
    if (sensitiveKeys.some(sensitiveKey => key.includes(sensitiveKey))) {
      envVars[key] = '[REDACTED]';
    }
  });
  
  console.log(envVars);
} 