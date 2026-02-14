// ============================================================
// Explainer Agent — Explains AI decisions in plain English
// ============================================================
import { GoogleGenerativeAI } from '@google/generative-ai';
import { EXPLAINER_PROMPT } from './prompts.js';

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

export async function runExplainer(userRequest, plan, code) {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    // Extract component names used in the code
    const componentNames = ['Button', 'Card', 'Input', 'Table', 'Modal', 'Sidebar', 'Navbar', 'Chart'];
    const usedComponents = componentNames.filter(name => code.includes(`<${name}`));

    const fullPrompt = EXPLAINER_PROMPT
        .replace('{{USER_REQUEST}}', userRequest)
        .replace('{{PLAN}}', typeof plan === 'string' ? plan : JSON.stringify(plan, null, 2))
        .replace('{{COMPONENTS_USED}}', usedComponents.join(', '));

    const explanation = await callWithRetry(model, fullPrompt);

    return {
        success: true,
        explanation,
        componentsUsed: usedComponents,
    };
}
