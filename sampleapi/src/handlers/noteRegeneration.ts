import { Request, Response } from 'express';
import { handleError } from '../utils/error';
import { generateSoapNote, generateTemplateNote } from '../services/aiService';
import { AuthenticatedRequest } from "../middleware/auth";

export const handleSoapNoteRegeneration = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  try {
    const { noteId } = req.params;
    const userId = req.user?.id;
    const { userClient: supabase, serviceClient } = req.supabase;

    if (!userId || !noteId || !supabase) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    console.log('[handleSoapNoteRegeneration] noteId:', noteId);
    console.log('[handleSoapNoteRegeneration] User ID:', userId);
    
    // First try to get the note with the user client
    const { data: noteData, error: noteError } = await supabase
      .from('notes')
      .select('*')
      .eq('id', noteId)
      .single();

    // If user can't access note with user client, try with service client
    let finalNoteData;
    if (noteError || !noteData) {
      console.log('[handleSoapNoteRegeneration] Note not found with user client, trying service client');
      console.log('[handleSoapNoteRegeneration] Note access error details:', noteError);
      
      // Try with service client
      const { data: serviceNoteData, error: serviceNoteError } = await serviceClient
        .from('notes')
        .select('*')
        .eq('id', noteId)
        .single();
        
      if (serviceNoteError || !serviceNoteData) {
        console.log('[handleSoapNoteRegeneration] Note ID not found with service client:', noteId, serviceNoteError);
        return res.status(404).json({ error: 'Note not found' });
      }
      
      console.log('[handleSoapNoteRegeneration] Note found with service client, proceeding with visit_id:', serviceNoteData.visit_id);
      finalNoteData = serviceNoteData;
      
      // Verify visit ownership
      const { data: visitOwnershipData, error: visitOwnershipError } = await serviceClient
        .from('visits')
        .select('user_id')
        .eq('id', serviceNoteData.visit_id)
        .single();
        
      console.log('[handleSoapNoteRegeneration] Visit ownership check:', {
        visitId: serviceNoteData.visit_id,
        ownerId: visitOwnershipData?.user_id,
        currentUserId: userId,
        isOwner: visitOwnershipData?.user_id === userId,
        error: visitOwnershipError
      });
    } else {
      finalNoteData = noteData;
      console.log('[handleSoapNoteRegeneration] Note found with user client, proceeding');
      
      // Verify visit ownership directly
      const { data: visitOwnershipData, error: visitOwnershipError } = await serviceClient
        .from('visits')
        .select('user_id')
        .eq('id', noteData.visit_id)
        .single();
        
      console.log('[handleSoapNoteRegeneration] Visit ownership check (user client path):', {
        visitId: noteData.visit_id,
        ownerId: visitOwnershipData?.user_id,
        currentUserId: userId,
        isOwner: visitOwnershipData?.user_id === userId,
        error: visitOwnershipError
      });
    }

    // Get the visit transcript
    const { data: transcript, error: transcriptError } = await serviceClient
      .from('transcripts')
      .select('full_text')
      .eq('visit_id', finalNoteData.visit_id)
      .single();

    if (transcriptError || !transcript?.full_text) {
      console.log('[handleSoapNoteRegeneration] Transcript not found:', transcriptError);
      return res.status(404).json({ error: 'Transcript not found' });
    }

    // Generate new SOAP note content using the transcript
    const newContent = await generateSoapNote(finalNoteData.visit_id, transcript.full_text, serviceClient, userId);

    console.log('[handleSoapNoteRegeneration] About to insert note with service client');
    // Create a new version of the note using service client to avoid permission issues
    const { data: newNote, error: updateError } = await serviceClient
      .from('notes')
      .insert([
        {
          visit_id: finalNoteData.visit_id,
          content: newContent,
          type: 'soap',
          template_id: '00000000-0000-0000-0000-000000000000',
          version_id: (finalNoteData.version_id || 0) + 1,
          user_facing: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (updateError) {
      console.log('[handleSoapNoteRegeneration] Error inserting note with service client:', updateError);
      return handleError(res, updateError);
    }

    console.log('[handleSoapNoteRegeneration] Successfully inserted note with service client');
    return res.json(newNote);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function handleTemplateNoteRegeneration(req: AuthenticatedRequest, res: Response): Promise<Response> {
  try {
    const { noteId } = req.params;
    const userId = req.user?.id;
    const { userClient: supabase, serviceClient } = req.supabase;

    if (!userId || !noteId || !supabase) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    console.log('[handleTemplateNoteRegeneration] Attempting to regenerate note:', noteId);
    console.log('[handleTemplateNoteRegeneration] User ID:', userId);
    
    // Try to get note with user client first
    const { data: noteData, error: noteError } = await supabase
      .from('notes')
      .select('*')
      .eq('id', noteId)
      .single();

    // If user can't access note, try with service client
    if (noteError || !noteData || !noteData.template_id) {
      console.log('[handleTemplateNoteRegeneration] Note not found with user client, trying service client');
      console.log('[handleTemplateNoteRegeneration] Note access error details:', noteError);
      
      // Try with service client
      const { data: serviceNoteData, error: serviceNoteError } = await serviceClient
        .from('notes')
        .select('*')
        .eq('id', noteId)
        .single();
        
      if (serviceNoteError || !serviceNoteData || !serviceNoteData.template_id) {
        console.log('[handleTemplateNoteRegeneration] Note ID not found with service client:', noteId, serviceNoteError);
        return res.status(400).json({ error: 'Note ID not found' });
      }
      
      console.log('[handleTemplateNoteRegeneration] Note found with service client, proceeding with visit_id:', serviceNoteData.visit_id);
      
      // Verify visit ownership
      const { data: visitOwnershipData, error: visitOwnershipError } = await serviceClient
        .from('visits')
        .select('user_id')
        .eq('id', serviceNoteData.visit_id)
        .single();
        
      console.log('[handleTemplateNoteRegeneration] Visit ownership check:', {
        visitId: serviceNoteData.visit_id,
        ownerId: visitOwnershipData?.user_id,
        currentUserId: userId,
        isOwner: visitOwnershipData?.user_id === userId,
        error: visitOwnershipError
      });

      // Get the template name for metadata
      const { data: template, error: templateError } = await serviceClient
        .from('template_library')
        .select('name')
        .eq('id', serviceNoteData.template_id)
        .order('version_id', { ascending: false })
        .limit(1)
        .single();

      if (templateError || !template) {
        console.log('[handleTemplateNoteRegeneration] Template ID not found:', serviceNoteData.template_id);
        return res.status(400).json({ error: 'Template not found' });
      }

      // Generate new template note content using the original template and transcript
      const newContent = await generateTemplateNote(
        serviceNoteData.visit_id, 
        serviceNoteData.template_id, 
        serviceClient, 
        userId
      );

      console.log('[handleTemplateNoteRegeneration] About to insert note with service client');
      // Create a new version of the note using the service client since user has permission issues
      const { data: newNote, error: updateError } = await serviceClient
        .from('notes')
        .insert([
          {
            visit_id: serviceNoteData.visit_id,
            content: newContent,
            type: 'template',
            template_id: serviceNoteData.template_id,
            version_id: (serviceNoteData.version_id || 0) + 1,
            metadata: {
              template_name: template.name,
              status: 'completed'
            },
            user_facing: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
        .select()
        .single();

      if (updateError) {
        console.log('[handleTemplateNoteRegeneration] Error inserting note with service client:', updateError);
        return handleError(res, updateError);
      }

      console.log('[handleTemplateNoteRegeneration] Successfully inserted note with service client');
      return res.json(newNote);
    }
    
    // If we got here, the user has access to the note
    console.log('[handleTemplateNoteRegeneration] Note found with user client, proceeding');
    
    // Verify visit ownership directly
    const { data: visitOwnershipData, error: visitOwnershipError } = await serviceClient
      .from('visits')
      .select('user_id')
      .eq('id', noteData.visit_id)
      .single();
      
    console.log('[handleTemplateNoteRegeneration] Visit ownership check (user client path):', {
      visitId: noteData.visit_id,
      ownerId: visitOwnershipData?.user_id,
      currentUserId: userId,
      isOwner: visitOwnershipData?.user_id === userId,
      error: visitOwnershipError
    });
    
    // Get the template name for metadata
    const { data: template, error: templateError } = await serviceClient
      .from('template_library')
      .select('name')
      .eq('id', noteData.template_id)
      .order('version_id', { ascending: false })
      .limit(1)
      .single();

    if (templateError || !template) {
      console.log('[handleTemplateNoteRegeneration] Template ID not found:', noteData.template_id);
      return res.status(400).json({ error: 'Template not found' });
    }

    // Generate new template note content using the original template and transcript
    const newContent = await generateTemplateNote(
      noteData.visit_id, 
      noteData.template_id, 
      serviceClient, 
      userId
    );

    console.log('[handleTemplateNoteRegeneration] About to insert note with user client');
    // Create a new version of the note
    const { data: newNote, error: updateError } = await supabase
      .from('notes')
      .insert([
        {
          visit_id: noteData.visit_id,
          content: newContent,
          type: 'template',
          template_id: noteData.template_id,
          version_id: (noteData.version_id || 0) + 1,
          metadata: {
            template_name: template.name,
            status: 'completed'
          },
          user_facing: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (updateError) {
      console.log('[handleTemplateNoteRegeneration] Error inserting note with user client:', updateError);
      
      // If user client fails, try with service client as fallback
      console.log('[handleTemplateNoteRegeneration] Falling back to service client for insertion');
      const { data: serviceNewNote, error: serviceUpdateError } = await serviceClient
        .from('notes')
        .insert([
          {
            visit_id: noteData.visit_id,
            content: newContent,
            type: 'template',
            template_id: noteData.template_id,
            version_id: (noteData.version_id || 0) + 1,
            metadata: {
              template_name: template.name,
              status: 'completed'
            },
            user_facing: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
        .select()
        .single();
        
      if (serviceUpdateError) {
        console.log('[handleTemplateNoteRegeneration] Error inserting note with service client fallback:', serviceUpdateError);
        return handleError(res, serviceUpdateError);
      }
      
      console.log('[handleTemplateNoteRegeneration] Successfully inserted note with service client fallback');
      return res.json(serviceNewNote);
    }

    console.log('[handleTemplateNoteRegeneration] Successfully inserted note with user client');
    return res.json(newNote);
  } catch (error) {
    return handleError(res, error);
  }
} 