import { useEffect, useMemo, useRef, useState } from "react";
import { callAi } from "../lib/ai";
import { supabase } from "../lib/supabase";
import InfoCallout from "./lesson/InfoCallout";

type ModuleRow = { id: string; slug: string; title: string };
type Lesson = { id: string; slug: string; title: string };

type PromptWire = {
  id?: string;
  type?: "textarea" | "radios" | "checkboxes";
  question?: string;
  label?: string;
  placeholder?: string;
  aiPromptType?: string;
  tip?: string;
  callout?: {
    title?: string;
    text?: string;
    bullets?: string[];
    footer?: string[];
  };
};

type PromptNorm = {
  id: string;
  type: "textarea" | "radios" | "checkboxes";
  question: string;
  placeholder?: string;
  aiPromptType?: string;
  callout?: {
    title?: string;
    text?: string;
    bullets?: string[];
    footer?: string[];
  };
};

type BlockState = { id: string; text: string };

function Spinner({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

function normalize(text?: string) {
  return (text ?? "").replace(/\\n/g, "\n");
}

export default function MultiPrompts({
  moduleRow,
  lesson,
  prompts,
  lead,
  pageAiPromptType = "motivation",
  onNext,
  showNext = true,
}: {
  moduleRow: ModuleRow;
  lesson: Lesson;
  prompts: PromptWire[];
  lead?: string;
  pageAiPromptType?: string;
  onNext: () => Promise<void> | void;
  showNext?: boolean;
}) {
  const norm: PromptNorm[] = useMemo(() => {
    return (prompts as PromptWire[]).map((p, i): PromptNorm => ({
      id: p.id ?? `q${i + 1}`,
      type: p.type ?? "textarea",
      question: (p.question ?? p.label ?? `Frage ${i + 1}`).trim(),
      placeholder: p.placeholder,
      aiPromptType: p.aiPromptType,
      callout: p.callout ?? (p.tip ? { text: p.tip } : undefined),
    }));
  }, [prompts]);

  const ids = useMemo(() => norm.map((p) => p.id), [norm]);
  const [blocks, setBlocks] = useState<BlockState[]>(ids.map((id) => ({ id, text: "" })));
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const [err, setErr] = useState("");
  const hasLoadedRef = useRef(false);

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

      if (data?.data_json?.blocks && Array.isArray(data.data_json.blocks)) {
        const byId: Record<string, string> = {};
        for (const b of data.data_json.blocks) if (b?.id) byId[b.id] = String(b.text ?? "");
        setBlocks(ids.map((id) => ({ id, text: byId[id] ?? "" })));
      } else {
        setBlocks(ids.map((id) => ({ id, text: "" })));
      }
      hasLoadedRef.current = true;
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson.id, ids.join("|")]);

  useEffect(() => {
    if (!hasLoadedRef.current) return;
    const t = setTimeout(() => void save(), 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blocks]);

  async function save(next?: BlockState[]) {
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
            data_json: { blocks: next ?? blocks },
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,lesson_id" }
        );
    } finally {
      setSaving(false);
    }
  }

  function updateBlock(id: string, text: string) {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, text } : b)));
  }

  function clearBlock(id: string) {
    const next = blocks.map((b) => (b.id === id ? { ...b, text: "" } : b));
    setBlocks(next);
    void save(next);
  }

  async function optimizeBlock(id: string) {
    setErr("");
    const idx = ids.indexOf(id);
    const def = norm[idx];
    const text = (blocks[idx]?.text ?? "").trim();
    const aiType = def?.aiPromptType ?? pageAiPromptType;
    if (!text.length) return;

    setAiLoading(id);
    try {
      const res = await callAi({
        promptType: aiType,
        inputs: {
          question: def?.question ?? "",
          user_notes: text,
          module_slug: moduleRow.slug,
          lesson_slug: lesson.slug,
          lesson_title: lesson.title,
          block_id: id,
        },
        moduleId: moduleRow.id,
        temperature: 0.4,
      });
      const newText = (res?.text ?? "").trim();
      if (newText) {
        const next = blocks.map((b) => (b.id === id ? { ...b, text: newText } : b));
        setBlocks(next);
        await save(next);
      }
    } catch (e: any) {
      setErr(e?.message ?? "Unbekannter Fehler beim Optimieren.");
    } finally {
      setAiLoading(null);
    }
  }

  return (
    <>
      {lead && <p className="mt-3 text-sm opacity-80">{lead}</p>}

      <div className="mt-4 space-y-5">
        {norm.map((p) => {
          const val = blocks.find((b) => b.id === p.id)?.text ?? "";
          const disabled = aiLoading !== null || !val.trim().length;

          return (
            <div key={p.id} className="rounded-xl border border-slate-200/60 shadow-sm p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="font-medium">{p.question}</div>
                <button onClick={() => clearBlock(p.id)} className="text-xs text-gray-500 hover:underline">
                  Antwort hier löschen
                </button>
              </div>

              <textarea
                value={val}
                onChange={(e) => updateBlock(p.id, e.target.value)}
                onBlur={() => save()}
                rows={4}
                className="mt-2 w-full rounded-xl border border-slate-200/60 shadow-sm p-3 text-sm"
                placeholder={p.placeholder ?? "Notiere hier deine Gedanken…"}
              />

              {p.callout && (
                <InfoCallout
                  title={p.callout.title}
                  text={normalize(p.callout.text)}
                  bullets={p.callout.bullets}
                  footer={p.callout.footer?.map(normalize)}
                />
              )}

              <div className="flex items-center justify-end mt-2">
                <button
                  onClick={() => optimizeBlock(p.id)}
                  disabled={disabled}
                  className={`btn btn-ghost ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
                  title={disabled ? "Bitte zuerst etwas eintragen" : "Formulierung mit KI verbessern"}
                >
                  {aiLoading === p.id ? (
                    <>
                      <Spinner />
                      <span>Optimieren…</span>
                    </>
                  ) : (
                    <>
                      <span>✨</span>
                      <span>Mit KI optimieren</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {showNext && (
        <div className="mt-5 flex items-center justify-end">
          {saving && <span className="text-xs opacity-60 mr-3">Speichere…</span>}
          <button onClick={() => void onNext()} className="btn btn-primary">
            <span>Weiter</span>
            <span>→</span>
          </button>
        </div>
      )}

      {err && <div className="mt-2 text-sm text-red-600">{err}</div>}
    </>
  );
}
