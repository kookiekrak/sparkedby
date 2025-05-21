import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in environment variables');
  process.exit(1);
}

export const supabaseClient = createClient(supabaseUrl, supabaseKey);

export interface WaitlistEntry {
  id?: string;
  email: string;
  created_at?: string;
}

/**
 * Adds an email to the waitlist in Supabase
 */
export const addToWaitlist = async (email: string): Promise<{ success: boolean; error?: any }> => {
  try {
    const { error } = await supabaseClient
      .from('waitlist')
      .insert([{ email, created_at: new Date().toISOString() }]);

    if (error) {
      console.error('[Waitlist] Error adding email to waitlist:', error);
      return { success: false, error };
    }

    return { success: true };
  } catch (error) {
    console.error('[Waitlist] Unexpected error adding email to waitlist:', error);
    return { success: false, error };
  }
};
