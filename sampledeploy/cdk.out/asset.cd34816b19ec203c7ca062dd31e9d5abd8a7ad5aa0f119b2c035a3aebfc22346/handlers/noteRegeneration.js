"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleSoapNoteRegeneration = void 0;
exports.handleTemplateNoteRegeneration = handleTemplateNoteRegeneration;
const error_1 = require("../utils/error");
const noteGeneration_1 = require("../services/noteGeneration");
const handleSoapNoteRegeneration = async (req, res) => {
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
            metadata: noteData.metadata
        };
        // Generate new SOAP note content
        const newContent = await (0, noteGeneration_1.generateSoapNote)(note);
        // Create a new version of the note
        const { data: newNote, error: updateError } = await supabase
            .from('notes')
            .insert([
            {
                ...note,
                id: undefined, // Let Supabase generate a new ID
                content: newContent,
                previous_version_id: note.id,
                created_at: new Date().toISOString()
            }
        ])
            .select()
            .single();
        if (updateError) {
            return (0, error_1.handleError)(res, updateError);
        }
        return res.json(newNote);
    }
    catch (error) {
        return (0, error_1.handleError)(res, error);
    }
};
exports.handleSoapNoteRegeneration = handleSoapNoteRegeneration;
async function handleTemplateNoteRegeneration(req, res) {
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
            metadata: noteData.metadata
        };
        // Generate new template note content
        const newContent = await (0, noteGeneration_1.regenerateTemplateNote)(note);
        // Create a new version of the note
        const { data: newNote, error: updateError } = await supabase
            .from('notes')
            .insert([
            {
                ...note,
                id: undefined, // Let Supabase generate a new ID
                content: newContent,
                previous_version_id: note.id,
                created_at: new Date().toISOString()
            }
        ])
            .select()
            .single();
        if (updateError) {
            return (0, error_1.handleError)(res, updateError);
        }
        return res.json(newNote);
    }
    catch (error) {
        return (0, error_1.handleError)(res, error);
    }
}
