import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../../lib/supabase";

export type WeeklyPlanWeek = {
  focus?: string;
  todo1?: string;
  todo2?: string;
  todo3?: string;
  reward?: string;
  helper?: string; // Accountability / Wer hilft mir?
};

export type WeeklyPlanContentJson = {
  lead?: string;       // kurzer Intro-Text über dem Kasten
  footnote?: string;   // "Flowmioo"-Hinweis im gelben Streifen
  weeklyPlan?: {
    weeks?: number;    // default 4
    labels?: {
      focus?: string;
      todo1?: string; todo2?: string; todo3?: string;
      reward?: string; helper?: string;
    };
  };
};

export default function WeeklyPlanLesson({
  moduleRow,
  lesson,
  cj,
  onNext,
  showNext = true,
}: {
  moduleRow: { id: string; slug: string; title: string };
  lesson: { id: string; slug: string; title: string };
  cj: WeeklyPlanContentJson;
  onNext: () => void;
  showNext?: boolean;
}) {
  const totalWeeks = Math.max(1, cj.weeklyPlan?.weeks ?? 4);
  const [visibleWeeks, setVisibleWeeks] = useState(Math.min(2, totalWeeks)); // Start mit 2, Button zeigt alle
  const [weeks, setWeeks] = useState<WeeklyPlanWeek[]>(
    Array.from({ length: totalWeeks }, () => ({}))
  );
  const [saving, setSaving] = useState(false);
  const hasLoaded = useRef(false);

  const labels = useMemo(() => ({
    focus: cj.weeklyPlan?.labels?.focus ?? "1 Fokus-Ziel",
    todo1: cj.weeklyPlan?.labels?.todo1 ?? "To-do 1",
    todo2: cj.weeklyPlan?.labels?.todo2 ?? "To-do 2",
    todo3: cj.weeklyPlan?.labels?.todo3 ?? "To-do 3",
    reward: cj.weeklyPlan?.labels?.reward ?? "Wie belohne ich mich?",
    helper: cj.weeklyPlan?.labels?.helper ?? "Wer hilft mir?",
  }), [cj.weeklyPlan?.labels]);

  // Load previously saved answers
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

      const w = (data?.data_json as any)?.weekly_plan?.weeks;
      if (Array.isArray(w)) {
        const arr = Array.from({ length: totalWeeks }, (_, i) => w[i] ?? {});
        setWeeks(arr);
      }
      hasLoaded.current = true;
    })();
  }, [lesson.id, totalWeeks]);

  // Autosave (debounced)
  useEffect(() => {
    if (!hasLoaded.current) return;
    const t = setTimeout(() => void save(), 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weeks]);

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
            data_json: {
              weekly_plan: { weeks },
            },
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,lesson_id" }
        );
    } finally {
      setSaving(false);
    }
  }

  function updateWeek(i: number, patch: Partial<WeeklyPlanWeek>) {
    setWeeks((prev) => {
      const copy = prev.slice();
      copy[i] = { ...copy[i], ...patch };
      return copy;
    });
  }

  const normalize = (s?: string) => (s ?? "").replace(/\\n/g, "\n");

  return (
    <div className="space-y-4">
      {cj.lead && (
        <p className="text-sm opacity-80 whitespace-pre-line">{normalize(cj.lead)}</p>
      )}

      <div className="rounded-xl border border-slate-200">
        <div className="rounded-t-xl bg-slate-50 border-b border-slate-200 px-4 py-2 text-sm font-medium">
          Interaktive Übung: Woche 1–{totalWeeks} Planer
        </div>

        {/* Weeks */}
        <div className="p-4 space-y-4">
          {weeks.slice(0, visibleWeeks).map((w, idx) => {
            const wNum = idx + 1;
            return (
              <div key={idx} className="rounded-xl border border-slate-200">
                <div className="px-4 py-2 border-b border-slate-200 bg-white font-medium">
                  Woche {wNum}
                </div>

                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="md:col-span-2">
                    <div className="text-xs font-semibold mb-1">{labels.focus}</div>
                    <input
                      className="w-full rounded-lg border border-slate-200 p-2 text-sm"
                      placeholder="Mein Hauptziel für diese Woche…"
                      value={w.focus ?? ""}
                      onChange={(e) => updateWeek(idx, { focus: e.target.value })}
                    />
                  </div>

                  <div>
                    <div className="text-xs font-semibold mb-1">1–3 Mini-To-dos</div>
                    <input
                      className="w-full rounded-lg border border-slate-200 p-2 text-sm mb-2"
                      placeholder={labels.todo1}
                      value={w.todo1 ?? ""}
                      onChange={(e) => updateWeek(idx, { todo1: e.target.value })}
                    />
                    <input
                      className="w-full rounded-lg border border-slate-200 p-2 text-sm mb-2"
                      placeholder={labels.todo2}
                      value={w.todo2 ?? ""}
                      onChange={(e) => updateWeek(idx, { todo2: e.target.value })}
                    />
                    <input
                      className="w-full rounded-lg border border-slate-200 p-2 text-sm"
                      placeholder={labels.todo3}
                      value={w.todo3 ?? ""}
                      onChange={(e) => updateWeek(idx, { todo3: e.target.value })}
                    />
                  </div>

                  <div>
                    <div className="text-xs font-semibold mb-1">{labels.reward}</div>
                    <input
                      className="w-full rounded-lg border border-slate-200 p-2 text-sm mb-3"
                      placeholder="Meine Belohnung…"
                      value={w.reward ?? ""}
                      onChange={(e) => updateWeek(idx, { reward: e.target.value })}
                    />

                    <div className="text-xs font-semibold mb-1">{labels.helper}</div>
                    <input
                      className="w-full rounded-lg border border-slate-200 p-2 text-sm"
                      placeholder="Mein Accountability-Partner…"
                      value={w.helper ?? ""}
                      onChange={(e) => updateWeek(idx, { helper: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            );
          })}

          {visibleWeeks < totalWeeks && (
            <div className="pt-1">
              <button
                className="btn btn-primary"
                onClick={() => setVisibleWeeks(totalWeeks)}
              >
                Alle {totalWeeks} Wochen anzeigen
              </button>
            </div>
          )}
        </div>
      </div>

      {!!cj.footnote && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm">
          {normalize(cj.footnote)}
        </div>
      )}

      {showNext && (
        <div className="mt-2 flex items-center justify-end gap-3">
          {saving && <span className="text-xs opacity-60">Speichere…</span>}
          <button onClick={onNext} className="btn btn-primary">Weiter →</button>
        </div>
      )}
    </div>
  );
}
