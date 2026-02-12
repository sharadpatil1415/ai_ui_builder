import React, { useState, useRef, useEffect } from 'react';

const ChatPanel = ({ messages, onSend, isLoading, currentVersion, versions, onRollback }) => {
    const [input, setInput] = useState('');
    const [showVersions, setShowVersions] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = () => {
        if (input.trim() && !isLoading) {
            onSend(input.trim());
            setInput('');
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="chat-panel">
            <div className="chat-panel__header">
                <div className="chat-panel__title">
                </div>
                <div className="chat-panel__actions">
                    {versions.length > 0 && (
                        <button
                            className="chat-panel__version-btn"
                            onClick={() => setShowVersions(!showVersions)}
                        >
                            v{currentVersion} <span className="chat-panel__version-arrow">{showVersions ? '▲' : '▼'}</span>
                        </button>
                    )}
                </div>
            </div>

            {showVersions && versions.length > 0 && (
                <div className="chat-panel__versions">
                    <div className="chat-panel__versions-title">Version History</div>
                    {versions.map((v) => (
                        <button
                            key={v.id}
                            className={`chat-panel__version-item ${v.id === currentVersion ? 'chat-panel__version-item--active' : ''}`}
                            onClick={() => {
                                onRollback(v.id);
                                setShowVersions(false);
                            }}
                        >
                            <span className="chat-panel__version-id">v{v.id}</span>
                            <span className="chat-panel__version-prompt">{v.userPrompt}</span>
                            <span className="chat-panel__version-time">
                                {new Date(v.timestamp).toLocaleTimeString()}
                            </span>
                        </button>
                    ))}
                </div>
            )}

            <div className="chat-panel__messages">
                {messages.length === 0 && (
                    <div className="chat-panel__welcome">
                        <div className="chat-panel__welcome-icon">✨</div>
                        <h2>Welcome to AI UI Builder</h2>
                        <p>Describe a UI in plain English and I'll build it for you using pre-built components.</p>
                        <div className="chat-panel__suggestions">
                            <button
                                className="chat-panel__suggestion"
                                onClick={() => setInput('Create a dashboard with a navbar, sidebar with navigation items, and a grid of stat cards')}
                            >
                                📊 Dashboard with sidebar and stat cards
                            </button>
                            <button
                                className="chat-panel__suggestion"
                                onClick={() => setInput('Build a user management page with a table of users, search input, and action buttons')}
                            >
                                👥 User management table
                            </button>
                            <button
                                className="chat-panel__suggestion"
                                onClick={() => setInput('Create a settings page with form inputs organized in cards, and a save button')}
                            >
                                ⚙️ Settings form page
                            </button>
                        </div>
                    </div>
                )}

                {messages.map((msg, index) => (
                    <div key={index} className={`chat-message chat-message--${msg.role}`}>
                        <div className="chat-message__avatar">
                            {msg.role === 'user' ? '👤' : '⚡'}
                        </div>
                        <div className="chat-message__content">
                            <div className="chat-message__text">{msg.content}</div>

                            {msg.agentSteps && (
                                <div className="chat-message__steps">
                                    <div className="chat-message__steps-title">Agent Pipeline</div>
                                    {msg.agentSteps.map((step, i) => (
                                        <div key={i} className="chat-message__step">
                                            <span className={`chat-message__step-icon chat-message__step-icon--${step.status}`}>
                                                {step.status === 'completed' || step.status === 'passed' ? '✓' : '⚠'}
                                            </span>
                                            <span className="chat-message__step-name">{step.step}</span>
                                            <span className="chat-message__step-output">
                                                {Array.isArray(step.output) ? step.output.join(', ') : step.output}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {msg.componentsUsed && msg.componentsUsed.length > 0 && (
                                <div className="chat-message__components">
                                    {msg.componentsUsed.map((c, i) => (
                                        <span key={i} className="chat-message__component-tag">{c}</span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div className="chat-message chat-message--assistant">
                        <div className="chat-message__avatar">⚡</div>
                        <div className="chat-message__content">
                            <div className="chat-message__loading">
                                <div className="chat-message__loading-dots">
                                    <span></span><span></span><span></span>
                                </div>
                                <span>AI is working...</span>
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            <div className="chat-panel__input-area">
                <textarea
                    ref={inputRef}
                    className="chat-panel__input"
                    placeholder="Describe a UI you want to build..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    rows={2}
                    disabled={isLoading}
                />
                <button
                    className="chat-panel__send"
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading}
                >
                    {isLoading ? '⏳' : '→'}
                </button>
            </div>
        </div>
    );
};

export default ChatPanel;
