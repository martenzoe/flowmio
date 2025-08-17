Flowmioo — Founder Academy (WIP)
================================

**Flowmioo** is a platform for founders with a structured Academy of **5 phases**. Each phase contains **5 modules**; every module has an **Intro page** and multiple **Chapters**.Content, progress, and AI help run on **Supabase**. The frontend is **React + Vite + Tailwind**.

> **Status:** Work in progress — functional core in place (Auth, navigation, Module Intro, Chapter page with AI assist, persistence for answers & progress, Supabase Edge Function hooked up).

✨ Features (current)
--------------------

*   **Auth:** Supabase Auth (PKCE / Magic Link)
    
*   **Academy Navigation**
    
    *   /app/academy → phases overview
        
    *   /app/academy/:phaseSlug → phase detail (lists modules)
        
    *   /app/modules/:slug → **module intro** (Intro box + learning goals + chapter nav)
        
    *   /app/modules/:slug/lesson/:lessonSlug → **chapter**
        
*   **Persistence**
    
    *   user\_lesson\_responses stores chapter inputs (checkboxes + notes) per user
        
    *   user\_lesson\_progress marks a chapter complete (via **Next** button)
        
*   **AI Assist**
    
    *   Supabase **Edge Function** ai-generate (OpenAI GPT-4o-mini)
        
    *   “**Improve with AI**” turns bullet points into a motivating, crisp text based on the user’s input
        
    *   **Usage logging** in ai\_usage\_log; **credit tracking** in token\_wallets
        
*   **RLS:** policies ensure each user can only read/write their own records
    

🧱 Tech Stack
-------------

*   **Frontend:** React + TypeScript + Vite + Tailwind (via @tailwindcss/vite)
    
*   **Backend:** Supabase (Postgres, Auth, RLS, Edge Functions on Deno)
    
*   **Styling:** soft cards/shadows (minimal hard borders), brand blue #2563EB
    
*   **AI:** OpenAI via Supabase Edge Function
    

🗺️ Architecture
----------------

### Data model (Supabase)

*   phases — { id, slug, title, order\_index, description, created\_at }
    
*   modules — { id, phase\_id, slug, title, order\_index, description, ... }
    
*   module\_lessons — { id, module\_id, slug, title, order\_index, kind('intro'|'chapter'), body\_md, content\_json, ... }
    
*   user\_lesson\_responses — { user\_id, lesson\_id, data\_json, updated\_at }
    
*   user\_lesson\_progress — { id, user\_id, lesson\_id, completed, completed\_at }
    
*   user\_module\_progress — { id, user\_id, module\_id, completed, last\_interaction }
    
*   token\_wallets, ai\_usage\_log, profiles, subscriptions (credits, AI usage, user profile, plan)
    

### Routing (React Router)

`/auth, /auth/callback, /auth/reset, /logout  /app (RequireAuth + AppShell)  /app/academy  /app/academy/:phaseSlug  /app/modules/:slug  /app/modules/:slug/lesson/:lessonSlug   `

▶️ Local Development
--------------------

### Prerequisites

*   Node 18+ / 20+
    
*   pnpm or npm
    
*   Supabase project (Cloud) with RLS
    
*   OpenAI API key (for Edge Function)
    

### Install & run

`# install deps  pnpm install  # or: npm install  # start dev  pnpm dev  # or: npm run dev   `

Vite + Tailwind are wired through the Vite plugin:

`// vite.config.ts  import { defineConfig } from 'vite'  import react from '@vitejs/plugin-react'  import tailwind from '@tailwindcss/vite'  export default defineConfig({    plugins: [react(), tailwind()],  })   `

🔐 Configuration
----------------

### Frontend .env (never commit secrets)

Create .env (or .env.local) at the project root:

`VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co  VITE_SUPABASE_ANON_KEY=eyJhbGciOi...   `

> Do **not** put your OpenAI key in the frontend. AI requests run on the server-side **Edge Function**.

🤖 AI Edge Function (Deno)
--------------------------

### 1) Add secrets in Supabase (Dashboard)

**Settings → Configuration → Secrets → “+ Add Secret”**

*   OPENAI\_API\_KEY — your OpenAI key
    
*   SUPABASE\_URL — your project URL
    
*   SUPABASE\_SERVICE\_ROLE\_KEY — service role key (server-side only)
    
*   _(optional)_ SUPABASE\_ANON\_KEY — safer to pass via request headers from the client
    

> These are read by the Edge Function at runtime.

### 2) Function files (repo layout)

`supabase/functions/ai-generate/    deno.json    index.ts   `

**deno.json**

`{    "compilerOptions": {      "lib": ["deno.ns", "dom"]    }  }   `

**Deploy**

`# requires Supabase CLI installed (npm i -g supabase)  supabase functions deploy ai-generate   `

> Your editor may show TypeScript “Deno” typing warnings locally — that’s fine.The function runs in Deno on Supabase and will work after deploy.

### 3) Frontend caller

src/lib/ai.ts — fetch the Edge Function **as the signed-in user**:


📝 Content authoring (Intro & Chapters)
---------------------------------------

### Module Intro

*   Create a module\_lessons record with kind='intro', order\_index=1, slug='intro'.
    
*   Fill intro copy in body\_md (or use content\_json later).
    

### Chapters

*   Create a module\_lessons record with kind='chapter' and increasing order\_index.
    
*   Use a clear slug (e.g., kapitel-1).
    
*   The **Next** button automatically navigates to the next ordered chapter (or back to module intro when it’s the last chapter).
    

💾 Persistence (answers & progress)
-----------------------------------

*   **Answers**Stored in user\_lesson\_responses as JSON: { selections: string\[\], notes: string } per (user\_id, lesson\_id).Auto-saved also after **Improve with AI**.
    
*   **Progress**user\_lesson\_progress sets completed=true on **Next**.
    
*   **RLS**Policies restrict read/write to the authenticated user’s own rows: auth.uid() = user\_id.
    

📁 Project structure (excerpt)
------------------------------

`src/    app/      AppShell.tsx    lib/      supabase.ts      ai.ts    routes/      AcademyIndex.tsx      PhaseDetail.tsx      module/        ModuleLayout.tsx        ModuleOverview.tsx        LessonPage.tsx  index.css  vite.config.ts   `


🗺️ Roadmap
-----------

*   Aggregate module progress from chapters (user\_module\_progress)
    
*   Progress bars on phase/module overview
    
*   More input types (radio, slider, upload)
    
*   Credit limits & pricing UI for AI usage
    
*   Fill out phases 1–5 content
    
*   E2E tests (Playwright/Cypress)
    
*   Analytics/telemetry (optional)
    

🙋 FAQ
------

**Why store lesson content in Supabase instead of React code?**It scales better for content workflows, avoids redeploys for copy changes, and cleanly separates **content** from **presentation**. RLS protects per-user data.

**Where do I configure AI behavior?**In the Edge Function (supabase/functions/ai-generate/index.ts): prompt, model, temperature.OpenAI key lives as a **Supabase Secret** (server-side).

**Multiple OpenAI keys/billing?**Costs are charged to the OpenAI **account** associated with the key(s). Multiple keys in the same account share that account’s billing.

🔑 License
----------

TBD (e.g. proprietary or MIT).