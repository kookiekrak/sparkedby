"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getContextPrompt = getContextPrompt;
async function getContextPrompt(userId, serviceClient) {
    try {
        // Get user profile information
        const { data: profile, error: profileError } = await serviceClient
            .from('user_profiles')
            .select('name, specialty')
            .eq('id', userId)
            .single();
        if (profileError) {
            console.error('[Context] Failed to fetch user profile:', profileError);
            return generatePrompt(); // Return basic prompt without user info
        }
        return generatePrompt(profile);
    }
    catch (error) {
        console.error('[Context] Error generating context prompt:', error);
        return generatePrompt(); // Return basic prompt without user info
    }
}
function generatePrompt(userContext) {
    const currentDate = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    let prompt = `The current date is ${currentDate}`;
    if (userContext?.name || userContext?.specialty) {
        prompt += `, the clinician's`;
        if (userContext.name) {
            prompt += ` name is ${userContext.name}`;
        }
        if (userContext.name && userContext.specialty) {
            prompt += ` and their`;
        }
        if (userContext.specialty) {
            prompt += ` specialty is ${userContext.specialty}`;
        }
    }
    prompt += '.';
    return prompt;
}
