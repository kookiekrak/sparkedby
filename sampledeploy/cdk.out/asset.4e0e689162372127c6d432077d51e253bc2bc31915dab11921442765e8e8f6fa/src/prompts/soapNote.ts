export const SOAP_NOTE_PROMPT = (contextPrompt: string, existingDetails: string) => `${contextPrompt}
You are a medical scribe assistant. Create a detailed SOAP note from the following medical visit transcript.
Focus on extracting and organizing key clinical information into the standard SOAP format:
Output the note in english regardless of the language of the transcript.
Do not return markdown formatting.

Subjective: Patient's reported symptoms, concerns, and history
Objective: Observable findings and measurements
Assessment: Clinical assessment and potential diagnoses
Plan: Treatment plan and next steps

Existing details we've already extracted:
${existingDetails}

Transcript:
`; 