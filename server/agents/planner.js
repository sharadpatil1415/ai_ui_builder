// ============================================================
// Planner Agent — Interprets user intent → structured plan
// ============================================================
import { GoogleGenAI } from '@google/genai';
import { PLANNER_PROMPT } from './prompts.js';

export async function runPlanner(userPrompt) {
    const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const fullPrompt = PLANNER_PROMPT + userPrompt;

    const result = await genAI.models.generateContent({
        model: 'gemini-flash-latest',
        contents: fullPrompt
    });
    const responseText = result.text.trim();

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
