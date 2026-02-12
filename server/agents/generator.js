// ============================================================
// Generator Agent — Converts structured plan → React code
// ============================================================
import { GoogleGenAI } from '@google/genai';
import { GENERATOR_PROMPT } from './prompts.js';

export async function runGenerator(plan) {
    const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const planStr = typeof plan === 'string' ? plan : JSON.stringify(plan, null, 2);
    const fullPrompt = GENERATOR_PROMPT + planStr;

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
