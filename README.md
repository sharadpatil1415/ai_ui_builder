# AI UI Builder
# Link : https://ai-ui-builder.onrender.com
An AI-powered agent that converts natural language UI intent into working React code + live preview, using a fixed, deterministic component library.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                 Frontend (React + Vite)             │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │
│  │  Chat    │  │  Code    │  │  Live Preview    │   │
│  │  Panel   │  │  Editor  │  │  (sandboxed)     │   │
│  └──────────┘  └──────────┘  └──────────────────┘   │
└─────────────────────┬───────────────────────────────┘
                      │ REST API
┌─────────────────────▼───────────────────────────────┐
│              Backend (Node.js + Express)            │
│  ┌─────────┐  ┌───────────┐  ┌───────────┐          │
│  │ Planner │→ │ Generator │→ │ Explainer │          │
│  └─────────┘  └───────────┘  └───────────┘          │
│  ┌──────────┐  ┌───────────┐  ┌──────────────┐      │
│  │ Modifier │  │ Validator │  │VersionStore │       │
│  └──────────┘  └───────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────┘
```

## 🧠 Agent Design

### Multi-Step Pipeline

| Step | Agent | Purpose |
|------|-------|---------|
| 1 | **Planner** | Interprets user intent → structured JSON plan (layout, components, props) |
| 2 | **Generator** | Converts plan → valid React code using only whitelisted components |
| 3 | **Explainer** | Explains decisions in plain English |
| 4 | **Modifier** | Incrementally modifies existing code (for iterative edits) |

All prompt templates are centralized in `server/agents/prompts.js`.

### Component Schema
The AI receives a strict schema of available components and layout classes. It may only:
- Select from 8 whitelisted components
- Use predefined CSS layout classes
- Set props as defined in the schema
- Provide content/mock data

## 🧱 Component System

8 fixed, pre-styled components — identical rendering every time:

| Component | Props |
|-----------|-------|
| `Button` | variant, size, disabled, onClick, children |
| `Card` | title, subtitle, children, footer, hoverable |
| `Input` | label, placeholder, type, value, onChange, error, helperText |
| `Table` | columns, data, striped, hoverable |
| `Modal` | isOpen, onClose, title, children, footer, size |
| `Sidebar` | items, title, collapsed |
| `Navbar` | brand, items, actions |
| `Chart` | type (bar/line/pie), data, title, height |

**Prohibited:** Inline styles, AI-generated CSS, Tailwind classes, external UI libraries, new components.

All styles live in `src/components/ui/design-system.css`.

---

## 🔒 Determinism

The system produces structurally consistent output through three layered constraints:

1. **Fixed component whitelist** — `COMPONENT_SCHEMA` in `server/agents/prompts.js` is a hardcoded string embedded into every LLM call. It defines exactly 8 components with their allowed props and 15 layout CSS classes. The LLM selects and composes from this closed set only.

2. **Planner → Generator separation** — The Planner (`server/agents/planner.js`) outputs a structured JSON plan (`{ layout, components[], reasoning, stateNeeded[] }`). The Generator (`server/agents/generator.js`) converts that plan into React code. Both steps receive the same `COMPONENT_SCHEMA`, bounding output on both sides of the pipeline.

3. **Post-generation auto-fix** — `autoFixCode()` in `server/validation.js` normalizes import paths to `'./components/ui'`, injects missing component imports by scanning for `<ComponentName` tags, and adds `React` / `useState` imports when absent. This eliminates structural variation from minor LLM formatting differences.

---

## ✅ Validation

`validateGeneratedCode()` in `server/validation.js` runs synchronously after auto-fix and before the response is sent. It performs four regex-based checks:

| Check | Mechanism |
|-------|----------|
| **Inline styles** | `/style\s*=\s*\{/g` detects JSX `style={...}` attributes. `height`, `width`, and `background` are allowed (used internally by `Chart`). Everything else is flagged. |
| **Non-whitelisted components** | `/\<([A-Z][a-zA-Z]*)/g` extracts uppercase JSX tags and checks each against `ALLOWED_COMPONENTS`. Tags not in the list (except `React`) are flagged. |
| **External imports** | `/import\s+.*from\s+['"]([^'"]+)['"]/g` extracts import paths. Non-relative paths (other than `react`) are flagged. |
| **Dangerous APIs** | `string.includes()` checks for `eval(`, `Function(`, `document.write`, and `innerHTML`. |

Flagged issues are returned in the response as `validationIssues[]` but do **not** block code delivery. The generated code is still sent to the client.

---

## 🛡️ Safety Protections

Safety operates at two levels — **input sanitization** and **output validation**.

### Input: Prompt Injection Detection

`sanitizePrompt()` in `server/validation.js` checks every user prompt against 11 regex patterns in `DANGEROUS_PATTERNS` before any LLM call:

- **Prompt injection** — `ignore all previous instructions`, `you are now`, `forget all prior`, `new instructions:`, `system prompt:`
- **Code execution** — `eval(`, `Function(`, `document.cookie`, `document.write`, `window.location`, `window.open`, `<script`
- **External import smuggling** — `/import\s+.*from\s+['"][^.]/i` blocks imports from non-relative paths

Matching prompts are rejected with HTTP 400. The prompt never reaches the LLM.

### Output: Code-Level Validation

`validateGeneratedCode()` (see above) acts as a second layer, flagging dangerous patterns in LLM-generated code.

### Pipeline-Level Guards

- **Input type checking** — prompts must be a non-empty string
- **API key validation** — requests fail with HTTP 500 if `GEMINI_API_KEY` is not set
- **Request size limit** — Express JSON body parser caps payloads at 1MB

---

## 🔄 Incremental Modification

The `/api/modify` endpoint runs a separate pipeline from initial generation:

```
Existing Code + User Request → Modifier Agent → Auto-Fix → Validate → Explainer
```

1. **Code resolution** — The server reads `currentCode` from the request body. If absent, it falls back to `getLatestVersion(sessionId).code` from the version store. If neither exists, it returns HTTP 400.

2. **Modifier prompt construction** — `MODIFIER_PROMPT` in `server/agents/prompts.js` embeds the current code via `{{CURRENT_CODE}}` template replacement and appends the user's modification request. The prompt enforces:
   - `"Make INCREMENTAL changes — do NOT rewrite from scratch"`
   - `"PRESERVE existing components and their props unless explicitly asked to change them"`
   - `"ONLY add/remove/modify what the user requests"`
   - `"Keep the same import structure"` / `"Maintain all existing state and handlers"`

3. **Post-processing** — Modified code passes through the same `autoFixCode()` → `validateGeneratedCode()` pipeline, then is stored as a new version.

Modification is prompt-engineered, not diff-based. The LLM receives the full current code and returns the full modified code.

---

## 📦 Versioning & Rollback

`server/versionStore.js` manages version history using an in-memory `Map<sessionId, Session>` structure:

```
sessions: Map {
  "uuid-abc" → {
    createdAt: "2025-01-15T...",
    versions: [
      { id: 1, code, plan, explanation, userPrompt, componentsUsed, timestamp },
      { id: 2, code, plan, explanation, userPrompt, componentsUsed, timestamp },
      ...
    ]
  }
}
```

### Implementation details:

- **Sequential IDs** — Each version's `id` is `session.versions.length + 1`.
- **Auto-session creation** — `addVersion()` lazily calls `createSession()` for unknown session IDs.
- **Every generate/modify appends** — Both `/api/generate` and `/api/modify` call `addVersion()` after processing, storing the full code, plan, explanation, prompt, and component list.
- **Append-only rollback** — `rollbackToVersion()` does not delete later versions. It copies the target version's `code`, `plan`, and `componentsUsed` into a new version entry with a `[Rollback]` label. Full history is preserved.
- **Lightweight listing** — `getVersions()` returns only `{ id, userPrompt, timestamp, componentsUsed }`, omitting full code/plan payloads.

### API Endpoints:

| Endpoint | Method | Description |
|----------|--------|------------|
| `/api/versions/:sessionId` | GET | Lists all version summaries for a session |
| `/api/version/:sessionId/:versionId` | GET | Returns full version data including code |
| `/api/rollback` | POST | Creates a new version by copying the target version's state |

> **Note:** The version store is in-memory. All history resets on server restart.

---

## ⚖️ Engineering Tradeoffs

| Decision | Implementation | Rationale | Trade-off |
|----------|---------------|-----------|----------|
| **Prompt-engineered modification** | Modifier receives full code + instruction, returns full code | Simpler than AST diffing; full LLM contextual awareness | No structural diff guarantee; LLM may alter unrelated code |
| **Non-blocking validation** | `validationIssues` returned alongside code | Prevents UX breakage for minor issues | Invalid code can reach the preview |
| **In-memory version store** | `Map` in Node.js process memory | Zero setup, instant access | Data lost on restart; unbounded memory growth |
| **Sequential pipeline** | Plan → Generate → Explain (serial) | Each step depends on the previous step's output | 3 serial LLM calls for generate, 2 for modify |
| **Fixed 8-component library** | Pre-styled, closed component set | Deterministic rendering, zero CSS conflicts | Limited UI expressiveness |
| **Regex-based safety** | Pattern matching for prompt injection | Fast, zero-dependency, auditable | No semantic understanding; bypassable with creative prompting |
| **Auto-fix over rejection** | `autoFixCode()` silently corrects common issues | Users see working code instead of errors | May mask prompt engineering problems |
| **Append-only rollback** | Rolling back creates a new version entry | Full audit trail; supports "undo the undo" | Version list grows monotonically |

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- A Google Gemini API key 

### Setup

```bash
# 1. Clone and install frontend deps
npm install

# 2. Install backend deps
cd server && npm install && cd ..

# 3. Add your API key
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY

# 4. Start the backend (terminal 1)
cd server && npm run dev

# 5. Start the frontend (terminal 2)
npm run dev
```

Open http://localhost:5173 and start describing UIs!

---

## ⚠️ Known Limitations

- **In-memory version store** — All session and version data lives in a Node.js `Map`. Restarting the server clears all history. There is no database or file-system persistence.
- **8 components only** — The UI library is fixed at Button, Card, Input, Table, Modal, Sidebar, Navbar, and Chart. The system cannot produce components outside this set.
- **No responsive design control** — Generated layouts use predefined CSS classes. There is no mechanism for the user to specify breakpoints or mobile-specific layouts.
- **No authentication or multi-user support** — Any client can access any session by ID. There are no user accounts, access control, or rate limiting.
- **LLM-dependent modification accuracy** — The Modifier agent is prompt-engineered, not AST-based. It may unintentionally alter unrelated code when making incremental changes.
- **Regex-based safety only** — Prompt injection detection relies on pattern matching. It has no semantic understanding and can be bypassed with sufficiently creative input.
- **No streaming responses** — All LLM calls are blocking. The client waits for the full pipeline (2–3 serial LLM calls) to complete before receiving any output.
- **Single model dependency** — The system uses `gemini-flash-latest` exclusively. There is no fallback model or provider switching.
- **No test suite** — The project has no automated unit or integration tests.
