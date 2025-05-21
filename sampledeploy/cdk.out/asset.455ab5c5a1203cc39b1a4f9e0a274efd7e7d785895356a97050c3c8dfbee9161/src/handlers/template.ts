import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth";
import { generateTemplateNote } from '../services/aiService';

export const handleTemplateGeneration = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { visitId, templateId, noteId } = req.body;
  const userId = req.user.id;

  if (!visitId || !templateId) {
    res.status(400).json({ error: 'Missing required parameters' });
    return;
  }

  try {
    const { serviceClient } = req.supabase;

    // Get the template name first for error handling
    const { data: template, error: templateError } = await serviceClient
      .from('template_library')
      .select('name')
      .eq('id', templateId)
      .single();

    if (templateError || !template) {
      console.error('[Template] Failed to fetch template:', templateError);
      res.status(404).json({ error: 'Template not found' });
      return;
    }

    // Generate the note content
    const generatedNote = await generateTemplateNote(visitId, templateId, serviceClient, userId);
    
    // Insert the new note - version_id will be auto-incremented by the database
    const { error: insertError } = await serviceClient
      .from('notes')
      .upsert({
        id: noteId,
        visit_id: visitId,
        content: generatedNote,
        type: 'template',
        template_id: templateId,
        metadata: {
          template_name: template.name,
          status: 'completed'
        },
        user_facing: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (insertError) {
      console.error('[Template] Error saving note:', insertError);
      throw insertError;
    }

    res.json({ success: true });
  } catch (error) {
    console.error('[Template] Error generating note:', error);
    res.status(500).json({ 
      error: 'Failed to generate note',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}; 