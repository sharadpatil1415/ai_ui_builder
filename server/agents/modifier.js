// ============================================================
// Modifier Agent — Incrementally modifies existing code
// ============================================================
import { GoogleGenerativeAI } from '@google/generative-ai';
import { MODIFIER_PROMPT } from './prompts.js';

async function callWithRetry(model, prompt, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const result = await model.generateContent(prompt);
            return result.response.text().trim();
        } catch (err) {
            if (err.message && err.message.includes('429') && attempt < maxRetries) {
                const waitSec = Math.min(10 * attempt, 35);
                console.log(`[Retry] Rate limited. Waiting ${waitSec}s... (attempt ${attempt}/${maxRetries})`);
                await new Promise(r => setTimeout(r, waitSec * 1000));
            } else {
                throw err;
            }
        }
    }
}

export async function runModifier(currentCode, modificationRequest) {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const fullPrompt = MODIFIER_PROMPT
        .replace('{{CURRENT_CODE}}', currentCode)
        + modificationRequest;

    const text = await callWithRetry(model, fullPrompt);
    let code = text;

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
