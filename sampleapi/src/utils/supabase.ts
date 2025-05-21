import { createClient } from "@supabase/supabase-js";
import { Database } from "../types/supabase";
import { 
  AppCredentials, 
  isLocalDevelopment, 
  getAppCredentials, 
  getCredentialsFromEnv 
} from "./apiCredentials";

export interface SupabaseClients {
  userClient: ReturnType<typeof createClient<Database>>;
  serviceClient: ReturnType<typeof createClient<Database>>;
}

/**
 * Initialize Supabase clients using credentials from either Secrets Manager or environment variables
 */
export async function initializeSupabaseClients(jwt: string | null): Promise<SupabaseClients> {
  // Get credentials either from Secrets Manager or environment variables
  let credentials: AppCredentials;
  
  try {
    // In local development, always use environment variables
    if (isLocalDevelopment()) {
      console.log('Local development environment detected - using environment variables for credentials');
      credentials = getCredentialsFromEnv();
    } 
    // In production, use Secrets Manager if configured
    else if (process.env.APP_SECRET_ARN) {
      console.log('Using AWS Secrets Manager for credentials');
      credentials = await getAppCredentials();
    } 
    // Fallback to environment variables if Secrets Manager is not configured
    else {
      console.log('No Secrets Manager ARN found - falling back to environment variables');
      credentials = getCredentialsFromEnv();
    }
  } catch (error) {
    console.error('Failed to obtain credentials:', error);
    throw new Error('Could not initialize Supabase clients: ' + (error instanceof Error ? error.message : String(error)));
  }

  // Client for user-facing operations (respects RLS)
  const userClient = createClient<Database>(
    credentials.SUPABASE_URL,
    credentials.SUPABASE_KEY,
    {
      global: {
        headers: {
          // This ensures the user’s token is sent on every request
          Authorization: `Bearer ${jwt}`
        },
      },
      auth: {
        // On the server, we don't want auto-refresh or to persist sessions in cookies/localstorage
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    }
  );

  // Service role client for server operations (bypasses RLS)
  const serviceClient = createClient<Database>(
    credentials.SUPABASE_URL,
    credentials.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );

  return { userClient, serviceClient };
}
