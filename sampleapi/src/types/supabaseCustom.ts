import { User } from '@supabase/supabase-js';
import { Database } from "./supabase";

export type Visit = Database["public"]["Tables"]["visits"]["Row"];
export type Container = Database["public"]["Tables"]["containers"]["Row"];
export type Note = Database["public"]["Tables"]["notes"]["Row"];
export type NoteType = Database["public"]["Enums"]["note_type"];
export type Transcript = Database["public"]["Tables"]["transcripts"]["Row"];
export type UserProfile = Database["public"]["Tables"]["user_profiles"]["Row"];
export type LibraryTemplate = Database["public"]["Tables"]["template_library"]["Row"];

export type ContainerState = Database['public']['Enums']['container_state'];

export type Patient = Database['public']['Tables']['patient_profiles']['Row'];

// Extended user type that includes profile fields
export type ExtendedUser = User & UserProfile;

export type NotePreferencesType = {
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

export type CopyMode = NotePreferencesType['default_copy_mode'];
export type DateFormat = NotePreferencesType['date_format'];
export type Spelling = NotePreferencesType['spelling'];

export const defaultNotePreferences: NotePreferencesType = {
    default_copy_mode: 'plain',
    date_format: 'MM/DD/YYYY',
    primary_language: 'auto',
    preferred_note_language: 'en',
    patient_instructions_language: 'en',
    spelling: 'en-us',
    patient_reference_format: '',
    clinician_reference_format: '',
  } as const;

export const copyModeOptions = [
  { value: 'plain' as CopyMode, label: 'Plain Text' },
  { value: 'rich_text' as CopyMode, label: 'Formatted Text' },
  { value: 'without_lists' as CopyMode, label: 'Formatted Text (Without Lists)' },
] as const;

export const languageOptions = [
  { value: 'auto', label: 'Multi-lingual' },
  { value: 'en', label: 'English' },
  { value: 'zh', label: 'Mandarin' },
  { value: 'zh-HK', label: 'Cantonese' },
  { value: 'cs', label: 'Czech' },
  { value: 'da', label: 'Danish' },
  { value: 'nl', label: 'Dutch' },
  { value: 'nl-BE', label: 'Flemish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'el', label: 'Greek' },
  { value: 'hi', label: 'Hindi' },
  { value: 'id', label: 'Indonesian' },
  { value: 'it', label: 'Italian' },
  { value: 'ja', label: 'Japanese' },
  { value: 'ko', label: 'Korean' },
  { value: 'ms', label: 'Malay' },
  { value: 'no', label: 'Norwegian' },
  { value: 'pl', label: 'Polish' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'ru', label: 'Russian' },
  { value: 'es', label: 'Spanish' },
  { value: 'sv', label: 'Swedish' },
  { value: 'th', label: 'Thai' },
  { value: 'tr', label: 'Turkish' },
  { value: 'uk', label: 'Ukrainian' },
  { value: 'vi', label: 'Vietnamese' },
] as const;

export type LanguageCode = typeof languageOptions[number]['value'];

export const dateFormatOptions = [
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
  { value: 'D MMM YYYY', label: 'D MMM YYYY' },
  { value: 'MMMM DD YYYY', label: 'MMMM DD YYYY' },
  { value: 'MMM DD YYYY', label: 'MMM DD YYYY' },
  { value: 'YYYY/MM/DD', label: 'YYYY/MM/DD' },
] as const;

export const patientInstructionsLanguageOptions = [
    { value: 'match_spoken', label: 'Match spoken language' },
    { value: 'en', label: 'English' },
    { value: 'zh', label: 'Mandarin' },
    { value: 'zh-HK', label: 'Cantonese' },
    { value: 'cs', label: 'Czech' },
    { value: 'da', label: 'Danish' },
    { value: 'nl', label: 'Dutch' },
    { value: 'nl-BE', label: 'Flemish' },
    { value: 'fr', label: 'French' },
    { value: 'de', label: 'German' },
    { value: 'el', label: 'Greek' },
    { value: 'hi', label: 'Hindi' },
    { value: 'id', label: 'Indonesian' },
    { value: 'it', label: 'Italian' },
    { value: 'ja', label: 'Japanese' },
    { value: 'ko', label: 'Korean' },
    { value: 'ms', label: 'Malay' },
    { value: 'no', label: 'Norwegian' },
    { value: 'pl', label: 'Polish' },
    { value: 'pt', label: 'Portuguese' },
    { value: 'ru', label: 'Russian' },
    { value: 'es', label: 'Spanish' },
    { value: 'sv', label: 'Swedish' },
    { value: 'th', label: 'Thai' },
    { value: 'tr', label: 'Turkish' },
    { value: 'uk', label: 'Ukrainian' },
    { value: 'vi', label: 'Vietnamese' },
  ] as const;

export const spellingOptions = [
  { value: 'en-us', label: 'English (United States)' },
  { value: 'en-gb', label: 'English (United Kingdom)' },
  { value: 'en-au', label: 'English (Australia)' },
  { value: 'en-ca', label: 'English (Canada)' },
] as const;