import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, '../sessions_data.json');

export function loadSessions() {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const data = fs.readFileSync(DATA_FILE, 'utf8');
            console.log(`[Storage] Loading sessions from ${DATA_FILE}`);
            return new Map(JSON.parse(data));
        }
    } catch (err) {
        console.error('[Storage] Failed to load sessions:', err);
    }
    return new Map();
}

export function saveSessions(sessions) {
    try {
        const data = JSON.stringify([...sessions], null, 2);
        fs.writeFileSync(DATA_FILE, data, 'utf8');
    } catch (err) {
        console.error('[Storage] Failed to save sessions:', err);
    }
}
