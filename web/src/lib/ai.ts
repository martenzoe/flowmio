import { supabase } from "./supabase";

type AiParams = {
  promptType: string;
  inputs?: Record<string, unknown>;
  moduleId?: string | null;
  temperature?: number;
};

export async function callAi(params: AiParams): Promise<{ text: string; usage?: any }> {
  const { data: sess } = await supabase.auth.getSession();
  const token = sess?.session?.access_token;
  if (!token) throw new Error("Nicht eingeloggt.");

  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-generate`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
    },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => "");
    throw new Error(`AI-Request failed (${res.status}): ${err}`);
  }
  const json = await res.json();
  if (!json.ok) throw new Error(json.error ?? "Unbekannter Fehler");
  return { text: json.text as string, usage: json.usage };
}
