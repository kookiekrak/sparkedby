import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth";
import { ADMIN_EMAILS } from "../config/admin";
import { generateAndSaveSoapNote } from "./containerText";
import { Database } from '../types/supabase';

type Container = Database['public']['Tables']['containers']['Row'];

export const handleVisitRegeneration = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { visitId } = req.body;
  const userEmail = req.user.email;

  if (!ADMIN_EMAILS.includes(userEmail)) {
    res.status(403).json({ error: 'Unauthorized: Admin access required' });
    return;
  }

  if (!visitId) {
    res.status(400).json({ error: 'Missing required parameters' });
    return;
  }

  try {
    const { serviceClient } = req.supabase;

    // Get the visit owner's user ID
    const { data: visitData, error: visitOwnerError } = await serviceClient
      .from('visits')
      .select('user_id')
      .eq('id', visitId)
      .single();

    if (visitOwnerError || !visitData?.user_id) {
      throw new Error('Failed to get visit owner');
    }

    // Try to get the full transcript first
    const { data: transcriptData, error: transcriptError } = await serviceClient
      .from('transcripts')
      .select('full_text')
      .eq('visit_id', visitId)
      .single();

    let fullText: string;

    // If no full transcript, build from containers
    if (transcriptError || !transcriptData?.full_text) {
      console.log('[Admin] No full transcript found, building from containers');
      
      const { data: containers, error: containersError } = await serviceClient
        .from('containers')
        .select('transcript_fragment, chunk_id')
        .eq('visit_id', visitId)
        .order('chunk_id');

      if (containersError || !containers?.length) {
        throw new Error('Failed to get containers and no full transcript available');
      }

      fullText = (containers as Container[])
        .sort((a, b) => a.chunk_id - b.chunk_id)
        .map(c => c.transcript_fragment?.trim() || '')
        .filter(text => text.length > 0)
        .join('\n\n');

      if (!fullText) {
        throw new Error('No transcript content available from any source');
      }

      // Store the rebuilt transcript
      const { error: saveTranscriptError } = await serviceClient
        .from('transcripts')
        .upsert({
          visit_id: visitId,
          full_text: fullText,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'visit_id'
        });

      if (saveTranscriptError) {
        console.error('[Admin] Error saving rebuilt transcript:', saveTranscriptError);
      }
    } else {
      fullText = transcriptData.full_text;
    }

    // Get the latest version number for SOAP notes
    const { data: latestNote, error: versionError } = await serviceClient
      .from('notes')
      .select('version_id')
      .eq('visit_id', visitId)
      .eq('type', 'soap')
      .order('version_id', { ascending: false })
      .limit(1)
      .single();

    const nextVersion = (latestNote?.version_id || 0) + 1;

    // Generate new SOAP note with incremented version
    const soapNote = await generateAndSaveSoapNote(
      visitId,
      fullText,
      serviceClient,
      visitData.user_id,
      nextVersion // Pass version to the generation function
    );
    
    // Update visit state to ready
    const { error: updateVisitError } = await serviceClient
      .from('visits')
      .update({ state: 'ready' })
      .eq('id', visitId);

    if (updateVisitError) {
      console.error('[Admin] Error updating visit state:', updateVisitError);
      throw new Error('Failed to update visit state');
    }

    res.json({ 
      success: true,
      source: transcriptData?.full_text ? 'full_transcript' : 'container_fragments',
      version: nextVersion
    });
  } catch (error) {
    console.error('[Admin] Error regenerating visit:', error);
    res.status(500).json({ 
      error: 'Failed to regenerate visit',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}; 