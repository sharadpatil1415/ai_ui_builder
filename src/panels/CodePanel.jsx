import React, { useRef, useEffect } from 'react';
import { EditorView, basicSetup } from 'codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';
import { EditorState } from '@codemirror/state';

const CodePanel = ({ code, onChange }) => {
    const editorRef = useRef(null);
    const viewRef = useRef(null);
    const isInternalUpdate = useRef(false);

    useEffect(() => {
        if (!editorRef.current) return;

        const updateListener = EditorView.updateListener.of((update) => {
            if (update.docChanged && !isInternalUpdate.current) {
                const newCode = update.state.doc.toString();
                onChange?.(newCode);
            }
        });

        const state = EditorState.create({
            doc: code || '// Generated code will appear here...',
            extensions: [
                basicSetup,
                javascript({ jsx: true }),
                oneDark,
                updateListener,
                EditorView.theme({
                    '&': {
                        height: '100%',
                        fontSize: '13px',
                    },
                    '.cm-scroller': {
                        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                    },
                    '.cm-content': {
                        padding: '12px 0',
                    },
                }),
            ],
        });

        const view = new EditorView({
            state,
            parent: editorRef.current,
        });

        viewRef.current = view;

        return () => {
            view.destroy();
        };
    }, []);

    // Update editor content when code prop changes from outside
    useEffect(() => {
        if (viewRef.current && code !== undefined) {
            const currentContent = viewRef.current.state.doc.toString();
            if (currentContent !== code) {
                isInternalUpdate.current = true;
                viewRef.current.dispatch({
                    changes: {
                        from: 0,
                        to: currentContent.length,
                        insert: code,
                    },
                });
                isInternalUpdate.current = false;
            }
        }
    }, [code]);

    return (
        <div className="code-panel">
            <div className="code-panel__header">
                <span className="code-panel__title">📝 Generated Code</span>
                <div className="code-panel__actions">
                    <button
                        className="code-panel__action-btn"
                        onClick={() => navigator.clipboard.writeText(code)}
                        title="Copy code"
                    >
                        📋 Copy
                    </button>
                </div>
            </div>
            <div className="code-panel__editor" ref={editorRef} />
        </div>
    );
};

export default CodePanel;
