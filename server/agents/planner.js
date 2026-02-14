// ============================================================
// Planner Agent — Interprets user intent → structured plan
// ============================================================
import { GoogleGenerativeAI } from '@google/generative-ai';
import { PLANNER_PROMPT } from './prompts.js';

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

export async function runPlanner(userPrompt) {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const fullPrompt = PLANNER_PROMPT + userPrompt;

    const responseText = await callWithRetry(model, fullPrompt);

    // Extract JSON from response (handle potential markdown fences)
    let jsonStr = responseText;
    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
        jsonStr = jsonMatch[1].trim();
    }

    try {
        const plan = JSON.parse(jsonStr);
        return {
            success: true,
            plan,
            rawResponse: responseText
        };
    } catch (err) {
        console.error('Planner JSON parse error:', err.message);
        return {
            success: false,
            error: 'Failed to parse plan from AI response',
            rawResponse: responseText
        };
    }
}
