# User Authentication & Personalized Chat Sessions

Integrate end-to-end user authentication (Sign Up, Sign In, Sign Out, Guest / Demo Mode) and isolate conversation history, custom rule dictionaries, and model settings per user account, while expanding the Concept Lab with interactive model selection and custom system prompt testing.

## User Review & Critical Decisions

> [!IMPORTANT]
> The application will support seamless guest access so learners can experiment immediately without friction. When signing up or logging in, their guest session can automatically sync to their persistent user profile.

- **Authentication Method**: Full-stack account authentication with email/username and password, secure password hashing, session tokens, and instant 1-click Demo credentials (`alex@lab.edu` / `demo123`).
- **Data Persistence**: Server-backed user store with JSON persistence (`data/users.json`) managed via authenticated `/api/auth/*` and `/api/user/*` endpoints, with automatic client synchronization and local fallback.
- **Data Isolation**: Each user account securely stores:
  - Multi-turn conversation histories for both Rule-Based and LLM engines.
  - Custom keyword dictionary rules added via the Rule Manager.
  - Preferred Concept Lab configurations (model choice, custom system persona, temperature).

---

## 1. Overview & Core Concept

- **What It Does**: Allows students, researchers, and educators to create accounts, log in across sessions, preserve their historical experiments with chatbot architectures, and save tailored personas and custom rule-sets.
- **Target Audience**: Students, developers, and AI enthusiasts studying NLP and generative architectures who want to compare behaviors over multiple sessions.
- **Key Value**: Eliminates lost progress when testing complex prompts, custom keyword dictionaries, or parameter configurations.

---

## 2. User Experience & Visual Design

### Key User Flows
1. **Header Account Zone**: Top navigation displays user avatar, display name, and quick Auth Dropdown (Profile, Saved Sessions, Sign Out) or a clean "Sign In / Register" action button.
2. **Auth Modal**: Elegant, distraction-free modal with smooth switching between **Sign In**, **Create Account**, and **1-Click Demo Login**.
3. **Session Drawer / History Bar**: Access past conversation turns, filter by engine (Rule vs LLM), and clear or export history.
4. **Concept Lab Expansion**:
   - Model switcher between `gemini-3.8-flash`, `gemini-3.1-flash-lite`, and Local Simulator.
   - Freeform System Prompt editor with live character/token counters and domain presets.
   - Dynamic Temperature Slider with live Softmax interpretation.
   - In-lab interactive chat runner with real-time response latency and token metrics.

### Visual Identity & Theme
- **Aesthetic Direction**: High-clarity educational laboratory, following the Universal Frontend Design Constitution (60-30-10 color discipline, unboxed text metadata with `·` separators, zero pill clutter).
- **Typography**: `Plus Jakarta Sans` for clean, professional headings paired with `Inter` / `DM Sans` for body prose and `JetBrains Mono` for tabular metrics and tokens.
- **Color Palette**:
  - Dominant Neutral: Clean slate canvas (`#F8FAFC` light / `#0F172A` code viewer).
  - Structural Surfaces: Pure white card elevations with hairline slate borders (`border-slate-200`).
  - Focal Accents: Indigo (`#4F46E5`) for generative LLM states and Amber (`#D97706`) for classical deterministic rule logic.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Full-Stack Express Server Auth vs External Third-Party Cloud**
  - *Chosen Approach*: Self-contained Express authentication engine running on `server.ts` with crypto hashing, JWT session verification, and JSON-backed storage in `/data/users.json`.
  - *Why*: Instant provisioning, zero reliance on external billing/OAuth keys, works offline/in-sandbox immediately, and allows deterministic automated testing.
  - *Alternatives Considered*: Firebase Auth was considered; however, self-contained server auth provides full control over user data records without cloud provisioning blockers.

- **Decision 2: Guest-First Experience with Transparent Upgrade**
  - *Chosen Approach*: Unauthenticated visitors can chat and use all labs immediately in Guest Mode. A subtle notice offers 1-click account creation to save data permanently.
  - *Why*: Minimizes initial friction for learners while protecting user data across devices once authenticated.

---

## 4. Technical Architecture & Data Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                       React SPA Client                      │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │ Auth Context │  │ Chat History │  │ Concept Lab State │  │
│  └──────┬───────┘  └──────┬───────┘  └─────────┬─────────┘  │
└─────────┼─────────────────┼────────────────────┼────────────┘
          │ Bearer Token    │ Sync Payloads      │
          ▼                 ▼                    ▼
┌─────────────────────────────────────────────────────────────┐
│                   Express Backend (server.ts)               │
│                                                             │
│  POST /api/auth/register    -> Create account               │
│  POST /api/auth/login       -> Authenticate & issue token   │
│  GET  /api/auth/me          -> Verify session               │
│  GET  /api/user/data        -> Fetch history, rules, prefs  │
│  POST /api/user/data        -> Save user changes            │
│  POST /api/gemini/chat      -> Server-side Gemini API call  │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
                ┌───────────────────────────┐
                │ Server Store: users.json  │
                │ - Users & Hashed Passwords│
                │ - Chat Histories          │
                │ - Custom Bot Rules        │
                │ - Model Preferences       │
                └───────────────────────────┘
```

### Data Models

```typescript
interface UserProfile {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

interface UserDataPayload {
  ruleMessages: ChatMessage[];
  llmMessages: ChatMessage[];
  customRules: RuleDefinition[];
  conceptSettings: {
    selectedModel: string;
    systemInstruction: string;
    temperature: number;
  };
}
```

### Verification & Testing
1. Test new account creation with form validation and instant session initialization.
2. Test login with existing accounts and 1-click demo login.
3. Send chat messages, add custom rules, and modify Concept Lab settings; reload page and confirm state persists per account.
4. Log out and confirm guest state isolates from authenticated user data.
5. Verify clean build via `compile_applet` and `lint_applet`.
