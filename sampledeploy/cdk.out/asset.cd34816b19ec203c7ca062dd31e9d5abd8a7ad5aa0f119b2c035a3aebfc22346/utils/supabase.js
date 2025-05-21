"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeSupabaseClients = initializeSupabaseClients;
const supabase_js_1 = require("@supabase/supabase-js");
const apiCredentials_1 = require("./apiCredentials");
/**
 * Initialize Supabase clients using credentials from either Secrets Manager or environment variables
 */
async function initializeSupabaseClients() {
    // Get credentials either from Secrets Manager or environment variables
    let credentials;
    try {
        // In local development, always use environment variables
        if ((0, apiCredentials_1.isLocalDevelopment)()) {
            console.log('Local development environment detected - using environment variables for credentials');
            credentials = (0, apiCredentials_1.getCredentialsFromEnv)();
        }
        // In production, use Secrets Manager if configured
        else if (process.env.APP_SECRET_ARN) {
            console.log('Using AWS Secrets Manager for credentials');
            credentials = await (0, apiCredentials_1.getAppCredentials)();
        }
        // Fallback to environment variables if Secrets Manager is not configured
        else {
            console.log('No Secrets Manager ARN found - falling back to environment variables');
            credentials = (0, apiCredentials_1.getCredentialsFromEnv)();
        }
    }
    catch (error) {
        console.error('Failed to obtain credentials:', error);
        throw new Error('Could not initialize Supabase clients: ' + (error instanceof Error ? error.message : String(error)));
    }
    // Client for user-facing operations (respects RLS)
    const userClient = (0, supabase_js_1.createClient)(credentials.SUPABASE_URL, credentials.SUPABASE_KEY, {
        auth: {
            autoRefreshToken: true,
            persistSession: false,
            detectSessionInUrl: false
        }
    });
    // Service role client for server operations (bypasses RLS)
    const serviceClient = (0, supabase_js_1.createClient)(credentials.SUPABASE_URL, credentials.SUPABASE_SERVICE_ROLE_KEY, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });
    return { userClient, serviceClient };
}
