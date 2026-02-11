import React, { useEffect, useRef, useState } from 'react';

// Build the HTML document that will be injected into the iframe
function buildPreviewHTML(code) {
    // Extract component names used
    const componentNames = ['Button', 'Card', 'Input', 'Table', 'Modal', 'Sidebar', 'Navbar', 'Chart'];
    const usedComponents = componentNames.filter(name =>
        code.includes(`<${name}`) || code.includes(`{${name}`)
    );

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <script src="https://unpkg.com/react@18/umd/react.development.js"><\/script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"><\/script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"><\/script>
  <style>
    ${getDesignSystemCSS()}

    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', sans-serif;
      background: var(--color-neutral-950);
      color: var(--color-neutral-200);
      min-height: 100vh;
    }
    #preview-root {
      min-height: 100vh;
    }
  </style>
</head>
<body>
  <div id="preview-root"></div>
  <script type="text/babel">
    const { useState, useEffect, useRef } = React;

    ${getComponentDefinitions()}

    // User-generated component
    ${stripImportsAndExports(code)}

    // Render
    const root = ReactDOM.createRoot(document.getElementById('preview-root'));
    root.render(React.createElement(GeneratedUI));
  </script>
</body>
</html>`;
}

function stripImportsAndExports(code) {
    let cleaned = code
        // Remove import statements
        .replace(/^import\s+.*?['"]\s*;?\s*$/gm, '')
        // Replace export default with assignment
        .replace(/export\s+default\s+function\s+(\w+)/g, 'function GeneratedUI')
        .replace(/export\s+default\s+(\w+)\s*;?\s*$/gm, 'var GeneratedUI = $1;')
        // Handle const/function exports
        .replace(/export\s+default\s+/g, 'var GeneratedUI = ');

    // If no GeneratedUI was assigned, find the main component
    if (!cleaned.includes('GeneratedUI')) {
        // Try to find the last function/const component definition
        const funcMatch = cleaned.match(/(?:function|const)\s+(\w+)\s*(?:=|\()/g);
        if (funcMatch) {
            const lastName = funcMatch[funcMatch.length - 1].match(/(?:function|const)\s+(\w+)/)[1];
            cleaned += `\nvar GeneratedUI = ${lastName};`;
        } else {
            cleaned = `function GeneratedUI() { return React.createElement('div', {className: 'ui-layout-page ui-flex-center'}, React.createElement('p', null, 'No component found in generated code')); }`;
        }
    }

    return cleaned;
}

function getDesignSystemCSS() {
    // Inline the design system CSS for the iframe
    return `
:root {
  --color-primary-50: #eff6ff;
  --color-primary-100: #dbeafe;
  --color-primary-200: #bfdbfe;
  --color-primary-300: #93c5fd;
  --color-primary-400: #60a5fa;
  --color-primary-500: #3b82f6;
  --color-primary-600: #2563eb;
  --color-primary-700: #1d4ed8;
  --color-neutral-50: #f8fafc;
  --color-neutral-100: #f1f5f9;
  --color-neutral-200: #e2e8f0;
  --color-neutral-300: #cbd5e1;
  --color-neutral-400: #94a3b8;
  --color-neutral-500: #64748b;
  --color-neutral-600: #475569;
  --color-neutral-700: #334155;
  --color-neutral-800: #1e293b;
  --color-neutral-900: #0f172a;
  --color-neutral-950: #020617;
  --color-success: #22c55e;
  --color-warning: #f59e0b;
  --color-danger: #ef4444;
  --color-info: #06b6d4;
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  --text-xs: 0.75rem; --text-sm: 0.875rem; --text-base: 1rem; --text-lg: 1.125rem;
  --text-xl: 1.25rem; --text-2xl: 1.5rem; --text-3xl: 1.875rem;
  --space-1: 0.25rem; --space-2: 0.5rem; --space-3: 0.75rem; --space-4: 1rem;
  --space-5: 1.25rem; --space-6: 1.5rem; --space-8: 2rem; --space-10: 2.5rem; --space-12: 3rem;
  --radius-sm: 0.375rem; --radius-md: 0.5rem; --radius-lg: 0.75rem; --radius-xl: 1rem; --radius-full: 9999px;
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.15);
  --shadow-md: 0 4px 6px -1px rgba(0,0,0,0.2), 0 2px 4px -2px rgba(0,0,0,0.15);
  --shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.25), 0 4px 6px -4px rgba(0,0,0,0.15);
  --shadow-xl: 0 20px 25px -5px rgba(0,0,0,0.3), 0 8px 10px -6px rgba(0,0,0,0.2);
  --transition-fast: 150ms ease; --transition-normal: 250ms ease; --transition-slow: 350ms ease;
}

.ui-btn { font-family: var(--font-sans); font-weight: 500; border: none; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: var(--space-2); transition: all var(--transition-fast); border-radius: var(--radius-md); line-height: 1; white-space: nowrap; }
.ui-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.ui-btn--sm { padding: var(--space-2) var(--space-3); font-size: var(--text-sm); }
.ui-btn--md { padding: var(--space-2) var(--space-4); font-size: var(--text-base); height: 38px; }
.ui-btn--lg { padding: var(--space-3) var(--space-6); font-size: var(--text-lg); height: 46px; }
.ui-btn--primary { background: linear-gradient(135deg, var(--color-primary-500), var(--color-primary-600)); color: #fff; box-shadow: 0 2px 8px rgba(59,130,246,0.35); }
.ui-btn--primary:hover:not(:disabled) { background: linear-gradient(135deg, var(--color-primary-400), var(--color-primary-500)); box-shadow: 0 4px 14px rgba(59,130,246,0.45); transform: translateY(-1px); }
.ui-btn--secondary { background: var(--color-neutral-700); color: var(--color-neutral-100); }
.ui-btn--secondary:hover:not(:disabled) { background: var(--color-neutral-600); }
.ui-btn--outline { background: transparent; color: var(--color-primary-400); border: 1.5px solid var(--color-primary-500); }
.ui-btn--outline:hover:not(:disabled) { background: rgba(59,130,246,0.1); }
.ui-btn--danger { background: linear-gradient(135deg, var(--color-danger), #dc2626); color: #fff; box-shadow: 0 2px 8px rgba(239,68,68,0.3); }
.ui-btn--danger:hover:not(:disabled) { box-shadow: 0 4px 14px rgba(239,68,68,0.45); transform: translateY(-1px); }
.ui-btn--ghost { background: transparent; color: var(--color-neutral-300); }
.ui-btn--ghost:hover:not(:disabled) { background: var(--color-neutral-800); color: var(--color-neutral-100); }

.ui-card { background: var(--color-neutral-800); border: 1px solid var(--color-neutral-700); border-radius: var(--radius-lg); overflow: hidden; transition: all var(--transition-normal); }
.ui-card--hoverable:hover { border-color: var(--color-primary-500); box-shadow: var(--shadow-lg); transform: translateY(-2px); }
.ui-card__header { padding: var(--space-5) var(--space-6); border-bottom: 1px solid var(--color-neutral-700); }
.ui-card__title { font-family: var(--font-sans); font-size: var(--text-lg); font-weight: 600; color: var(--color-neutral-50); margin: 0; }
.ui-card__subtitle { font-family: var(--font-sans); font-size: var(--text-sm); color: var(--color-neutral-400); margin-top: var(--space-1); }
.ui-card__body { padding: var(--space-5) var(--space-6); color: var(--color-neutral-200); font-family: var(--font-sans); font-size: var(--text-base); }
.ui-card__footer { padding: var(--space-4) var(--space-6); border-top: 1px solid var(--color-neutral-700); background: rgba(0,0,0,0.15); }

.ui-input-group { display: flex; flex-direction: column; gap: var(--space-1); }
.ui-input-label { font-family: var(--font-sans); font-size: var(--text-sm); font-weight: 500; color: var(--color-neutral-300); }
.ui-input { font-family: var(--font-sans); font-size: var(--text-base); padding: var(--space-2) var(--space-3); background: var(--color-neutral-900); border: 1.5px solid var(--color-neutral-600); border-radius: var(--radius-md); color: var(--color-neutral-100); transition: all var(--transition-fast); height: 40px; outline: none; }
.ui-input::placeholder { color: var(--color-neutral-500); }
.ui-input:focus { border-color: var(--color-primary-500); box-shadow: 0 0 0 3px rgba(59,130,246,0.15); }
.ui-input--error { border-color: var(--color-danger); }
.ui-input:disabled { opacity: 0.5; cursor: not-allowed; }
.ui-input-helper { font-family: var(--font-sans); font-size: var(--text-xs); color: var(--color-neutral-400); }
.ui-input-error-text { font-family: var(--font-sans); font-size: var(--text-xs); color: var(--color-danger); }

.ui-table-wrapper { overflow-x: auto; border-radius: var(--radius-lg); border: 1px solid var(--color-neutral-700); }
.ui-table { width: 100%; border-collapse: collapse; font-family: var(--font-sans); font-size: var(--text-sm); }
.ui-table th { text-align: left; padding: var(--space-3) var(--space-4); background: var(--color-neutral-800); color: var(--color-neutral-300); font-weight: 600; text-transform: uppercase; font-size: var(--text-xs); letter-spacing: 0.05em; border-bottom: 1px solid var(--color-neutral-700); }
.ui-table td { padding: var(--space-3) var(--space-4); color: var(--color-neutral-200); border-bottom: 1px solid var(--color-neutral-700); }
.ui-table--striped tbody tr:nth-child(even) { background: rgba(0,0,0,0.15); }
.ui-table--hoverable tbody tr:hover { background: rgba(59,130,246,0.06); }

.ui-modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; animation: ui-fade-in 0.2s ease; }
.ui-modal { background: var(--color-neutral-800); border: 1px solid var(--color-neutral-700); border-radius: var(--radius-xl); box-shadow: var(--shadow-xl); animation: ui-scale-in 0.2s ease; max-height: 85vh; display: flex; flex-direction: column; }
.ui-modal--sm { width: 400px; } .ui-modal--md { width: 560px; } .ui-modal--lg { width: 720px; }
.ui-modal__header { display: flex; align-items: center; justify-content: space-between; padding: var(--space-5) var(--space-6); border-bottom: 1px solid var(--color-neutral-700); }
.ui-modal__title { font-family: var(--font-sans); font-size: var(--text-lg); font-weight: 600; color: var(--color-neutral-50); margin: 0; }
.ui-modal__close { background: none; border: none; color: var(--color-neutral-400); font-size: var(--text-xl); cursor: pointer; padding: var(--space-1); border-radius: var(--radius-sm); transition: all var(--transition-fast); display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; }
.ui-modal__close:hover { background: var(--color-neutral-700); color: var(--color-neutral-100); }
.ui-modal__body { padding: var(--space-5) var(--space-6); overflow-y: auto; color: var(--color-neutral-200); font-family: var(--font-sans); }
.ui-modal__footer { padding: var(--space-4) var(--space-6); border-top: 1px solid var(--color-neutral-700); display: flex; gap: var(--space-3); justify-content: flex-end; }

.ui-sidebar { background: var(--color-neutral-900); border-right: 1px solid var(--color-neutral-700); display: flex; flex-direction: column; height: 100%; transition: width var(--transition-normal); }
.ui-sidebar--expanded { width: 260px; } .ui-sidebar--collapsed { width: 64px; }
.ui-sidebar__title { font-family: var(--font-sans); font-size: var(--text-sm); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--color-neutral-400); padding: var(--space-5) var(--space-4); }
.ui-sidebar__nav { display: flex; flex-direction: column; gap: var(--space-1); padding: 0 var(--space-2); flex: 1; }
.ui-sidebar__item { display: flex; align-items: center; gap: var(--space-3); padding: var(--space-2) var(--space-3); border-radius: var(--radius-md); color: var(--color-neutral-400); font-family: var(--font-sans); font-size: var(--text-sm); font-weight: 500; cursor: pointer; border: none; background: none; width: 100%; text-align: left; transition: all var(--transition-fast); }
.ui-sidebar__item:hover { background: var(--color-neutral-800); color: var(--color-neutral-200); }
.ui-sidebar__item--active { background: rgba(59,130,246,0.12); color: var(--color-primary-400); }
.ui-sidebar__item-icon { font-size: var(--text-lg); width: 24px; text-align: center; flex-shrink: 0; }

.ui-navbar { display: flex; align-items: center; justify-content: space-between; padding: 0 var(--space-6); height: 56px; background: var(--color-neutral-900); border-bottom: 1px solid var(--color-neutral-700); font-family: var(--font-sans); }
.ui-navbar__brand { font-size: var(--text-lg); font-weight: 700; color: var(--color-neutral-50); display: flex; align-items: center; gap: var(--space-2); }
.ui-navbar__links { display: flex; align-items: center; gap: var(--space-1); list-style: none; margin: 0; padding: 0; }
.ui-navbar__link { padding: var(--space-2) var(--space-3); border-radius: var(--radius-md); font-size: var(--text-sm); font-weight: 500; color: var(--color-neutral-400); text-decoration: none; cursor: pointer; transition: all var(--transition-fast); }
.ui-navbar__link:hover { color: var(--color-neutral-100); background: var(--color-neutral-800); }
.ui-navbar__link--active { color: var(--color-primary-400); background: rgba(59,130,246,0.1); }
.ui-navbar__actions { display: flex; align-items: center; gap: var(--space-2); }

.ui-chart { background: var(--color-neutral-800); border: 1px solid var(--color-neutral-700); border-radius: var(--radius-lg); padding: var(--space-5) var(--space-6); font-family: var(--font-sans); }
.ui-chart__title { font-size: var(--text-base); font-weight: 600; color: var(--color-neutral-50); margin-bottom: var(--space-4); }
.ui-chart__container { position: relative; display: flex; align-items: flex-end; gap: var(--space-2); }
.ui-chart__bar-group { display: flex; flex-direction: column; align-items: center; flex: 1; gap: var(--space-1); }
.ui-chart__bar { width: 100%; max-width: 48px; border-radius: var(--radius-sm) var(--radius-sm) 0 0; background: linear-gradient(to top, var(--color-primary-600), var(--color-primary-400)); transition: all var(--transition-normal); min-height: 4px; }
.ui-chart__bar:hover { background: linear-gradient(to top, var(--color-primary-500), var(--color-primary-300)); filter: brightness(1.1); }
.ui-chart__bar-label { font-size: var(--text-xs); color: var(--color-neutral-400); text-align: center; white-space: nowrap; }
.ui-chart__bar-value { font-size: var(--text-xs); color: var(--color-neutral-300); font-weight: 500; }
.ui-chart__pie-container { display: flex; align-items: center; gap: var(--space-8); }
.ui-chart__pie { width: 160px; height: 160px; border-radius: 50%; flex-shrink: 0; }
.ui-chart__legend { display: flex; flex-direction: column; gap: var(--space-2); }
.ui-chart__legend-item { display: flex; align-items: center; gap: var(--space-2); font-size: var(--text-sm); color: var(--color-neutral-300); }
.ui-chart__legend-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.ui-chart__line-container { position: relative; }
.ui-chart__line-svg { width: 100%; overflow: visible; }
.ui-chart__line-path { fill: none; stroke: var(--color-primary-500); stroke-width: 2.5; stroke-linecap: round; stroke-linejoin: round; }
.ui-chart__line-area { fill: url(#lineGradient); opacity: 0.3; }
.ui-chart__line-dot { fill: var(--color-primary-400); stroke: var(--color-neutral-800); stroke-width: 2; }
.ui-chart__line-labels { display: flex; justify-content: space-between; margin-top: var(--space-2); }
.ui-chart__line-label { font-size: var(--text-xs); color: var(--color-neutral-400); }

@keyframes ui-fade-in { from { opacity: 0; } to { opacity: 1; } }
@keyframes ui-scale-in { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }

.ui-layout-row { display: flex; gap: var(--space-4); }
.ui-layout-col { display: flex; flex-direction: column; gap: var(--space-4); }
.ui-layout-grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--space-4); }
.ui-layout-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-4); }
.ui-layout-grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--space-4); }
.ui-layout-main-with-sidebar { display: flex; height: 100%; }
.ui-layout-main-content { flex: 1; overflow-y: auto; padding: var(--space-6); }
.ui-layout-page { display: flex; flex-direction: column; min-height: 100%; background: var(--color-neutral-950); color: var(--color-neutral-200); }
.ui-layout-section { padding: var(--space-6); }
.ui-spacer { flex: 1; }
.ui-text-muted { color: var(--color-neutral-400); }
.ui-text-center { text-align: center; }
.ui-text-right { text-align: right; }
.ui-flex-center { display: flex; align-items: center; justify-content: center; }
.ui-flex-between { display: flex; align-items: center; justify-content: space-between; }
  `;
}

function getComponentDefinitions() {
    return `
    // ===== Fixed Component Definitions =====
    const Button = ({ variant = 'primary', size = 'md', disabled = false, onClick, children }) => {
      const className = 'ui-btn ui-btn--' + variant + ' ui-btn--' + size;
      return React.createElement('button', { className, disabled, onClick }, children);
    };

    const Card = ({ title, subtitle, children, footer, hoverable = false }) => {
      const className = 'ui-card' + (hoverable ? ' ui-card--hoverable' : '');
      return React.createElement('div', { className },
        (title || subtitle) && React.createElement('div', { className: 'ui-card__header' },
          title && React.createElement('h3', { className: 'ui-card__title' }, title),
          subtitle && React.createElement('p', { className: 'ui-card__subtitle' }, subtitle)
        ),
        React.createElement('div', { className: 'ui-card__body' }, children),
        footer && React.createElement('div', { className: 'ui-card__footer' }, footer)
      );
    };

    const Input = ({ label, placeholder, type = 'text', value, onChange, error, helperText, disabled = false }) => {
      const inputClass = 'ui-input' + (error ? ' ui-input--error' : '');
      return React.createElement('div', { className: 'ui-input-group' },
        label && React.createElement('label', { className: 'ui-input-label' }, label),
        React.createElement('input', { className: inputClass, type, placeholder, value, onChange, disabled }),
        error && React.createElement('span', { className: 'ui-input-error-text' }, error),
        helperText && !error && React.createElement('span', { className: 'ui-input-helper' }, helperText)
      );
    };

    const Table = ({ columns = [], data = [], striped = false, hoverable = false }) => {
      const tableClass = 'ui-table' + (striped ? ' ui-table--striped' : '') + (hoverable ? ' ui-table--hoverable' : '');
      return React.createElement('div', { className: 'ui-table-wrapper' },
        React.createElement('table', { className: tableClass },
          React.createElement('thead', null,
            React.createElement('tr', null,
              columns.map((col) => React.createElement('th', { key: col.key, style: col.width ? { width: col.width } : undefined }, col.label))
            )
          ),
          React.createElement('tbody', null,
            data.map((row, index) =>
              React.createElement('tr', { key: index },
                columns.map((col) => React.createElement('td', { key: col.key }, row[col.key]))
              )
            )
          )
        )
      );
    };

    const Modal = ({ isOpen, onClose, title, children, footer, size = 'md' }) => {
      if (!isOpen) return null;
      return React.createElement('div', { className: 'ui-modal-overlay', onClick: onClose },
        React.createElement('div', { className: 'ui-modal ui-modal--' + size, onClick: (e) => e.stopPropagation() },
          React.createElement('div', { className: 'ui-modal__header' },
            React.createElement('h3', { className: 'ui-modal__title' }, title),
            React.createElement('button', { className: 'ui-modal__close', onClick: onClose }, '✕')
          ),
          React.createElement('div', { className: 'ui-modal__body' }, children),
          footer && React.createElement('div', { className: 'ui-modal__footer' }, footer)
        )
      );
    };

    const Sidebar = ({ items = [], title, collapsed = false }) => {
      const sidebarClass = 'ui-sidebar ' + (collapsed ? 'ui-sidebar--collapsed' : 'ui-sidebar--expanded');
      return React.createElement('aside', { className: sidebarClass },
        title && !collapsed && React.createElement('div', { className: 'ui-sidebar__title' }, title),
        React.createElement('nav', { className: 'ui-sidebar__nav' },
          items.map((item, index) =>
            React.createElement('button', {
              key: index,
              className: 'ui-sidebar__item' + (item.active ? ' ui-sidebar__item--active' : ''),
              onClick: item.onClick
            },
              item.icon && React.createElement('span', { className: 'ui-sidebar__item-icon' }, item.icon),
              !collapsed && React.createElement('span', null, item.label)
            )
          )
        )
      );
    };

    const Navbar = ({ brand, items = [], actions }) => {
      return React.createElement('nav', { className: 'ui-navbar' },
        React.createElement('div', { className: 'ui-navbar__brand' }, brand),
        React.createElement('ul', { className: 'ui-navbar__links' },
          items.map((item, index) =>
            React.createElement('li', { key: index },
              React.createElement('a', {
                className: 'ui-navbar__link' + (item.active ? ' ui-navbar__link--active' : ''),
                href: item.href || '#',
                onClick: item.onClick
              }, item.label)
            )
          )
        ),
        actions && React.createElement('div', { className: 'ui-navbar__actions' }, actions)
      );
    };

    const CHART_COLORS = ['var(--color-primary-500)', 'var(--color-success)', 'var(--color-warning)', 'var(--color-danger)', 'var(--color-info)', 'var(--color-primary-300)', '#a78bfa', '#f472b6'];

    const Chart = ({ type = 'bar', data = [], title, height = 200 }) => {
      const renderBar = () => {
        const max = Math.max(...data.map(d => d.value), 1);
        return React.createElement('div', { className: 'ui-chart__container', style: { height } },
          data.map((item, i) =>
            React.createElement('div', { key: i, className: 'ui-chart__bar-group', style: { height: '100%' } },
              React.createElement('span', { className: 'ui-chart__bar-value' }, item.value),
              React.createElement('div', { className: 'ui-chart__bar', style: { height: (item.value / max * 100) + '%' } }),
              React.createElement('span', { className: 'ui-chart__bar-label' }, item.label)
            )
          )
        );
      };

      const renderPie = () => {
        const total = data.reduce((sum, d) => sum + d.value, 0) || 1;
        let cumulative = 0;
        const segments = data.map((d, i) => {
          const start = cumulative;
          cumulative += (d.value / total) * 360;
          return { ...d, start, end: cumulative, color: CHART_COLORS[i % CHART_COLORS.length] };
        });
        const gradient = segments.map(s => s.color + ' ' + s.start + 'deg ' + s.end + 'deg').join(', ');
        return React.createElement('div', { className: 'ui-chart__pie-container' },
          React.createElement('div', { className: 'ui-chart__pie', style: { background: 'conic-gradient(' + gradient + ')' } }),
          React.createElement('div', { className: 'ui-chart__legend' },
            segments.map((s, i) =>
              React.createElement('div', { key: i, className: 'ui-chart__legend-item' },
                React.createElement('div', { className: 'ui-chart__legend-dot', style: { background: s.color } }),
                React.createElement('span', null, s.label + ': ' + s.value)
              )
            )
          )
        );
      };

      const renderLine = () => {
        const max = Math.max(...data.map(d => d.value), 1);
        const padding = 20;
        const w = 400;
        const h = height;
        const points = data.map((d, i) => ({
          x: padding + (i / (data.length - 1 || 1)) * (w - padding * 2),
          y: h - padding - ((d.value / max) * (h - padding * 2)),
        }));
        const pathD = points.map((p, i) => (i === 0 ? 'M' : 'L') + ' ' + p.x + ' ' + p.y).join(' ');
        const areaD = pathD + ' L ' + points[points.length - 1].x + ' ' + (h - padding) + ' L ' + points[0].x + ' ' + (h - padding) + ' Z';
        return React.createElement('div', { className: 'ui-chart__line-container' },
          React.createElement('svg', { className: 'ui-chart__line-svg', viewBox: '0 0 ' + w + ' ' + h, style: { height } },
            React.createElement('defs', null,
              React.createElement('linearGradient', { id: 'lineGradient', x1: '0', y1: '0', x2: '0', y2: '1' },
                React.createElement('stop', { offset: '0%', stopColor: 'var(--color-primary-500)' }),
                React.createElement('stop', { offset: '100%', stopColor: 'transparent' })
              )
            ),
            React.createElement('path', { className: 'ui-chart__line-area', d: areaD }),
            React.createElement('path', { className: 'ui-chart__line-path', d: pathD }),
            points.map((p, i) => React.createElement('circle', { key: i, className: 'ui-chart__line-dot', cx: p.x, cy: p.y, r: 4 }))
          ),
          React.createElement('div', { className: 'ui-chart__line-labels' },
            data.map((d, i) => React.createElement('span', { key: i, className: 'ui-chart__line-label' }, d.label))
          )
        );
      };

      return React.createElement('div', { className: 'ui-chart' },
        title && React.createElement('div', { className: 'ui-chart__title' }, title),
        type === 'bar' && renderBar(),
        type === 'pie' && renderPie(),
        type === 'line' && renderLine()
      );
    };
  `;
}

const PreviewPanel = ({ code }) => {
    const iframeRef = useRef(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!code || !iframeRef.current) {
            return;
        }

        setError(null);

        try {
            const html = buildPreviewHTML(code);
            const blob = new Blob([html], { type: 'text/html' });
            const url = URL.createObjectURL(blob);

            iframeRef.current.src = url;

            return () => URL.revokeObjectURL(url);
        } catch (err) {
            setError(err.message);
        }
    }, [code]);

    return (
        <div className="preview-panel">
            <div className="preview-panel__header">
                <span className="preview-panel__title">👁️ Live Preview</span>
                <div className="preview-panel__actions">
                    <button
                        className="preview-panel__action-btn"
                        onClick={() => {
                            if (iframeRef.current) {
                                const html = buildPreviewHTML(code);
                                const blob = new Blob([html], { type: 'text/html' });
                                const url = URL.createObjectURL(blob);
                                iframeRef.current.src = url;
                            }
                        }}
                    >
                        🔄 Refresh
                    </button>
                </div>
            </div>
            {error ? (
                <div className="preview-panel__error">
                    <span>⚠️ Preview Error</span>
                    <p>{error}</p>
                </div>
            ) : (
                <iframe
                    ref={iframeRef}
                    className="preview-panel__iframe"
                    title="UI Preview"
                    sandbox="allow-scripts"
                />
            )}
        </div>
    );
};

export default PreviewPanel;
