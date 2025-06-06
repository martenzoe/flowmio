import { supabase } from "../lib/supabaseClient";

export async function saveInput(userId, kapitel, field, value) {
  if (!userId) return;

  const { error } = await supabase
    .from("businessplan_inputs")
    .upsert(
      {
        user_id: userId,
        kapitel,
        field,
        value,
        updated_at: new Date(),
      },
      { onConflict: "user_id,kapitel,field" }
    );

  if (error) console.error("Fehler beim Speichern:", error.message);
}
