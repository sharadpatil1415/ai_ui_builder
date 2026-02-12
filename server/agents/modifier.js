// ============================================================
// Modifier Agent — Incrementally modifies existing code
// ============================================================
import { GoogleGenAI } from '@google/genai';
import { MODIFIER_PROMPT } from './prompts.js';

export async function runModifier(currentCode, modificationRequest) {
    const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const fullPrompt = MODIFIER_PROMPT
        .replace('{{CURRENT_CODE}}', currentCode)
        + modificationRequest;

    const result = await genAI.models.generateContent({
        model: 'gemini-flash-latest',
        contents: fullPrompt
    });
    let code = result.text.trim();

    // Strip markdown code fences if present
    const codeMatch = code.match(/```(?:jsx|javascript|js|react)?\s*([\s\S]*?)```/);
    if (codeMatch) {
        code = codeMatch[1].trim();
    }

    return {
        success: true,
        code,
    };
}
