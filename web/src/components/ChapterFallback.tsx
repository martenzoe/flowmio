// src/components/ChapterFallback.tsx
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

export type ContentJson = {
  lead?: string;
  body_md?: string;
  tip?: string;

  // NEU: optionale Checkbox-Liste (z.B. für "Fähigkeiten eines Unternehmers")
  checkboxes?: Array<{ id: string; label: string }>;
  reflectionLabel?: string; // optionaler Label-Text für das Notizfeld
};

export default function ChapterFallback({
  moduleRow,
  lesson,
  cj,
  onNext,
  showNext = true,
}: {
  moduleRow: { id: string; slug: string; title: string };
  lesson: { id: string; slug: string; title: string };
  cj: ContentJson;
  onNext: () => void;
  showNext?: boolean;
}) {
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState("");
  const [selected, setSelected] = useState<string[]>([]);

  const hasCheckboxes = Array.isArray(cj.checkboxes) && cj.checkboxes.length > 0;

  // Vorhandene Antworten laden
  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data } = await supabase
        .from("user_lesson_responses")
        .select("data_json")
        .eq("user_id", u.user.id)
        .eq("lesson_id", lesson.id)
        .maybeSingle();

      const dj = (data?.data_json ?? {}) as any;
      setNotes(typeof dj.notes === "string" ? dj.notes : "");
      setSelected(Array.isArray(dj.selected) ? dj.selected : []);
    })();
  }, [lesson.id]);

  // Debounced Autosave für Checkboxen & Notizen
  useEffect(() => {
    const t = setTimeout(() => void save(), 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notes, selected]);

  async function save() {
    setSaving(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      await supabase
        .from("user_lesson_responses")
        .upsert(
          {
            user_id: u.user.id,
            lesson_id: lesson.id,
            data_json: { notes, selected },
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,lesson_id" }
        );
    } finally {
      setSaving(false);
    }
  }

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  const checkboxGrid = useMemo(() => {
    if (!hasCheckboxes) return null;
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {cj.checkboxes!.map((opt) => {
          const checked = selected.includes(opt.id);
          return (
            <label
              key={opt.id}
              className={`flex items-center gap-3 rounded-xl border bg-white py-3 px-4 select-none transition
                ${checked ? "border-blue-300 ring-2 ring-blue-100" : "border-slate-200/60"}`}
            >
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={checked}
                onChange={() => toggle(opt.id)}
              />
              <span className="text-sm">{opt.label}</span>
            </label>
          );
        })}
      </div>
    );
  }, [cj.checkboxes, hasCheckboxes, selected]);

  return (
    <>
      {cj.lead && <p className="mt-3 text-sm opacity-80">{cj.lead}</p>}

      {/* Optionale Checkboxen */}
      {checkboxGrid}

      {/* Notizfeld */}
      <div className="mt-5">
        {cj.reflectionLabel && <div className="font-medium mb-1">{cj.reflectionLabel}</div>}
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={() => void save()}
          rows={6}
          className="w-full rounded-xl border border-slate-200/60 shadow-sm p-3 text-sm"
          placeholder="Notiere hier deine Gedanken…"
        />
      </div>

      {/* Tipp-Kasten */}
      {cj.tip && (
        <div className="mt-4 rounded-xl bg-slate-50 border border-slate-200/60 shadow-sm p-3 text-sm">
          {cj.tip}
        </div>
      )}

      {/* Interner Weiter-Button nur, wenn explizit gewünscht */}
      {showNext && (
        <div className="mt-6 flex items-center justify-end gap-3">
          {saving && <span className="text-xs opacity-60">Speichere…</span>}
          <button onClick={onNext} className="btn btn-primary">
            Weiter →
          </button>
        </div>
      )}
    </>
  );
}
