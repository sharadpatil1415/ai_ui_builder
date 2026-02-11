// ============================================================
// Generator Agent — Converts structured plan → React code
// ============================================================
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GENERATOR_PROMPT } from './prompts.js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function runGenerator(plan) {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const planStr = typeof plan === 'string' ? plan : JSON.stringify(plan, null, 2);
    const fullPrompt = GENERATOR_PROMPT + planStr;

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
