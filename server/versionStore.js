// ============================================================
// In-Memory Version Store
// Stores version history per session for rollback support
// ============================================================

const sessions = new Map();

export function createSession(sessionId) {
    sessions.set(sessionId, {
        versions: [],
        createdAt: new Date().toISOString()
    });
}

export function addVersion(sessionId, { code, plan, explanation, userPrompt, componentsUsed }) {
    if (!sessions.has(sessionId)) {
        createSession(sessionId);
    }

    const session = sessions.get(sessionId);
    const version = {
        id: session.versions.length + 1,
        code,
        plan,
        explanation,
        userPrompt,
        componentsUsed,
        timestamp: new Date().toISOString()
    };

    session.versions.push(version);
    return version;
}

export function getVersions(sessionId) {
    const session = sessions.get(sessionId);
    if (!session) return [];
    return session.versions.map(v => ({
        id: v.id,
        userPrompt: v.userPrompt,
        timestamp: v.timestamp,
        componentsUsed: v.componentsUsed
    }));
}

export function getVersion(sessionId, versionId) {
    const session = sessions.get(sessionId);
    if (!session) return null;
    return session.versions.find(v => v.id === versionId) || null;
}

export function getLatestVersion(sessionId) {
    const session = sessions.get(sessionId);
    if (!session || session.versions.length === 0) return null;
    return session.versions[session.versions.length - 1];
}

export function rollbackToVersion(sessionId, versionId) {
    const version = getVersion(sessionId, versionId);
    if (!version) return null;

    // Add a new version entry that's a rollback
    return addVersion(sessionId, {
        code: version.code,
        plan: version.plan,
        explanation: `Rolled back to version ${versionId}: "${version.userPrompt}"`,
        userPrompt: `[Rollback] to v${versionId}`,
        componentsUsed: version.componentsUsed
    });
}
