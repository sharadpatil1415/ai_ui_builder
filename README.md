# AI UI Builder

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

