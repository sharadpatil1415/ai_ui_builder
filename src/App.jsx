import React, { useState, useCallback, useEffect } from 'react';
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

    // Resizing State
    const [previewSplit, setPreviewSplit] = useState(0.5); // 0.5 = 50% split
    const [isDragging, setIsDragging] = useState(false);
    const contentRef = React.useRef(null);

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
            addMessage('assistant', `Error: ${err.message}`);
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

            addMessage('assistant', `Rolled back to version ${versionId}. ${result.explanation}`);
            await refreshVersions(sessionId);

        } catch (err) {
            addMessage('assistant', `Rollback failed: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    }, [sessionId, refreshVersions]);

    const handleCodeChange = (newCode) => {
        setCurrentCode(newCode);
    };

    // Resize Handlers
    const handleMouseDown = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isDragging || !contentRef.current) return;

            const contentRect = contentRef.current.getBoundingClientRect();
            // contentRect.left includes the ChatPanel width if it's visible? 
            // The ChatPanel is inside app__content.
            // Wait, app__panel--chat is a child of app__content.
            // So contentRect.width is the total width including Chat, Code, Preview.

            // We need to calculate the position relative to the start of the CodePanel.
            // But CodePanel starts after ChatPanel.
            // ChatPanel width is fixed 380px (or 320px etc).

            // Let's simplify: 
            // The mouse X relative to contentRect.left gives us position in the full flex container.
            // The ChatPanel takes up some space on the left.
            // We need to know where CodePanel STARTS.

            // Actually, we can just calculate split based on the remaining space.
            // splitRatio = width of Preview / (width of Code + width of Preview)

            // Let `chatWidth` be the width of the chat panel.
            // Check if chat panel is rendered and what its width is.
            const chatPanel = contentRef.current.querySelector('.app__panel--chat');
            const chatWidth = chatPanel ? chatPanel.offsetWidth : 0;

            // Available width for Code + Preview
            const availableWidth = contentRect.width - chatWidth;

            // Mouse X relative to the start of CodePanel
            // e.clientX is global. contentRect.left is global.
            const relativeX = e.clientX - contentRect.left - chatWidth;

            // Calculate new split (Preview comes AFTER Code)
            // So relativeX corresponds to Code width.
            // Code flex = 1 - split
            // Preview flex = split
            // So relativeX / availableWidth should be roughly (1 - split)

            let newSplit = 1 - (relativeX / availableWidth);

            // Clamp functionality
            if (newSplit < 0.2) newSplit = 0.2;
            if (newSplit > 0.8) newSplit = 0.8;

            setPreviewSplit(newSplit);
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
        } else {
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };
    }, [isDragging]);

    return (
        <div className="app">
            <div className="app__header">
                <div className="app__brand">
                    <span className="app__brand-text">AI UI Builder</span>
                </div>
                <div className="app__tabs">
                    <button
                        className={`app__tab ${activeTab === 'code' ? 'app__tab--active' : ''}`}
                        onClick={() => setActiveTab('code')}
                    >
                        Code
                    </button>
                    <button
                        className={`app__tab ${activeTab === 'preview' ? 'app__tab--active' : ''}`}
                        onClick={() => setActiveTab('preview')}
                    >
                        Preview
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

            <div className="app__content" ref={contentRef} style={{ '--preview-split': previewSplit }}>
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

                <div
                    className={`app__panel app__panel--code ${activeTab === 'code' ? 'app__panel--visible' : ''}`}
                >
                    <CodePanel code={currentCode} onChange={handleCodeChange} />
                </div>

                <div
                    className="app__resizer"
                    onMouseDown={handleMouseDown}
                />

                <div
                    className={`app__panel app__panel--preview ${activeTab === 'preview' ? 'app__panel--visible' : ''}`}
                >
                    <PreviewPanel code={currentCode} />
                </div>
            </div>
        </div>
    );
}

export default App;
