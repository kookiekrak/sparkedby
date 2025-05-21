import { Response } from 'express';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';
import { AuthenticatedRequest } from '../middleware/auth';
import { generateAIContext, generateSoapNote } from '../services/aiService';

type Container = Database['public']['Tables']['containers']['Row'];

async function generateAndSaveAIContext(
  visitId: string,
  transcriptFragment: string,
  serviceClient: SupabaseClient,
  userId: string
) {
  try {
    const aiContext = await generateAIContext(visitId, transcriptFragment, serviceClient, userId);
      
    const { error: noteError } = await serviceClient
    .from('notes')
    .upsert({
      visit_id: visitId,
      content: aiContext,
      type: 'ai_context',
      user_facing: true,
      template_id: '00000000-0000-0000-0000-000000000000',
      version_id: 1, // always version 1 for now, versionly only bumps when user edits
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      onConflict: 'visit_id,type,template_id,version_id'
    }
  );

  if (noteError) {
    throw noteError;
  }
  } catch (error) {
    console.error('[AI Context] Failed to generate or save note:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      visitId
    });
    throw error;
  }
}

export async function generateAndSaveSoapNote(
  visitId: string,
  transcript: string,
  serviceClient: SupabaseClient,
  userId: string,
  version: number = 1 // Default to version 1 if not specified
) {
  try {
    const soapNote = await generateSoapNote(visitId, transcript, serviceClient, userId);
    const { error: noteError } = await serviceClient
      .from('notes')
      .insert({
        visit_id: visitId,
        content: soapNote,
        type: 'soap',
        version_id: version,
        template_id: '00000000-0000-0000-0000-000000000000',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (noteError) {
      throw noteError;
    }

    return soapNote;
  } catch (error) {
    console.error('[SOAP] Failed to generate or save note:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      visitId,
      version
    });
    throw error;
  }
}

async function processFinalContainer(
  visitId: string,
  serviceClient: SupabaseClient,
  userId: string
) {
  // Get all containers for this visit, ordered by chunk_id
  const { data: containers, error: fetchError } = await serviceClient
    .from('containers')
    .select('transcript_fragment, chunk_id')
    .eq('visit_id', visitId)
    .order('chunk_id');

  if (fetchError) {
    console.error('Error fetching containers:', fetchError);
    throw fetchError;
  }

  // Build complete transcript
  const fullText = (containers as Container[])
    .sort((a, b) => a.chunk_id - b.chunk_id)
    .map(c => c.transcript_fragment?.trim() || '')
    .join('\n');

  // Store the complete transcript
  const { error: transcriptError } = await serviceClient
    .from('transcripts')
    .upsert({
      visit_id: visitId,
      full_text: fullText,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'visit_id'
    });

  if (transcriptError) {
    console.error('Error storing complete transcript:', transcriptError);
    throw transcriptError;
  }

  // Update visit status
  const { error: visitError } = await serviceClient
    .from('visits')
    .update({ 
      state: 'ready' as Database['public']['Enums']['visit_state'],
      updated_at: new Date().toISOString()
    })
    .eq('id', visitId);

  if (visitError) {
    console.error('Error updating visit status:', visitError);
    throw visitError;
  }

  // Only generate SOAP note now
  await generateAndSaveSoapNote(visitId, fullText, serviceClient, userId);

  return fullText;
}

export const handleUpdateContainerText = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { visitId, containerIndex, text, isFinal } = req.body;
    const { serviceClient } = req.supabase;

    // Validate required fields
    if (!visitId || containerIndex === undefined || !text) {
      res.status(400).json({
        error: 'Missing required fields: visitId, containerIndex, text'
      });
      return;
    }

    // Update or insert container text
    const { data, error } = await serviceClient
      .from('containers')
      .upsert({
        visit_id: visitId,
        chunk_id: containerIndex,
        transcript_fragment: text,
        state: 'completed' as Database['public']['Enums']['container_state'],
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'visit_id,chunk_id'
      })
      .select()
      .single();

    if (error) {
      console.error('Error updating container text:', error);
      res.status(500).json({
        error: 'Failed to update container text'
      });
      return;
    }

    // Get the visit owner's user ID
    const { data: visitData, error: visitOwnerError } = await serviceClient
      .from('visits')
      .select('user_id')
      .eq('id', visitId)
      .single();

    if (visitOwnerError || !visitData?.user_id) {
      console.error('Error getting visit owner:', visitOwnerError);
      res.status(500).json({
        error: 'Failed to get visit owner'
      });
      return;
    }

    const userId = visitData.user_id;

    // Always process context after container update
    try {
      await generateAndSaveAIContext(visitId, text, serviceClient, userId);
    } catch (contextError) {
      console.error('Error updating AI context:', contextError);
      // Don't fail the request if context generation fails
    }

    // If this is the final container, process it
    if (isFinal) {
      try {
        await processFinalContainer(visitId, serviceClient, userId);
      } catch (finalizeError) {
        console.error('Error finalizing transcript:', finalizeError);
        res.status(500).json({
          error: 'Failed to finalize transcript',
          success: false
        });
        return;
      }
    }

    res.json({
      success: true,
      data
    });
    return;

  } catch (error) {
    console.error('Error in updateContainerText:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
    return;
  }
} 