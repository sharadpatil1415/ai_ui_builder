// ============================================================
// AI UI Builder — Express Server
// Orchestrates multi-step AI agent pipeline
// ============================================================
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { runPlanner } from './agents/planner.js';
import { runGenerator } from './agents/generator.js';
import { runModifier } from './agents/modifier.js';
import { runExplainer } from './agents/explainer.js';
import { sanitizePrompt, validateGeneratedCode, autoFixCode } from './validation.js';
import { addVersion, getVersions, getVersion, getLatestVersion, rollbackToVersion } from './versionStore.js';

dotenv.config({ path: '../.env' });

// Also check local .env
if (!process.env.GEMINI_API_KEY) {
    dotenv.config();
}

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', hasApiKey: !!process.env.GEMINI_API_KEY });
});

// ============================================================
// POST /api/generate — Full pipeline: Plan → Generate → Explain
// ============================================================
app.post('/api/generate', async (req, res) => {
    try {
        const { prompt, sessionId = uuidv4() } = req.body;

        if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        // Safety check
        const safety = sanitizePrompt(prompt);
        if (!safety.safe) {
            return res.status(400).json({ error: `Prompt rejected: ${safety.reason}` });
        }

        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ error: 'GEMINI_API_KEY is not configured. Please set it in .env file.' });
        }

        console.log(`\n[Generate] Session: ${sessionId}`);
        console.log(`[Generate] Prompt: "${prompt}"`);

        // Step 1: PLANNER
        console.log('[Step 1] Running Planner...');
        const planResult = await runPlanner(prompt);
        if (!planResult.success) {
            return res.status(500).json({
                error: 'Planner failed',
                details: planResult.error,
                step: 'planner'
            });
        }
        console.log('[Step 1] Plan created successfully');

        // Step 2: GENERATOR
        console.log('[Step 2] Running Generator...');
        const genResult = await runGenerator(planResult.plan);
        if (!genResult.success) {
            return res.status(500).json({
                error: 'Generator failed',
                step: 'generator'
            });
        }
        console.log('[Step 2] Code generated successfully');

        // Auto-fix code
        let code = autoFixCode(genResult.code);

        // Validate code
        const validation = validateGeneratedCode(code);
        if (!validation.valid) {
            console.warn('[Validation] Issues found:', validation.issues);
        }

        // Step 3: EXPLAINER
        console.log('[Step 3] Running Explainer...');
        const explainResult = await runExplainer(prompt, planResult.plan, code);
        console.log('[Step 3] Explanation generated');

        // Save version
        const version = addVersion(sessionId, {
            code,
            plan: planResult.plan,
            explanation: explainResult.explanation,
            userPrompt: prompt,
            componentsUsed: explainResult.componentsUsed
        });

        res.json({
            sessionId,
            version: version.id,
            code,
            plan: planResult.plan,
            explanation: explainResult.explanation,
            componentsUsed: explainResult.componentsUsed,
            validationIssues: validation.issues,
            agentSteps: [
                { step: 'Planner', status: 'completed', output: 'Structured plan created' },
                { step: 'Generator', status: 'completed', output: 'React code generated' },
                { step: 'Validator', status: validation.valid ? 'passed' : 'warnings', output: validation.issues.length ? validation.issues : 'All checks passed' },
                { step: 'Explainer', status: 'completed', output: 'Decision explanation ready' },
            ]
        });

    } catch (err) {
        console.error('[Generate] Error:', err);
        res.status(500).json({ error: err.message || 'Internal server error' });
    }
});

// ============================================================
// POST /api/modify — Modify existing code
// ============================================================
app.post('/api/modify', async (req, res) => {
    try {
        const { prompt, sessionId, currentCode } = req.body;

        if (!prompt || !sessionId) {
            return res.status(400).json({ error: 'Prompt and sessionId are required' });
        }

        const safety = sanitizePrompt(prompt);
        if (!safety.safe) {
            return res.status(400).json({ error: `Prompt rejected: ${safety.reason}` });
        }

        // Get current code from version history or from request
        let codeToModify = currentCode;
        if (!codeToModify) {
            const latest = getLatestVersion(sessionId);
            if (!latest) {
                return res.status(400).json({ error: 'No existing code found. Use /api/generate first.' });
            }
            codeToModify = latest.code;
        }

        console.log(`\n[Modify] Session: ${sessionId}`);
        console.log(`[Modify] Request: "${prompt}"`);

        // Step 1: MODIFIER (instead of planner + generator)
        console.log('[Step 1] Running Modifier...');
        const modResult = await runModifier(codeToModify, prompt);
        if (!modResult.success) {
            return res.status(500).json({ error: 'Modifier failed', step: 'modifier' });
        }

        let code = autoFixCode(modResult.code);
        const validation = validateGeneratedCode(code);

        // Step 2: EXPLAINER
        console.log('[Step 2] Running Explainer...');
        const explainResult = await runExplainer(prompt, { modification: true, request: prompt }, code);

        // Save version
        const version = addVersion(sessionId, {
            code,
            plan: { modification: true, request: prompt },
            explanation: explainResult.explanation,
            userPrompt: prompt,
            componentsUsed: explainResult.componentsUsed
        });

        res.json({
            sessionId,
            version: version.id,
            code,
            explanation: explainResult.explanation,
            componentsUsed: explainResult.componentsUsed,
            validationIssues: validation.issues,
            agentSteps: [
                { step: 'Modifier', status: 'completed', output: 'Code modified incrementally' },
                { step: 'Validator', status: validation.valid ? 'passed' : 'warnings', output: validation.issues.length ? validation.issues : 'All checks passed' },
                { step: 'Explainer', status: 'completed', output: 'Changes explained' },
            ]
        });

    } catch (err) {
        console.error('[Modify] Error:', err);
        res.status(500).json({ error: err.message || 'Internal server error' });
    }
});

// ============================================================
// GET /api/versions/:sessionId — Get version history
// ============================================================
app.get('/api/versions/:sessionId', (req, res) => {
    const versions = getVersions(req.params.sessionId);
    res.json({ versions });
});

// ============================================================
// POST /api/rollback — Roll back to a specific version
// ============================================================
app.post('/api/rollback', (req, res) => {
    const { sessionId, versionId } = req.body;

    if (!sessionId || !versionId) {
        return res.status(400).json({ error: 'sessionId and versionId are required' });
    }

    const version = rollbackToVersion(sessionId, versionId);
    if (!version) {
        return res.status(404).json({ error: 'Version not found' });
    }

    res.json({
        sessionId,
        version: version.id,
        code: version.code,
        explanation: version.explanation,
        rolledBackTo: versionId
    });
});

// ============================================================
// GET /api/version/:sessionId/:versionId — Get a specific version
// ============================================================
app.get('/api/version/:sessionId/:versionId', (req, res) => {
    const version = getVersion(req.params.sessionId, parseInt(req.params.versionId));
    if (!version) {
        return res.status(404).json({ error: 'Version not found' });
    }
    res.json(version);
});

app.listen(PORT, () => {
    console.log(`\n🚀 AI UI Builder server running on http://localhost:${PORT}`);
    console.log(`   API Key configured: ${process.env.GEMINI_API_KEY ? '✅' : '❌ (set GEMINI_API_KEY in .env)'}`);
});
