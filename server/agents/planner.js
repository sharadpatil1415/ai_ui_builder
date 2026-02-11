// ============================================================
// Planner Agent — Interprets user intent → structured plan
// ============================================================
import { GoogleGenerativeAI } from '@google/generative-ai';
import { PLANNER_PROMPT } from './prompts.js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function runPlanner(userPrompt) {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const fullPrompt = PLANNER_PROMPT + userPrompt;

    const result = await model.generateContent(fullPrompt);
    const responseText = result.response.text().trim();

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
