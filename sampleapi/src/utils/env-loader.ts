/**
 * Environment variables loader
 * This module should be imported as the first thing in the application entry point
 */
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Immediate invocation to load env vars as soon as this module is imported
(() => {
  console.log('[ENV-LOADER] Loading environment variables...');
  
  // Try to load from the root directory first
  const rootEnvPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(rootEnvPath)) {
    console.log(`[ENV-LOADER] Loading from ${rootEnvPath}`);
    dotenv.config({ path: rootEnvPath });
  } else {
    // Try parent directory if running from a subdirectory
    const parentEnvPath = path.resolve(process.cwd(), '../.env');
    if (fs.existsSync(parentEnvPath)) {
      console.log(`[ENV-LOADER] Loading from ${parentEnvPath}`);
      dotenv.config({ path: parentEnvPath });
    } else {
      console.warn('[ENV-LOADER] No .env file found in common locations, trying default dotenv behavior');
      dotenv.config();
    }
  }
  
  // Log success or missing env vars
  const requiredVars = ['AWS_REGION', 'AWS_ENDPOINT_URL', 'WHISPER_QUEUE_URL', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length === 0) {
    console.log('[ENV-LOADER] All required environment variables loaded successfully');
  } else {
    console.warn(`[ENV-LOADER] Missing environment variables: ${missingVars.join(', ')}`);
  }
  
  console.log('[ENV-LOADER] Environment loading complete');
})();

// Export the environment configuration for reference elsewhere
export const envConfig = {
  isLoaded: true,
  loadTime: new Date().toISOString(),
  nodeEnv: process.env.NODE_ENV || 'development',
  isLocalDevelopment: (process.env.NODE_ENV || 'development') === 'development' || process.env.IS_LOCAL === 'true'
}; 