"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAIContext = generateAIContext;
exports.generateSoapNote = generateSoapNote;
exports.generateTemplateNote = generateTemplateNote;
exports.saveTemplateNote = saveTemplateNote;
const openai_1 = require("openai");
const contextPrompt_1 = require("../utils/contextPrompt");
const aiContext_1 = require("../prompts/aiContext");
const soapNote_1 = require("../prompts/soapNote");
const template_1 = require("../prompts/template");
const crypto_1 = __importDefault(require("crypto"));
const apiCredentials_1 = require("../utils/apiCredentials");
function hashCompletionInput(input) {
    const inputStr = JSON.stringify(input);
    return crypto_1.default.createHash('sha256').update(inputStr).digest('hex');
}
async function getCachedCompletion(input, useContext, serviceClient) {
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
    const completion = JSON.parse(data.output_text);
    return completion.choices[0].message.content;
}
async function cacheCompletion(input, useContext, completion, serviceClient) {
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
async function getOpenAICompletion(input, useContext, serviceClient) {
    // Check cache first
    const cachedResult = await getCachedCompletion(input, useContext, serviceClient);
    if (cachedResult) {
        console.log(`[OpenAI] Using cached result for context: ${useContext}`);
        return cachedResult;
    }
    console.log('[OpenAI] Cache Miss, making API call');
    // If not in cache, make API call
    const apiKey = await (0, apiCredentials_1.getOpenAIApiKey)();
    const openai = new openai_1.OpenAI({
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
async function generateAIContext(visitId, transcriptFragment, serviceClient, userId) {
    // Get context prompt
    const contextPrompt = await (0, contextPrompt_1.getContextPrompt)(userId, serviceClient);
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
    const input = {
        model: "gpt-4o-mini",
        messages: [
            {
                role: "system",
                content: (0, aiContext_1.AI_CONTEXT_PROMPT)(contextPrompt, existingDetails)
            },
            {
                role: "user",
                content: transcriptFragment
            }
        ],
        temperature: 0.0,
    };
    return getOpenAICompletion(input, 'ai_context', serviceClient);
}
async function generateSoapNote(visitId, transcript, serviceClient, userId) {
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
    // Get context prompt
    const contextPrompt = await (0, contextPrompt_1.getContextPrompt)(userId, serviceClient);
    console.log('[SOAP] Generating SOAP note from transcript');
    const input = {
        model: "gpt-4o",
        messages: [
            {
                role: "system",
                content: (0, soapNote_1.SOAP_NOTE_PROMPT)(contextPrompt, existingDetails)
            },
            {
                role: "user",
                content: transcript
            }
        ],
        temperature: 0.0,
    };
    return getOpenAICompletion(input, 'soap_note', serviceClient);
}
async function generateTemplateNote(visitId, templateId, serviceClient, userId) {
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
    // Get context prompt
    const contextPrompt = await (0, contextPrompt_1.getContextPrompt)(userId, serviceClient);
    // Get the template
    const { data: template, error: templateError } = await serviceClient
        .from('template_library')
        .select('*')
        .eq('id', templateId)
        .single();
    if (templateError || !template) {
        throw new Error('Template not found');
    }
    // Get the visit transcript
    const { data: transcript, error: transcriptError } = await serviceClient
        .from('transcripts')
        .select('full_text')
        .eq('visit_id', visitId)
        .single();
    if (transcriptError || !transcript) {
        throw new Error('Transcript not found');
    }
    console.log('[Template] Generating note from template');
    const input = {
        model: "gpt-4o",
        messages: [
            {
                role: "system",
                content: (0, template_1.TEMPLATE_PROMPT)(contextPrompt, existingDetails)
            },
            {
                role: "system",
                content: template.prompt
            },
            {
                role: "user",
                content: transcript.full_text
            }
        ],
        temperature: 0.0,
    };
    return getOpenAICompletion(input, `template_note_${templateId}`, serviceClient);
}
async function saveTemplateNote(visitId, templateId, noteId, templateName, generatedNote, serviceClient) {
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
