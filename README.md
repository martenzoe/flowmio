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

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   /auth, /auth/callback, /auth/reset, /logout  /app (RequireAuth + AppShell)  /app/academy  /app/academy/:phaseSlug  /app/modules/:slug  /app/modules/:slug/lesson/:lessonSlug   `

▶️ Local Development
--------------------

### Prerequisites

*   Node 18+ / 20+
    
*   pnpm or npm
    
*   Supabase project (Cloud) with RLS
    
*   OpenAI API key (for Edge Function)
    

### Install & run

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   # install deps  pnpm install  # or: npm install  # start dev  pnpm dev  # or: npm run dev   `

Vite + Tailwind are wired through the Vite plugin:

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   // vite.config.ts  import { defineConfig } from 'vite'  import react from '@vitejs/plugin-react'  import tailwind from '@tailwindcss/vite'  export default defineConfig({    plugins: [react(), tailwind()],  })   `

🔐 Configuration
----------------

### Frontend .env (never commit secrets)

Create .env (or .env.local) at the project root:

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co  VITE_SUPABASE_ANON_KEY=eyJhbGciOi...   `

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

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   supabase/functions/ai-generate/    deno.json    index.ts   `

**deno.json**

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   {    "compilerOptions": {      "lib": ["deno.ns", "dom"]    }  }   `

**Deploy**

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   # requires Supabase CLI installed (npm i -g supabase)  supabase functions deploy ai-generate   `

> Your editor may show TypeScript “Deno” typing warnings locally — that’s fine.The function runs in Deno on Supabase and will work after deploy.

### 3) Frontend caller

src/lib/ai.ts — fetch the Edge Function **as the signed-in user**:

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML``   import { supabase } from './supabase';  export async function callAi(payload: {    promptType: string;    inputs?: Record;    moduleId?: string | null;    temperature?: number;  }) {    const { data: sess } = await supabase.auth.getSession();    const res = await fetch(      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-generate`,      {        method: 'POST',        headers: {          'Content-Type': 'application/json',          'Authorization': `Bearer ${sess?.session?.access_token ?? ''}`,          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,        },        body: JSON.stringify(payload),      }    );    if (!res.ok) {      const text = await res.text().catch(() => '');      throw new Error(text || 'AI function failed');    }    return res.json() as Promise<{ ok: boolean; text: string; usage?: any }>;  }   ``

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

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   src/    app/      AppShell.tsx    lib/      supabase.ts      ai.ts    routes/      AcademyIndex.tsx      PhaseDetail.tsx      module/        ModuleLayout.tsx        ModuleOverview.tsx        LessonPage.tsx  index.css  vite.config.ts   `

🧪 Seed example (Phase 1 / Module 1 / Chapters 1–2)
---------------------------------------------------

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   -- Phase  insert into public.phases (title, slug, order_index, description)  values ('Phase 1: Mindset & Motivation', 'phase-1', 1, 'Build your Why and a strong founder mindset.')  on conflict (slug) do nothing;  -- Module  insert into public.modules (title, slug, description, phase_id, order_index)  select 'Find your Why', 'finde-dein-warum', 'Clarity on your inner drive.', p.id, 1  from public.phases p where p.slug='phase-1'  on conflict (slug) do nothing;  -- Intro  insert into public.module_lessons (module_id, slug, title, order_index, kind, body_md)  select m.id, 'intro', 'Introduction', 1, 'intro',  'Meow! I\'m Flowmioo – your fluffy escape guide from the hamster wheel. Want out of 9-to-5? Ready to build your own thing but everything still feels blurry? Then it’s time to find your WHY. Without it… you’re a ship without a compass.  You’ll uncover your true Why – clear, personal, motivating. No fluff. What gets you up in the morning? Why do you want to found? What’s worth the grind?'  from public.modules m where m.slug='finde-dein-warum'  on conflict (slug) do nothing;  -- Chapter 1  insert into public.module_lessons (module_id, slug, title, order_index, kind, body_md)  select m.id, 'kapitel-1', 'What drives you?', 2, 'chapter', null  from public.modules m where m.slug='finde-dein-warum'  on conflict (slug) do nothing;  -- Chapter 2  insert into public.module_lessons (module_id, slug, title, order_index, kind, body_md)  select m.id, 'kapitel-2', 'Exercise – Your personal Why', 3, 'chapter', null  from public.modules m where m.slug='finde-dein-warum'  on conflict (slug) do nothing;   `

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