/// <reference lib="deno.ns" />
/// <reference lib="deno.unstable" />
// deno-lint-ignore-file no-explicit-any

// Supabase Edge Function: ai-generate
// - Liest den eingeloggten User (via JWT vom Client)
// - Ruft OpenAI auf
// - Loggt Tokenverbrauch (ai_usage_log) und erhöht tokens_used

import OpenAI from "npm:openai@4";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ---- ENV (Namen = Secrets in "Edge Functions → Secrets")
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")!;
const SB_URL = Deno.env.get("SB_URL")!;
const SB_SERVICE_ROLE_KEY = Deno.env.get("SB_SERVICE_ROLE_KEY")!;
const SB_ANON_KEY = Deno.env.get("SB_ANON_KEY")!;

const MODEL = "gpt-4o-mini";

// ---- CORS Helper
function withCORS(res: Response) {
  const h = new Headers(res.headers);
  h.set("Access-Control-Allow-Origin", "*");
  h.set("Access-Control-Allow-Headers", "authorization, x-client-info, apikey, content-type");
  h.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  return new Response(res.body, { ...res, headers: h });
}

type AiPayload = {
  promptType: string;
  inputs?: Record<string, any>;
  moduleId?: string | null;
  temperature?: number;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return withCORS(new Response("ok", { status: 200 }));
  if (req.method !== "POST") {
    return withCORS(new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { "Content-Type": "application/json" },
    }));
  }

  try {
    // 1) User anhand des JWT aus dem Authorization-Header ermitteln
    const anon = createClient(SB_URL, SB_ANON_KEY, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });
    const { data: userRes } = await anon.auth.getUser();
    const userId = userRes?.user?.id;
    if (!userId) {
      return withCORS(new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { "Content-Type": "application/json" },
      }));
    }

    // 2) Body prüfen
    const body: AiPayload = await req.json();
    const { promptType, inputs = {}, moduleId = null, temperature = 0.6 } = body || {};
    if (!promptType) {
      return withCORS(new Response(JSON.stringify({ error: "Missing promptType" }), {
        status: 400, headers: { "Content-Type": "application/json" },
      }));
    }

    // 3) OpenAI call
    const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

    const system = [
      "Du bist Flowmioo, ein pragmatischer Startup-Coach.",
      "Sprich klar, knapp, deutsch.",
      "Wenn der Nutzer Stichpunkte liefert, forme einen motivierenden, kurzen Text",
      "und gib 3–5 konkrete nächste Schritte."
    ].join(" ");

    const userMsg = `PromptType: ${promptType}
Inputs: ${JSON.stringify(inputs, null, 2)}
Kontext: Gründer-Academy, Modul ${moduleId ?? "n/a"}.
Ziel: Hilf dem Nutzer mit greifbaren, umsetzbaren Tipps.`;

    const completion = await openai.chat.completions.create({
      model: MODEL,
      temperature,
      messages: [
        { role: "system", content: system },
        { role: "user", content: userMsg },
      ],
    });

    const text =
      completion.choices?.[0]?.message?.content?.trim() ||
      "Leider kam keine sinnvolle Antwort zurück.";

    // usage sicher zusammensetzen (ohne „nie nullish“-Warnungen)
    const prompt_tokens = completion.usage?.prompt_tokens ?? 0;
    const completion_tokens = completion.usage?.completion_tokens ?? 0;
    const total_tokens = completion.usage?.total_tokens ?? (prompt_tokens + completion_tokens);

    // 4) Logging + Tokens erhöhen (Service-Role-Client, um RLS zu umgehen)
    const svc = createClient(SB_URL, SB_SERVICE_ROLE_KEY);

    await svc.from("ai_usage_log").insert({
      user_id: userId,
      module_id: moduleId,
      provider: "openai",
      model: MODEL,
      tokens_consumed: total_tokens,
      prompt_tokens,
      completion_tokens,
    });

    if (total_tokens > 0) {
      await svc.rpc("increment_tokens_used", {
        p_user_id: userId,
        p_delta: total_tokens,
      });
    }

    return withCORS(new Response(JSON.stringify({
      ok: true,
      text,
      usage: { total_tokens, prompt_tokens, completion_tokens }
    }), { status: 200, headers: { "Content-Type": "application/json" } }));

  } catch (err: any) {
    console.error(err);
    return withCORS(new Response(JSON.stringify({ ok: false, error: String(err?.message ?? err) }), {
      status: 500, headers: { "Content-Type": "application/json" },
    }));
  }
});
