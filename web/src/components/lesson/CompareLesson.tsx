import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import { callAi } from "../../lib/ai";
import ComparisonGrid, { CompareRow, CompareValue, Choice } from "./ComparisonGrid";

export type CompareContentJson = {
  lead?: string;
  tip?: string;
  aiPromptType?: string;
  reflectionLabel?: string;
  compareRows?: CompareRow[];
};

export default function CompareLesson({
  moduleRow,
  lesson,
  cj,
  onNext,
  showNext = true,
}: {
  moduleRow: { id: string; slug: string; title: string };
  lesson: { id: string; slug: string; title: string };
  cj: CompareContentJson;
  onNext: () => void;
  showNext?: boolean;
}) {
  const [notes, setNotes] = useState("");
  const [compareMap, setCompareMap] = useState<CompareValue>({});
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [err, setErr] = useState("");

  const rows: CompareRow[] = Array.isArray(cj.compareRows) ? cj.compareRows : [];
  const lead = cj.lead ?? "";
  const tipText =
    cj.tip ??
    "„Wenn’s mal schwer wird (und das wird es), liest du genau hier nach – und erinnerst dich: Darum hast du angefangen.“";
  const aiPromptType = cj.aiPromptType ?? "motivation";
  const textareaLabel = cj.reflectionLabel ?? "Notiere deine wichtigsten Erkenntnisse:";

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
      const cmp = Array.isArray(dj.compare)
        ? (dj.compare as Array<{ rowId: string; choice: Choice }>).reduce<CompareValue>((acc, c) => {
            acc[c.rowId] = c.choice;
            return acc;
          }, {})
        : {};
      setCompareMap(cmp);
    })();
  }, [lesson.id]);

  async function saveResponse(nextNotes?: string, nextMap?: CompareValue) {
    setSaving(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;

      const notesToSave = typeof nextNotes === "string" ? nextNotes : notes;
      const mapToSave = nextMap ?? compareMap;

      await supabase
        .from("user_lesson_responses")
        .upsert(
          {
            user_id: u.user.id,
            lesson_id: lesson.id,
            data_json: {
              notes: notesToSave,
              compare: Object.entries(mapToSave).map(([rowId, choice]) => ({ rowId, choice })),
            },
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,lesson_id" }
        );
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    const t = setTimeout(() => void saveResponse(), 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [compareMap]);

  const canOptimize = notes.trim().length > 0 || Object.keys(compareMap).length > 0;

  async function handleAiOptimize() {
    setErr("");
    if (!canOptimize) {
      setErr("Bitte zuerst etwas auswählen oder notieren.");
      return;
    }
    setAiLoading(true);
    try {
      const res = await callAi({
        promptType: aiPromptType,
        inputs: {
          user_notes: notes,
          compare: Object.entries(compareMap).map(([rowId, choice]) => ({ rowId, choice })),
          module_slug: moduleRow.slug,
          lesson_slug: lesson.slug,
          lesson_title: lesson.title,
        },
        moduleId: moduleRow.id,
        temperature: 0.4,
      });
      const newText = (res?.text ?? "").trim();
      if (newText) {
        setNotes(newText);
        await saveResponse(newText, compareMap);
      }
    } catch (e: any) {
      setErr(e?.message ?? "Unbekannter Fehler beim Optimieren.");
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <>
      {lead && <p className="mt-3 text-sm opacity-80">{lead}</p>}

      <div className="mt-4">
        <ComparisonGrid
          rows={rows}
          value={compareMap}
          onChange={(rowId, choice) => setCompareMap((prev) => ({ ...prev, [rowId]: choice }))}
        />
      </div>

      <div className="mt-6">
        <div className="font-medium mb-2">{textareaLabel}</div>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={() => saveResponse()}
          rows={6}
          className="w-full rounded-xl border border-slate-200/60 shadow-sm p-3 text-sm"
          placeholder="Notiere hier deine Gedanken…"
        />
        <div className="flex items-center justify-end mt-2">
          <button
            onClick={handleAiOptimize}
            disabled={aiLoading || !canOptimize}
            className={`btn btn-ghost ${aiLoading || !canOptimize ? "opacity-60 cursor-not-allowed" : ""}`}
            aria-busy={aiLoading}
            title={canOptimize ? "Formulierung mit KI verbessern" : "Bitte zuerst etwas eingeben"}
          >
            {aiLoading ? "Optimieren…" : "✨ Mit KI optimieren"}
          </button>
        </div>
        {err && <div className="mt-2 text-sm text-red-600">{err}</div>}
      </div>

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
