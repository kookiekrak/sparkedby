import { OpenAI } from 'openai';
import { SupabaseClient } from '@supabase/supabase-js';
import { getContextPrompt } from '../utils/contextPrompt';
import { AI_CONTEXT_PROMPT } from '../prompts/aiContext';
import { SOAP_NOTE_PROMPT } from '../prompts/soapNote';
import { TEMPLATE_PROMPT, TEMPLATE_PROMPT_HTML } from '../prompts/template';
import crypto from 'crypto';
import { ChatCompletion, ChatCompletionCreateParamsNonStreaming, ChatCompletionSystemMessageParam, ChatCompletionUserMessageParam } from 'openai/resources/chat/completions';
import { getOpenAIApiKey } from '../utils/apiCredentials';

type CompletionInput = Omit<ChatCompletionCreateParamsNonStreaming, 'stream'>;

function hashCompletionInput(input: CompletionInput): string {
  const inputStr = JSON.stringify(input);
  return crypto.createHash('sha256').update(inputStr).digest('hex');
}

async function getCachedCompletion(
  input: CompletionInput,
  useContext: string,
  serviceClient: SupabaseClient
): Promise<string | null> {
  const inputHash = hashCompletionInput(input);
  
  const { data, error } = await serviceClient
    .from('ai_cache')
    .select('output_text')
    .eq('input_hash', inputHash)
    .eq('use_context', useContext)
    .single();

  if (error || !data) {
    return null;
  }

  const completion = JSON.parse(data.output_text) as ChatCompletion;
  return completion.choices[0].message.content;
}

async function cacheCompletion(
  input: CompletionInput,
  useContext: string,
  completion: ChatCompletion,
  serviceClient: SupabaseClient
): Promise<void> {
  const inputHash = hashCompletionInput(input);
  
  const { error } = await serviceClient
    .from('ai_cache')
    .insert({
      input_hash: inputHash,
      input_text: JSON.stringify(input),
      output_text: JSON.stringify(completion),
      use_context: useContext,
      created_at: new Date().toISOString()
    });

  if (error) {
    console.error('Failed to cache completion:', error);
  }
}

async function getOpenAICompletion(
  input: CompletionInput,
  useContext: string,
  serviceClient: SupabaseClient
): Promise<string> {
  // Check cache first
  const cachedResult = await getCachedCompletion(input, useContext, serviceClient);
  if (cachedResult) {
    console.log(`[OpenAI] Using cached result for context: ${useContext}`);
    return cachedResult;
  }

  console.log('[OpenAI] Cache Miss, making API call');
  // If not in cache, make API call
  const apiKey = await getOpenAIApiKey();
  const openai = new OpenAI({
    apiKey,
  });

  const completion = await openai.chat.completions.create(input);
  console.log('[OpenAI] Completion:', completion);
  const outputText = completion.choices[0].message.content;

  if (!outputText) {
    throw new Error('No content returned from OpenAI');
  }

  // Cache the result
  await cacheCompletion(input, useContext, completion, serviceClient);

  return outputText;
}

export async function generateAIContext(
  visitId: string,
  transcriptFragment: string,
  serviceClient: SupabaseClient,
  userId: string
): Promise<{ newContext: string; existingContext: string | null }> {
  // Get context prompt
  const contextPrompt = await getContextPrompt({userId, serviceClient});
  
  // Get existing AI context for this visit if it exists
  let existingDetails = '';
  const { data: existingNote, error: contextError } = await serviceClient
    .from('notes')
    .select('content')
    .eq('visit_id', visitId)
    .eq('type', 'ai_context')
    .single();

  if (contextError && contextError.code !== 'PGRST116') { // PGRST116 is "not found" error
    existingDetails = "N/A";
  }

  existingDetails = existingNote?.content || 'N/A';
  
  console.log('[AI Context] Generating medical context from transcript');
  const input: CompletionInput = {
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: AI_CONTEXT_PROMPT(contextPrompt, existingDetails)
      } as ChatCompletionSystemMessageParam,
      {
        role: "user",
        content: transcriptFragment
      } as ChatCompletionUserMessageParam
    ],
    temperature: 0.0,
  };

  const newContext = await getOpenAICompletion(input, 'ai_context', serviceClient);
  
  // Return both the new context and the existing context if available
  return {
    newContext,
    existingContext: existingNote?.content || null
  };
}

export async function generateSoapNote(
  visitId: string,
  transcript: string,
  serviceClient: SupabaseClient,
  userId: string
): Promise<string> {

  console.log('[SOAP] Generating SOAP note for visit:', visitId);

  // Get context prompt
  const contextPrompt = await getContextPrompt({userId, visitId, serviceClient});

  console.log('[SOAP] Generating SOAP note from transcript');
  const input: CompletionInput = {
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: SOAP_NOTE_PROMPT(contextPrompt)
      } as ChatCompletionSystemMessageParam,
      {
        role: "user",
        content: transcript
      } as ChatCompletionUserMessageParam
    ],
    temperature: 0.0,
  };

  return getOpenAICompletion(input, 'soap_note', serviceClient);
}

export async function generateTemplateNote(
  visitId: string,
  templateId: string,
  serviceClient: SupabaseClient,
  userId: string
): Promise<string> {
  // Get the template
  const { data: template, error: templateError } = await serviceClient
    .from('template_library')
    .select('*')
    .eq('id', templateId)
    .order('version_id', { ascending: false })
    .limit(1)
    .single();

  if (templateError || !template) {
    throw new Error('Template not found');
  }

  console.log('[Template] Getting context prompt', {userId, visitId});
  const contextPrompt = await getContextPrompt({userId, visitId, serviceClient, templateType: template.type});

  console.log('[Template] Context prompt:', contextPrompt);
  console.log('[Template] Generating note from template:', templateId);


  // Get the visit transcript
  const { data: transcript, error: transcriptError } = await serviceClient
    .from('transcripts')
    .select('full_text')
    .eq('visit_id', visitId)
    .single();

  if (transcriptError || !transcript) {
    throw new Error('Transcript not found');
  }

  let templatePrompt;
  if (template.emr_specific && template.emr_specific.includes('mdland')) {
    templatePrompt = TEMPLATE_PROMPT_HTML(contextPrompt);
  } else {
    templatePrompt = TEMPLATE_PROMPT(contextPrompt);
  }

  console.log('[Template] Generating note from template');
  const input: CompletionInput = {
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: templatePrompt
      } as ChatCompletionSystemMessageParam,
      {
        role: "system",
        content: template.prompt
      } as ChatCompletionSystemMessageParam,
      {
        role: "user",
        content: transcript.full_text
      } as ChatCompletionUserMessageParam
    ],
    temperature: 0.0,
  };

  return getOpenAICompletion(input, `template_note_${templateId}`, serviceClient);
}

export async function saveTemplateNote(
  visitId: string,
  templateId: string,
  noteId: string,
  templateName: string,
  generatedNote: string,
  serviceClient: SupabaseClient
): Promise<void> {
  const { error: noteError } = await serviceClient
    .from('notes')
    .update({
      content: generatedNote,
      updated_at: new Date().toISOString(),
      metadata: {
        template_id: templateId,
        template_name: templateName,
        status: 'completed'
      }
    })
    .eq('id', noteId);

  if (noteError) {
    throw noteError;
  }
} 