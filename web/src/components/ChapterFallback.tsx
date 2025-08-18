import { useEffect, useMemo, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";

export type ContentJson = {
  lead?: string;
  body_md?: string;
  tip?: string;

  // Optional: Checkbox-Liste + Label
  checkboxes?: Array<{ id: string; label: string }>;
  reflectionLabel?: string;

  // Button + Story als Modal
  cta?: { label?: string };
  story?: { title?: string; body_md: string };

  // Lernziele als Karten
  goals?: string[];
};

// Hilfsfunktion: Paragraphenerkennung + Soft-Umbrüche glätten
function toParagraphs(raw?: string): string[] {
  if (!raw) return [];
  let s = raw.replace(/\r\n/g, "\n");          // Windows -> Unix
  // Falls aus JSON noch wörtliche "\n" kommen, einmal auflösen:
  s = s.replace(/\\n/g, "\n");
  // In Paragraphen splitten (2+ Umbrüche = Absatz)
  const paras = s
    .split(/\n{2,}/)
    .map(p => p.replace(/\s*\n\s*/g, " ").trim()) // einzelne Umbrüche innerhalb eines Absatzes zu Leerzeichen
    .filter(Boolean);
  return paras;
}

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
  const [openStory, setOpenStory] = useState(false);

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

  // Debounced Autosave
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

  // Modal öffnen
  const openModal = useCallback(() => {
    if (cj.story?.body_md) setOpenStory(true);
  }, [cj.story]);

  const storyParagraphs = useMemo(() => toParagraphs(cj.story?.body_md), [cj.story?.body_md]);

  return (
    <>
      {/* Lead-Zeile */}
      {cj.lead && <p className="mt-3 text-sm opacity-80">{cj.lead}</p>}

      {/* Intro-Kasten mit CTA */}
      {(cj.tip || cj.cta) && (
        <div className="mt-4 rounded-2xl bg-slate-100 border border-slate-200 p-5 md:p-6">
          {cj.tip && (
            <div className="mb-4">
              <div className="font-semibold text-slate-800 mb-1">Flowmioo&apos;s Intro</div>
              <p className="text-slate-700 whitespace-pre-line">{cj.tip}</p>
            </div>
          )}
          {cj.cta && cj.story?.body_md && (
            <button
              onClick={openModal}
              className="inline-flex items-center justify-center rounded-xl px-4 py-2 font-medium shadow-sm bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {cj.cta.label ?? "Geschichte lesen"}
            </button>
          )}
        </div>
      )}

      {/* Lernziel-Bereich */}
      {(cj.goals?.length || cj.body_md) && (
        <div className="mt-6">
          <div className="font-semibold mb-2">Lernziel</div>
          {cj.body_md && (
            <p className="text-slate-700 mb-4 whitespace-pre-line">{cj.body_md}</p>
          )}
          {Array.isArray(cj.goals) && cj.goals.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {cj.goals.map((g, i) => (
                <div key={i} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="w-8 h-8 mx-auto rounded-full border border-blue-200 flex items-center justify-center text-sm font-semibold text-blue-700 mb-2">
                    {i + 1}
                  </div>
                  <div className="h-1 w-8 mx-auto rounded bg-blue-600 mb-3" />
                  <p className="text-slate-700 text-center">{g}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Checkboxen */}
      {checkboxGrid}

      {/* Notizen */}
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

      {/* Footer */}
      {showNext && (
        <div className="mt-6 flex items-center justify-end gap-3">
          {saving && <span className="text-xs opacity-60">Speichere…</span>}
          <button onClick={onNext} className="btn btn-primary">Weiter →</button>
        </div>
      )}

      {/* STORY MODAL */}
      {openStory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="w-full max-w-2xl max-h-[85vh] overflow-auto rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">{cj.story?.title ?? "Geschichte"}</h2>
              <button
                onClick={() => setOpenStory(false)}
                className="px-2 py-1 rounded-lg hover:bg-slate-100"
                aria-label="Schließen"
              >
                ✕
              </button>
            </div>

            {/* Hier: Paragraphen statt harter Umbrüche */}
            <div className="p-5 text-slate-800">
              <div className="space-y-3 text-[15px] leading-7">
                {storyParagraphs.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </div>

            <div className="p-4 border-t text-right">
              <button onClick={() => setOpenStory(false)} className="btn btn-primary">
                Schließen
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
