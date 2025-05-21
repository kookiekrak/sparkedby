"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSoapNote = generateSoapNote;
exports.regenerateTemplateNote = regenerateTemplateNote;
const openai_1 = require("openai");
const apiCredentials_1 = require("../utils/apiCredentials");
async function generateSoapNote(note) {
    const apiKey = await (0, apiCredentials_1.getOpenAIApiKey)();
    const openai = new openai_1.OpenAI({
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
async function regenerateTemplateNote(note) {
    const apiKey = await (0, apiCredentials_1.getOpenAIApiKey)();
    const openai = new openai_1.OpenAI({
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
