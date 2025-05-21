import { Note } from '../types/supabase';
import { OpenAI } from 'openai';
import { getOpenAIApiKey } from '../utils/apiCredentials';

export async function generateSoapNote(note: Note): Promise<string> {
  const apiKey = await getOpenAIApiKey();
  const openai = new OpenAI({
    apiKey
  });

  // Call OpenAI to generate SOAP note content
  const completion = await openai.chat.completions.create({
    model: "gpt-4-turbo-preview",
    messages: [
      {
        role: "system",
        content: "You are a medical professional assistant that helps generate SOAP notes based on patient information."
      },
      {
        role: "user",
        content: `Please generate a SOAP note based on the following content:\n\n${note.content}`
      }
    ]
  });

  return completion.choices[0]?.message?.content || '';
}

export async function regenerateTemplateNote(note: Note): Promise<string> {
  const apiKey = await getOpenAIApiKey();
  const openai = new OpenAI({
    apiKey
  });

  // Call OpenAI to regenerate template note content
  const completion = await openai.chat.completions.create({
    model: "gpt-4-turbo-preview",
    messages: [
      {
        role: "system",
        content: "You are an assistant that helps regenerate medical note templates while preserving the structure and improving the content."
      },
      {
        role: "user",
        content: `Please regenerate this template note while preserving its structure:\n\n${note.content}`
      }
    ]
  });

  return completion.choices[0]?.message?.content || '';
} 