import { Response } from 'express';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';
import { AuthenticatedRequest } from '../middleware/auth';
import { generateAIContext, generateSoapNote } from '../services/aiService';

type Container = Database['public']['Tables']['containers']['Row'];

const hallucinationFilter = ["Дякую за перегляд", "Thank you for watching", "시청해주셔서 감사합니다", "Thanks for watching"]


async function generateAndSaveAIContext(
  visitId: string,
  transcriptFragment: string,
  serviceClient: SupabaseClient,
  userId: string
) {
  try {
    const { newContext, existingContext } = await generateAIContext(visitId, transcriptFragment, serviceClient, userId);
      
    // Combine existing content with new content if it exists
    const combinedContent = existingContext 
      ? `${existingContext}\n${newContext}`
      : newContext;

    const { error: noteError } = await serviceClient
    .from('notes')
    .upsert({
      visit_id: visitId,
      content: combinedContent,
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
    .filter(text => text.length > 0)
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
    const { visitId, containerIndex, text, isFinal, language } = req.body;
    const { serviceClient } = req.supabase;

    console.log(`[UPDATE-CONTAINER-TEXT] Processing request: visit=${visitId}, container=${containerIndex}, isFinal=${isFinal}`, {
      textLength: text?.length || 0,
      requestIP: req.ip || 'unknown',
      requestHeaders: req.headers,
      timestamp: new Date().toISOString()
    });

    // Validate required fields
    if (!visitId || containerIndex === undefined || text === undefined) {
      console.error('[UPDATE-CONTAINER-TEXT] Missing required fields', { 
        visitId, 
        containerIndex, 
        textDefined: text !== undefined 
      });
      res.status(400).json({
        error: 'Missing required fields: visitId, containerIndex, text'
      });
      return;
    }

    console.log(`[UPDATE-CONTAINER-TEXT] Updating container: visit=${visitId}, container=${containerIndex}, isFinal=${isFinal}`);
    
    // Track timing for database operations
    const startTime = Date.now();


    let containerText = text;
    if (hallucinationFilter.some(filter => text.includes(filter))) {
      containerText = "";
    }


    // Update or insert container text
    const { data, error } = await serviceClient
      .from('containers')
      .upsert({
        visit_id: visitId,
        chunk_id: containerIndex,
        transcript_fragment: containerText,
        audio_language: language,
        state: 'completed' as Database['public']['Enums']['container_state'],
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'visit_id,chunk_id'
      })
      .select()
      .single();

    if (error) {
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
      // Don't fail the request if context generation fails
    }

    // If this is the final container, process it
    if (isFinal) {
      console.log(`[UPDATE-CONTAINER-TEXT] Processing final container: ${visitId}/${containerIndex}`);
      try {
        await processFinalContainer(visitId, serviceClient, userId);
        console.log(`[UPDATE-CONTAINER-TEXT] Final container processed successfully: ${visitId}/${containerIndex}`);
      } catch (finalizeError) {
        console.error('[UPDATE-CONTAINER-TEXT] Error finalizing transcript:', finalizeError);
        res.status(500).json({
          error: 'Failed to finalize transcript',
          success: false
        });
        return;
      }
    } else {
      console.log(`[UPDATE-CONTAINER-TEXT] Non-final container processed: ${visitId}/${containerIndex}`);
    }

    // Ensure consistent response format for both final and non-final containers
    const response = {
      success: true,
      data,
      isFinal,
      message: isFinal ? 'Final container processed successfully' : 'Container updated successfully'
    };
    
    console.log(`[UPDATE-CONTAINER-TEXT] Sending success response for ${visitId}/${containerIndex}`, {
      isFinal,
      totalTime: Date.now() - startTime
    });
    
    res.json(response);
    return;

  } catch (error) {
    console.error('[UPDATE-CONTAINER-TEXT] Unexpected error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
    return;
  }
} 