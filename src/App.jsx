import React, { useState, useCallback } from 'react';
import ChatPanel from './panels/ChatPanel.jsx';
import CodePanel from './panels/CodePanel.jsx';
import PreviewPanel from './panels/PreviewPanel.jsx';
import { generateUI, modifyUI, rollbackVersion, getVersions } from './services/api.js';

function App() {
    const [sessionId, setSessionId] = useState(null);
    const [currentCode, setCurrentCode] = useState('');
    const [messages, setMessages] = useState([]);
    const [versions, setVersions] = useState([]);
    const [currentVersion, setCurrentVersion] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('preview'); // 'code' or 'preview' for mobile

    const addMessage = (role, content, extras = {}) => {
        setMessages(prev => [...prev, { role, content, ...extras }]);
    };

    const refreshVersions = useCallback(async (sid) => {
        try {
            const result = await getVersions(sid);
            setVersions(result.versions || []);
        } catch (err) {
            console.error('Failed to fetch versions:', err);
        }
    }, []);

    const handleSend = useCallback(async (prompt) => {
        addMessage('user', prompt);
        setIsLoading(true);

        try {
            let result;

            if (currentCode && sessionId) {
                // Modify existing code
                result = await modifyUI(prompt, sessionId, currentCode);
            } else {
                // Generate new UI
                result = await generateUI(prompt, sessionId);
            }

            setSessionId(result.sessionId);
            setCurrentCode(result.code);
            setCurrentVersion(result.version);

            addMessage('assistant', result.explanation, {
                agentSteps: result.agentSteps,
                componentsUsed: result.componentsUsed
            });

            await refreshVersions(result.sessionId);

        } catch (err) {
            addMessage('assistant', `❌ Error: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    }, [currentCode, sessionId, refreshVersions]);

    const handleRollback = useCallback(async (versionId) => {
        if (!sessionId) return;
        setIsLoading(true);

        try {
            const result = await rollbackVersion(sessionId, versionId);
            setCurrentCode(result.code);
            setCurrentVersion(result.version);

            addMessage('assistant', `⏪ Rolled back to version ${versionId}. ${result.explanation}`);
            await refreshVersions(sessionId);

        } catch (err) {
            addMessage('assistant', `❌ Rollback failed: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    }, [sessionId, refreshVersions]);

    const handleCodeChange = (newCode) => {
        setCurrentCode(newCode);
    };

    return (
        <div className="app">
            <div className="app__header">
                <div className="app__brand">
                    <span className="app__brand-icon">⚡</span>
                    <span className="app__brand-text">AI UI Builder</span>
                </div>
                <div className="app__tabs">
                    <button
                        className={`app__tab ${activeTab === 'code' ? 'app__tab--active' : ''}`}
                        onClick={() => setActiveTab('code')}
                    >
                        📝 Code
                    </button>
                    <button
                        className={`app__tab ${activeTab === 'preview' ? 'app__tab--active' : ''}`}
                        onClick={() => setActiveTab('preview')}
                    >
                        👁️ Preview
                    </button>
                </div>
                <div className="app__status">
                    {sessionId ? (
                        <span className="app__status-badge app__status-badge--active">
                            Session Active • v{currentVersion}
                        </span>
                    ) : (
                        <span className="app__status-badge">
                            No Session
                        </span>
                    )}
                </div>
            </div>

            <div className="app__content">
                <div className="app__panel app__panel--chat">
                    <ChatPanel
                        messages={messages}
                        onSend={handleSend}
                        isLoading={isLoading}
                        currentVersion={currentVersion}
                        versions={versions}
                        onRollback={handleRollback}
                    />
                </div>

                <div className={`app__panel app__panel--code ${activeTab === 'code' ? 'app__panel--visible' : ''}`}>
                    <CodePanel code={currentCode} onChange={handleCodeChange} />
                </div>

                <div className={`app__panel app__panel--preview ${activeTab === 'preview' ? 'app__panel--visible' : ''}`}>
                    <PreviewPanel code={currentCode} />
                </div>
            </div>
        </div>
    );
}

export default App;
