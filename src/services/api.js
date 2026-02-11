// API Service — Frontend → Backend communication
const API_BASE = '/api';

export async function generateUI(prompt, sessionId = null) {
    const res = await fetch(`${API_BASE}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, sessionId })
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Server error: ${res.status}`);
    }
    return res.json();
}

export async function modifyUI(prompt, sessionId, currentCode) {
    const res = await fetch(`${API_BASE}/modify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, sessionId, currentCode })
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Server error: ${res.status}`);
    }
    return res.json();
}

export async function getVersions(sessionId) {
    const res = await fetch(`${API_BASE}/versions/${sessionId}`);
    if (!res.ok) throw new Error('Failed to fetch versions');
    return res.json();
}

export async function rollbackVersion(sessionId, versionId) {
    const res = await fetch(`${API_BASE}/rollback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, versionId })
    });
    if (!res.ok) throw new Error('Failed to rollback');
    return res.json();
}

export async function checkHealth() {
    try {
        const res = await fetch(`${API_BASE}/health`);
        return res.json();
    } catch {
        return { status: 'error', hasApiKey: false };
    }
}
