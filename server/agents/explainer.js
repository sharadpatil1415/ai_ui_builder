// ============================================================
// Explainer Agent — Explains AI decisions in plain English
// ============================================================
import { GoogleGenerativeAI } from '@google/generative-ai';
import { EXPLAINER_PROMPT } from './prompts.js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function runExplainer(userRequest, plan, code) {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    // Extract component names used in the code
    const componentNames = ['Button', 'Card', 'Input', 'Table', 'Modal', 'Sidebar', 'Navbar', 'Chart'];
    const usedComponents = componentNames.filter(name => code.includes(`<${name}`));

    const fullPrompt = EXPLAINER_PROMPT
        .replace('{{USER_REQUEST}}', userRequest)
        .replace('{{PLAN}}', typeof plan === 'string' ? plan : JSON.stringify(plan, null, 2))
        .replace('{{COMPONENTS_USED}}', usedComponents.join(', '));

    const result = await model.generateContent(fullPrompt);
    const explanation = result.response.text().trim();

    return {
        success: true,
        explanation,
        componentsUsed: usedComponents,
    };
}
