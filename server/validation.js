// ============================================================
// Validation & Safety Layer
// ============================================================

const ALLOWED_COMPONENTS = [
    'Button', 'Card', 'Input', 'Table', 'Modal', 'Sidebar', 'Navbar', 'Chart'
];

const ALLOWED_LAYOUT_CLASSES = [
    'ui-layout-row', 'ui-layout-col', 'ui-layout-grid-2', 'ui-layout-grid-3',
    'ui-layout-grid-4', 'ui-layout-main-with-sidebar', 'ui-layout-main-content',
    'ui-layout-page', 'ui-layout-section', 'ui-spacer', 'ui-text-muted',
    'ui-text-center', 'ui-text-right', 'ui-flex-center', 'ui-flex-between'
];

// Dangerous patterns for prompt injection protection
const DANGEROUS_PATTERNS = [
    /ignore\s+(all\s+)?(previous|above|prior)\s+(instructions|prompts|rules)/i,
    /you\s+are\s+now\s+/i,
    /forget\s+(all\s+)?(previous|above|prior)/i,
    /new\s+instructions?\s*:/i,
    /system\s*prompt\s*:/i,
    /\beval\s*\(/i,
    /\bFunction\s*\(/i,
    /document\.(cookie|domain|write)/i,
    /window\.(location|open)/i,
    /<script/i,
    /import\s+.*from\s+['"][^.]/i,  // external imports (not relative)
];

/**
 * Check if user prompt contains prompt injection attempts
 */
export function sanitizePrompt(prompt) {
    for (const pattern of DANGEROUS_PATTERNS) {
        if (pattern.test(prompt)) {
            return {
                safe: false,
                reason: `Potential unsafe pattern detected: ${pattern.source}`
            };
        }
    }
    return { safe: true };
}

/**
 * Validate generated code uses only whitelisted components
 */
export function validateGeneratedCode(code) {
    const issues = [];

    // Check for inline styles
    const styleAttrRegex = /style\s*=\s*\{/g;
    if (styleAttrRegex.test(code)) {
        // Allow style only for dynamic heights in charts (which we use internally)
        const styleMatches = code.match(/style\s*=\s*\{[^}]*\}/g) || [];
        for (const match of styleMatches) {
            if (!match.includes('height') && !match.includes('width') && !match.includes('background')) {
                issues.push(`Inline style detected: ${match.substring(0, 50)}...`);
            }
        }
    }

    // Check for non-whitelisted component usage (JSX tags starting with uppercase)
    const jsxTagRegex = /<([A-Z][a-zA-Z]*)/g;
    let match;
    while ((match = jsxTagRegex.exec(code)) !== null) {
        const tagName = match[1];
        if (!ALLOWED_COMPONENTS.includes(tagName) && tagName !== 'React') {
            issues.push(`Non-whitelisted component used: <${tagName}>`);
        }
    }

    // Check for external library imports
    const importRegex = /import\s+.*from\s+['"]([^'"]+)['"]/g;
    while ((match = importRegex.exec(code)) !== null) {
        const importPath = match[1];
        if (!importPath.startsWith('.') && importPath !== 'react') {
            issues.push(`External import detected: ${importPath}`);
        }
    }

    // Check for dangerous APIs
    const dangerousAPIs = ['eval(', 'Function(', 'document.write', 'innerHTML'];
    for (const api of dangerousAPIs) {
        if (code.includes(api)) {
            issues.push(`Dangerous API usage: ${api}`);
        }
    }

    return {
        valid: issues.length === 0,
        issues
    };
}

/**
 * Auto-fix common issues in generated code
 */
export function autoFixCode(code) {
    let fixed = code;

    // Ensure correct import path
    fixed = fixed.replace(
        /import\s*\{([^}]+)\}\s*from\s*['"][^'"]*components\/ui[^'"]*['"]/g,
        "import {$1} from './components/ui'"
    );

    // If no import statement present, add it
    if (!fixed.includes("from './components/ui'") && !fixed.includes('from "./components/ui"')) {
        const usedComponents = ALLOWED_COMPONENTS.filter(c => fixed.includes(`<${c}`));
        if (usedComponents.length > 0) {
            fixed = `import { ${usedComponents.join(', ')} } from './components/ui';\n` + fixed;
        }
    }

    // Ensure React import for useState
    if (fixed.includes('useState') && !fixed.includes("import React") && !fixed.includes("from 'react'")) {
        fixed = "import React, { useState } from 'react';\n" + fixed;
    } else if (!fixed.includes("import React")) {
        fixed = "import React from 'react';\n" + fixed;
    }

    return fixed;
}
