// deno-lint-ignore-file no-explicit-any
// Supabase Edge Function: ai-generate
// Läuft auf Deno (Supabase). Loggt Usage, zieht Tokens ab und liefert KI-Text zurück.

import OpenAI from "npm:openai@4";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// --- ENV ---
// Setze diese drei Secrets im Supabase Dashboard (Project Settings > Config > Secrets):
// OPENAI_API_KEY
// SUPABASE_URL
// SUPABASE_SERVICE_ROLE_KEY
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const MODEL = "gpt-4o-mini";

// ---- Helpers ----
function cors(res: Response) {
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
  if (req.method === "OPTIONS") return cors(new Response("ok", { status: 200 }));

  if (req.method !== "POST") {
    return cors(new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 }));
  }

  try {
    const anonClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY") ?? "", {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });
    const { data: userRes } = await anonClient.auth.getUser();
    if (!userRes?.user) {
      return cors(new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 }));
    }
    const userId = userRes.user.id;

    const body: AiPayload = await req.json();
    const { promptType, inputs = {}, moduleId = null, temperature = 0.7 } = body ?? {};
    if (!promptType) {
      return cors(new Response(JSON.stringify({ error: "Missing promptType" }), { status: 400 }));
    }

    const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

    // --- Prompt-Design (einfach, erweiterbar pro promptType) ---
    const system = [
      "Du bist Flowmioo, ein pragmatischer Startup-Coach.",
      "Sprich klar, knapp, deutsch.",
      "Wenn der Nutzer Freitext mitliefert, fasse zuerst zusammen, dann gib 3–5 konkrete nächste Schritte."
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

    const usage = completion.usage ?? { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };

    // --- Logging + Token-Abzug ---
    const svc = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // 1) ai_usage_log
    await svc.from("ai_usage_log").insert({
      user_id: userId,
      module_id: moduleId,
      provider: "openai",
      model: MODEL,
      tokens_consumed: usage.total_tokens ?? (usage.prompt_tokens + usage.completion_tokens) ?? 0,
      prompt_tokens: usage.prompt_tokens ?? 0,
      completion_tokens: usage.completion_tokens ?? 0,
    });

    // 2) token_wallets: tokens_used += total_tokens
    if ((usage.total_tokens ?? 0) > 0) {
      await svc.rpc("increment_tokens_used", {
        p_user_id: userId,
        p_delta: usage.total_tokens,
      }).catch(async () => {
        // Fallback, falls RPC nicht existiert
        await svc.from("token_wallets")
          .upsert({ user_id: userId, tokens_used: usage.total_tokens, tokens_total: 0 }, { onConflict: "user_id" })
          .select()
          .then(async (res) => {
            if (res.error) throw res.error;
            await svc.from("token_wallets")
              .update({ updated_at: new Date().toISOString() })
              .eq("user_id", userId);
          });
      });
    }

    return cors(
      new Response(JSON.stringify({ ok: true, text, usage }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
  } catch (err) {
    console.error(err);
    return cors(
      new Response(JSON.stringify({ ok: false, error: String(err?.message ?? err) }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }),
    );
  }
});
