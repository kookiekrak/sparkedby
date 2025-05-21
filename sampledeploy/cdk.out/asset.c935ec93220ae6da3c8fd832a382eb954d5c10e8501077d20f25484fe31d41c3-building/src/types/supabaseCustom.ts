import { User } from '@supabase/supabase-js';
import { Database } from "./supabase";

export type Visit = Database["public"]["Tables"]["visits"]["Row"];
export type Container = Database["public"]["Tables"]["containers"]["Row"];
export type Note = Database["public"]["Tables"]["notes"]["Row"];
export type Transcript = Database["public"]["Tables"]["transcripts"]["Row"];
export type UserProfile = Database["public"]["Tables"]["user_profiles"]["Row"];
export type LibraryTemplate = Database["public"]["Tables"]["template_library"]["Row"];

export type ContainerState = Database['public']['Enums']['container_state'];

// Extended user type that includes profile fields
export type ExtendedUser = User & UserProfile;

export interface NotePreferences {
    default_copy_mode: 'plain' | 'rich_text' | 'without_lists';
    date_format: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'D MMM YYYY' | 'MMMM DD YYYY' | 'MMM DD YYYY' | 'YYYY/MM/DD';
    primary_language: string;
    preferred_note_language: string;
    patient_instructions_language: 'en' | 'match_spoken';
    spelling: 'en-us' | 'en-gb' | 'en-au' | 'en-ca';
    patient_reference_format: string;
    clinician_reference_format: string;
    [key: string]: any;
}