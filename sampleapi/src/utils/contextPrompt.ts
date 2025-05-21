import { SupabaseClient } from "@supabase/supabase-js";
import { convert } from "html-to-text";
import { Patient } from "../types/supabaseCustom";

interface UserContext {
  name?: string;
  specialty?: string;
}

/**
 * Cleans HTML content and converts it to plain text
 * Handles both HTML (with tags like <p>, <br>) and plain text with newlines
 */
function cleanHtmlContent(content: string): string {
  if (!content) return '';
  
  return convert(content, {
    wordwrap: null,  // Disable wordwrapping to preserve formatting
    selectors: [
      { selector: 'p', options: { leadingLineBreaks: 1, trailingLineBreaks: 1 } },
      { selector: 'br', format: 'lineBreak' }
    ]
  }).trim();
}

export async function getContextPrompt({
  userId,
  visitId,
  serviceClient,
  templateType
}: {
  userId: string;
  visitId?: string;
  serviceClient: SupabaseClient;
  templateType?: string;
}): Promise<string> {

  let existingDetails = undefined;
  let visitPatient:Patient | undefined = undefined;
  let visitLanguage:string | undefined = undefined;
  let visitPatientLanguage:string | undefined = undefined;

  if (visitId) {
    const { data: existingNote, error: contextError } = await serviceClient
      .from('notes')
      .select('*, visits(*, patient_profiles(*))')
      .eq('visit_id', visitId)
      .eq('type', 'ai_context')
      .order('version_id', { ascending: false })
      .limit(1)
      .single();

    existingDetails = existingNote?.content ? cleanHtmlContent(existingNote.content) : undefined;
    visitPatient = existingNote?.visits?.patient_profiles;
    visitLanguage = existingNote?.visits?.audio_language;
    visitPatientLanguage = existingNote?.visits?.patient_instructions_language;
  }

  // Initialize profile variable
  let userContext = undefined;
  
  try {
    // Get user profile information
    const { data: userProfile, error: profileError } = await serviceClient
      .from('user_profiles')
      .select('name, specialty, note_preferences')
      .eq('id', userId)
      .single();

    if (!profileError) {
      userContext = userProfile;
    }
  } catch (error) {
    console.error('[Context Prompt] User profile info error:', error);
  }
  
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  let prompt = `The current date is ${currentDate}.`;

  if (userContext?.name || userContext?.specialty) {
    prompt += `The clinician's`;
    
    if (userContext.name) {
      prompt += ` name is ${userContext.name}`;
    }
    
    if (userContext.name && userContext.specialty) {
      prompt += ` and their`;
    }
    
    if (userContext.specialty) {
      prompt += ` specialty is ${userContext.specialty}. `;
    }
  }

  if (visitPatient) {
    prompt += `The patient's name is ${visitPatient.name}. `;
  }

  console.log('[Context Prompt] Template type:', templateType);
  if (templateType  === 'translated_note') {
    const language = visitPatientLanguage === 'match_spoken' ? visitLanguage : visitPatientLanguage;
    
    console.log('[Context Prompt] Language:', visitLanguage);
    console.log('[Context Prompt] User context:', userContext);
    if (language) {
      prompt += `\n ONLY OUTPUT IN THE FOLLOWING LANGUAGE CODE '${language}'. '\n`;
    }
  }

  if (existingDetails) {
    prompt += `\nEXTREMELY IMPORTANT: Existing medical context, use this information to override any conflicting information: ${existingDetails} \n`;
  }


  return prompt;
}