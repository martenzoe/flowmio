import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabase";

export type LikertItem = {
  id: string;
  text?: string;
  label?: string;
  statement?: string; // so liegt es in deiner DB
};

export type LikertContentJson = {
  lead?: string;
  likert: {
    leftLabel?: string;
    rightLabel?: string;
    items: LikertItem[];
  };
  hint?: string;
  evaluation?: {
    showScore?: boolean;
    rules: Array<{ min?: number; max?: number; text: string }>;
  };
};

type Basic = { id: string; slug: string; title: string };

export default function LikertLesson({
  moduleRow,
  lesson,
  cj,
  onNext,
  showNext = true,
  backHref,
}: {
  moduleRow: Basic;
  lesson: Basic;
  cj: LikertContentJson;
  onNext?: () => void;          // ← optional
  showNext?: boolean;
  backHref?: string;
}) {
  const items: LikertItem[] = Array.isArray(cj?.likert?.items) ? cj.likert.items : [];
  const leftLabel  = String(cj?.likert?.leftLabel ?? "Trifft nicht zu").replace(/\\n/g, " ");
  const rightLabel = String(cj?.likert?.rightLabel ?? "Trifft voll zu").replace(/\\n/g, " ");

  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);

  const txt = (it: LikertItem) => (it.text ?? it.label ?? it.statement ?? "").trim();

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
      const saved = (data?.data_json as any)?.likert?.answers;
      setAnswers(saved && typeof saved === "object" ? saved : {});
    })();
  }, [lesson.id]);

  useEffect(() => {
    const t = setTimeout(() => void save(), 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers]);

  async function save(next?: Record<string, number>) {
    setSaving(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      await supabase.from("user_lesson_responses").upsert(
        {
          user_id: u.user.id,
          lesson_id: lesson.id,
          data_json: { likert: { answers: next ?? answers } },
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,lesson_id" }
      );
    } finally {
      setSaving(false);
    }
  }

  function setAnswer(id: string, value: number) {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  }

  const score = useMemo(
    () => items.reduce((s, it) => s + (answers[it.id] ?? 0), 0),
    [answers, items]
  );

  const evaluationText = useMemo(() => {
    const rules = cj.evaluation?.rules ?? [];
    if (rules.length) {
      const r = rules.find(
        (r) =>
          (r.min ?? Number.NEGATIVE_INFINITY) <= score &&
          score <= (r.max ?? Number.POSITIVE_INFINITY)
      );
      if (r?.text) return r.text;
    }
    if (score <= 10) {
      return "Perfekter Startpunkt. Fokus: raus aus dem Tagesgeschäft, Preise & Prozesse klären, erste Delegations-Schritte gehen.";
    }
    if (score <= 18) {
      return "Guter Weg! Du wechselst vom Operativen ins Unternehmer-Denken. Nächste Schritte: Standards, einfache Automationen, delegierbare To-dos sammeln.";
    }
    return "Starkes Unternehmer-Mindset! Baue skalierbare Systeme, führe über Ziele/KPIs und nutze freie Zeit für Wachstum.";
  }, [score, cj.evaluation]);

  const Rail = ({ itemId }: { itemId: string }) => {
    const val = answers[itemId] ?? 0;
    return (
      <div className="w-[240px]">
        <div className="flex items-center justify-between">
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} className="cursor-pointer">
              <input
                type="radio"
                name={`likert-${itemId}`}
                className="sr-only"
                checked={val === n}
                onChange={() => setAnswer(itemId, n)}
              />
              <span
                className={`inline-block h-4 w-4 rounded-full border transition
                  ${val === n ? "bg-blue-600 border-blue-600" : "border-slate-300 bg-white"}`}
                aria-hidden
              />
            </label>
          ))}
        </div>
        <div className="mt-1 text-[11px] text-slate-500 flex justify-between">
          {[1, 2, 3, 4, 5].map((n) => (
            <span key={n}>{n}</span>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-[980px] mx-auto">
      {cj.lead && <p className="text-sm opacity-80 mb-3">{cj.lead}</p>}

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="font-medium mb-2">
          Wie tickst du? – 5 Aussagen zum Ankreuzen (Skala von 1–5)
        </div>

        {/* JE ITEM: zuerst die Aussage, dann die Skala – keine Überlappung */}
        <div className="space-y-6">
          {items.map((it) => (
            <div
              key={it.id}
              className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] gap-y-2 gap-x-3 items-center"
            >
              {/* Aussage */}
              <div className="col-span-3 text-sm">{txt(it)}</div>

              {/* Skala */}
              <div className="text-[12px] text-slate-500 whitespace-nowrap">{leftLabel}</div>
              <div className="justify-self-center"><Rail itemId={it.id} /></div>
              <div className="text-[12px] text-slate-500 whitespace-nowrap justify-self-end">
                {rightLabel}
              </div>
            </div>
          ))}
        </div>

        {/* Auswertung */}
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
          {cj.evaluation?.showScore && (
            <div className="text-xs opacity-60 mb-1">
              Punktzahl: {score} / {items.length * 5}
            </div>
          )}
          {evaluationText || cj.hint || ""}
        </div>

        {/* Footer (intern nur wenn gewünscht) */}
        <div className="mt-4 flex items-center justify-end gap-2">
          {saving && <span className="text-xs opacity-60 mr-2">Speichere…</span>}
          {backHref && <Link to={backHref} className="btn btn-primary">Zurück</Link>}
          {showNext && onNext && (
            <button onClick={onNext} className="btn btn-primary">Weiter</button>
          )}
        </div>
      </div>
    </div>
  );
}
