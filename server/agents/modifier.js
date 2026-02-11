// ============================================================
// Modifier Agent — Incrementally modifies existing code
// ============================================================
import { GoogleGenerativeAI } from '@google/generative-ai';
import { MODIFIER_PROMPT } from './prompts.js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function runModifier(currentCode, modificationRequest) {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const fullPrompt = MODIFIER_PROMPT
        .replace('{{CURRENT_CODE}}', currentCode)
        + modificationRequest;

    const result = await model.generateContent(fullPrompt);
    let code = result.response.text().trim();

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
