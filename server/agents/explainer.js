// ============================================================
// Explainer Agent — Explains AI decisions in plain English
// ============================================================
import { GoogleGenAI } from '@google/genai';
import { EXPLAINER_PROMPT } from './prompts.js';

export async function runExplainer(userRequest, plan, code) {
    const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    // Extract component names used in the code
    const componentNames = ['Button', 'Card', 'Input', 'Table', 'Modal', 'Sidebar', 'Navbar', 'Chart'];
    const usedComponents = componentNames.filter(name => code.includes(`<${name}`));

    const fullPrompt = EXPLAINER_PROMPT
        .replace('{{USER_REQUEST}}', userRequest)
        .replace('{{PLAN}}', typeof plan === 'string' ? plan : JSON.stringify(plan, null, 2))
        .replace('{{COMPONENTS_USED}}', usedComponents.join(', '));

    const result = await genAI.models.generateContent({
        model: 'gemini-flash-latest',
        contents: fullPrompt
    });
    const explanation = result.text.trim();

    return {
        success: true,
        explanation,
        componentsUsed: usedComponents,
    };
}
