import { supabase } from "../lib/supabaseClient";

export const saveInput = async (user_id, kapitel, field, value) => {
  if (!user_id || !kapitel || !field) {
    console.warn("⚠️ Ungültiger saveInput-Aufruf:", { user_id, kapitel, field });
    return;
  }

  console.log("💾 Speichere Eingabe:", { user_id, kapitel, field, value });

  const { data, error } = await supabase
    .from("businessplan_inputs")
    .upsert(
      [
        {
          user_id,
          kapitel,
          field,
          value,
          updated_at: new Date().toISOString(),
        },
      ],
      { onConflict: ["user_id", "kapitel", "field"] }
    );

  if (error) {
    console.error("❌ Fehler beim Speichern:", error.message);
  } else {
    console.log("✅ Eingabe gespeichert:", data);
  }
};
