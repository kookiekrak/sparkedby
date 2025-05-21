import { Request, Response } from 'express';
import { handleError } from '../utils/error';
import { generateSoapNote, regenerateTemplateNote } from '../services/noteGeneration';
import { AuthenticatedRequest } from "../middleware/auth";

export const handleSoapNoteRegeneration = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  try {
    const { noteId } = req.params;
    const userId = req.user?.id;
    const { userClient: supabase } = req.supabase;

    if (!userId || !noteId || !supabase) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Get the current note
    const { data: noteData, error: noteError } = await supabase
      .from('notes')
      .select('*')
      .eq('id', noteId)
      .eq('user_id', userId)
      .single();

    if (noteError || !noteData) {
      return res.status(404).json({ error: 'Note not found' });
    }

    // Add user_id to match Note type and handle metadata type
    const note = { 
      ...noteData, 
      user_id: userId,
      metadata: noteData.metadata as Record<string, any> | undefined 
    };

    // Generate new SOAP note content
    const newContent = await generateSoapNote(note);

    // Create a new version of the note
    const { data: newNote, error: updateError } = await supabase
      .from('notes')
      .insert([
        {
          ...note,
          id: undefined,  // Let Supabase generate a new ID
          content: newContent,
          previous_version_id: note.id,
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (updateError) {
      return handleError(res, updateError);
    }

    return res.json(newNote);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function handleTemplateNoteRegeneration(req: AuthenticatedRequest, res: Response): Promise<Response> {
  try {
    const { noteId } = req.params;
    const userId = req.user?.id;
    const { userClient: supabase } = req.supabase;

    if (!userId || !noteId || !supabase) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Get the current note
    const { data: noteData, error: noteError } = await supabase
      .from('notes')
      .select('*')
      .eq('id', noteId)
      .eq('user_id', userId)
      .single();

    if (noteError || !noteData) {
      return res.status(404).json({ error: 'Note not found' });
    }

    // Add user_id to match Note type and handle metadata type
    const note = { 
      ...noteData, 
      user_id: userId,
      metadata: noteData.metadata as Record<string, any> | undefined 
    };

    // Generate new template note content
    const newContent = await regenerateTemplateNote(note);

    // Create a new version of the note
    const { data: newNote, error: updateError } = await supabase
      .from('notes')
      .insert([
        {
          ...note,
          id: undefined,  // Let Supabase generate a new ID
          content: newContent,
          previous_version_id: note.id,
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (updateError) {
      return handleError(res, updateError);
    }

    return res.json(newNote);
  } catch (error) {
    return handleError(res, error);
  }
} 