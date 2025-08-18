// src/components/lesson/ReframeLesson.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../../lib/supabase";
import { callAi } from "../../lib/ai";

type Basic = { id: string; slug: string; title: string };

export type ReframeContentJson = {
  lead?: string;
  reframe: {
    title?: string;
    hint?: string;
    blocks: Array<{ id: string; text: string }>;
    frames: Array<{ id: string; text: string }>;
    correct: Record<string, string>; // {blockId: frameId}
    shuffle?: boolean;
  };
  generator?: {
    labelLeft?: string;
    labelRight?: string;
    placeholderLeft?: string;
    aiPromptType?: string; // default "reframe"
  };
};

type Assignments = Record<string, string | null>; // {blockId: frameId|null}
type GenItem = { input: string; output?: string; ts?: string };

/** Kompaktierung: 1 kurzer Satz + 3 nummerierte Schritte */
function compactReframe(raw: string): string {
  const text = (raw ?? "").replace(/\r/g, "").trim();
  if (!text) return "";

  const paras = text.split("\n").map((p) => p.trim()).filter(Boolean);
  const first = paras[0] ?? "";
  const sentences = first.split(/(?<=[.!?])\s+/).filter(Boolean);
  const head = sentences.slice(0, 2).join(" ").slice(0, 200); // max ~2 Sätze / 200 Zeichen

  const lines = text.split("\n").map((l) => l.trim());
  const bullets = lines
    .filter((l) => /^(\d+[\.)]|[-*•])\s+/.test(l))
    .slice(0, 3)
    .map((l, i) => `${i + 1}. ${l.replace(/^(\d+[\.)]|[-*•])\s+/, "")}`);

  const out = [head, "", ...bullets].join("\n").trim();
  return out || text.slice(0, 400);
}

export default function ReframeLesson({
  moduleRow,
  lesson,
  cj,
  onNext,
  showNext = true,
}: {
  moduleRow: Basic;
  lesson: Basic;
  cj: ReframeContentJson;
  onNext?: () => void;
  showNext?: boolean;
}) {
  const blocks = cj.reframe?.blocks ?? [];
  const frames = cj.reframe?.frames ?? [];
  const correct = cj.reframe?.correct ?? {};

  // ----- STATE
  const [assign, setAssign] = useState<Assignments>(() =>
    blocks.reduce<Assignments>((acc, b) => {
      acc[b.id] = null;
      return acc;
    }, {})
  );
  const [pool, setPool] = useState<string[]>(
    cj.reframe?.shuffle ? shuffle(frames.map((f) => f.id)) : frames.map((f) => f.id)
  );
  const [shaking, setShaking] = useState<Record<string, boolean>>({});
  const [gen, setGen] = useState<GenItem[]>([{ input: "" }]);
  const [saving, setSaving] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const debouncedRef = useRef<number | null>(null);
  const loaded = useRef(false);

  // ----- LOAD PREVIOUS
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

      // restore assignments
      const as: Assignments = blocks.reduce((acc, b) => {
        const val = dj?.reframe?.assignments?.[b.id];
        acc[b.id] = typeof val === "string" ? val : null;
        return acc;
      }, {} as Assignments);
      setAssign(as);
      // rebuild pool: frames, die NICHT zugewiesen sind
      const assignedIds = new Set(Object.values(as).filter(Boolean) as string[]);
      const available = frames.map((f) => f.id).filter((id) => !assignedIds.has(id));
      setPool(cj.reframe?.shuffle ? shuffle(available) : available);

      // restore generator rows
      const rows = Array.isArray(dj?.generator) ? (dj.generator as GenItem[]) : [];
      setGen(rows.length ? rows : [{ input: "" }]);

      loaded.current = true;
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson.id]);

  // ----- AUTOSAVE (debounced)
  useEffect(() => {
    if (!loaded.current) return;
    if (debouncedRef.current) window.clearTimeout(debouncedRef.current);
    debouncedRef.current = window.setTimeout(() => {
      void save();
    }, 500);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assign, gen]);

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
              reframe: { assignments: assign },
              generator: gen,
            },
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,lesson_id" }
        );
    } finally {
      setSaving(false);
    }
  }

  // ----- DND handlers
  function onDragStart(e: React.DragEvent, frameId: string) {
    e.dataTransfer.setData("text/frame-id", frameId);
    e.dataTransfer.effectAllowed = "move";
  }

  function onDrop(e: React.DragEvent, blockId: string) {
    e.preventDefault();
    const frameId = e.dataTransfer.getData("text/frame-id");
    if (!frameId) return;

    const isCorrect = correct?.[blockId] === frameId;
    if (!isCorrect) {
      setShaking((s) => ({ ...s, [blockId]: true }));
      setTimeout(() => setShaking((s) => ({ ...s, [blockId]: false })), 400);
      return;
    }

    setAssign((prev) => ({ ...prev, [blockId]: frameId }));
    setPool((prev) => prev.filter((id) => id !== frameId));
  }

  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  function removeAssignment(blockId: string) {
    const frameId = assign[blockId];
    if (!frameId) return;
    setAssign((prev) => ({ ...prev, [blockId]: null }));
    setPool((prev) => (cj.reframe?.shuffle ? shuffle([...prev, frameId]) : [...prev, frameId]));
  }

  const allSolved = useMemo(
    () => blocks.every((b) => assign[b.id] && correct[b.id] === assign[b.id]),
    [blocks, assign, correct]
  );

  // ----- Generator helpers
  function setGenInput(i: number, text: string) {
    setGen((prev) => prev.map((r, idx) => (idx === i ? { ...r, input: text } : r)));
  }
  function setGenOutput(i: number, text: string) {
    setGen((prev) => prev.map((r, idx) => (idx === i ? { ...r, output: text } : r)));
  }
  function clearGenOutput(i: number) {
    setGen((prev) => prev.map((r, idx) => (idx === i ? { ...r, output: "" } : r)));
  }
  function addGenRow() {
    setGen((prev) => [...prev, { input: "" }]);
  }

  async function optimizeAll() {
    if (optimizing) return;
    setOptimizing(true);
    try {
      const aiType = cj.generator?.aiPromptType ?? "reframe";
      const next = [...gen];

      for (let i = 0; i < next.length; i++) {
        const row = next[i];
        const src = (row.input ?? "").trim();
        if (!src) continue;

        const res = await callAi({
          promptType: aiType,
          temperature: 0.2,
          moduleId: moduleRow.id,
          inputs: {
            blockade: src,
            style:
              "Formatiere extrem knapp: 1 kurzer Reframe-Satz. Danach exakt 3 nummerierte, konkrete Schritte (je 1 Zeile). Keine Emojis, keine Floskeln.",
            module_slug: moduleRow.slug,
            lesson_slug: lesson.slug,
            lesson_title: lesson.title,
          },
        });
        setGenOutput(i, compactReframe(res.text));
      }
      await save();
    } finally {
      setOptimizing(false);
    }
  }

  // ----- RENDER
  return (
    <div className="space-y-6">
      {cj.lead && <p className="text-sm opacity-80">{cj.lead}</p>}

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="font-medium">{cj.reframe?.title ?? "Die Umkehrübung – Reframing"}</div>
        {cj.reframe?.hint && <p className="text-sm opacity-80 mt-1">{cj.reframe.hint}</p>}

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          <Header label="Blockade" />
          <Header label="Neues Frame (Reframe)" />

          {blocks.map((b) => {
            const targetFrameId = assign[b.id];
            const frameText = frames.find((f) => f.id === targetFrameId)?.text ?? "";
            const shakingCls = shaking[b.id] ? "animate-[shake_0.4s_ease]" : "";
            return (
              <React.Fragment key={b.id}>
                <div className="rounded-xl border bg-red-50 border-red-200 p-3 text-sm">
                  <div className="font-medium opacity-90">{b.text}</div>
                </div>

                <div
                  onDrop={(e) => onDrop(e, b.id)}
                  onDragOver={onDragOver}
                  className={`rounded-xl border border-slate-200 p-3 min-h-[52px] bg-white grid place-items-center text-sm relative ${shakingCls}`}
                >
                  {targetFrameId ? (
                    <div className="w-full flex items-start gap-2">
                      <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 grow">
                        {frameText}
                      </div>
                      <button
                        className="text-xs px-2 py-1 rounded border hover:bg-slate-50"
                        onClick={() => removeAssignment(b.id)}
                        title="Entfernen"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <span className="opacity-40">+</span>
                  )}
                </div>
              </React.Fragment>
            );
          })}
        </div>

        {/* Pool */}
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="text-xs opacity-70 mb-2">
            Ziehe die Blockaden auf die passenden Reframes, um zu sehen, wie du deine Ängste umdeuten kannst.
          </div>
          <div className="flex flex-wrap gap-2">
            {pool.map((id) => {
              const f = frames.find((x) => x.id === id)!;
              return (
                <div
                  key={id}
                  draggable
                  onDragStart={(e) => onDragStart(e, id)}
                  className="cursor-grab rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-sm active:cursor-grabbing"
                  title="Ziehen & ablegen"
                >
                  {f.text}
                </div>
              );
            })}
            {!pool.length && <span className="text-xs opacity-60">Alle Reframes wurden verwendet.</span>}
          </div>
        </div>
      </section>

      {/* Generator */}
      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="font-medium mb-3">Trainiere mit Flowmioo</div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div className="opacity-70">{cj.generator?.labelLeft ?? "Blockade"}</div>
          <div className="opacity-70">{cj.generator?.labelRight ?? "Neues Frame (Reframe)"}</div>

          {gen.map((row, i) => (
            <React.Fragment key={i}>
              <div>
                <textarea
                  value={row.input}
                  onChange={(e) => setGenInput(i, e.target.value)}
                  rows={2}
                  placeholder={cj.generator?.placeholderLeft ?? "Ich habe…"}
                  className="w-full rounded-xl border border-slate-200 shadow-sm p-2"
                />
                {i === gen.length - 1 && (
                  <button
                    onClick={addGenRow}
                    className="mt-1 text-xs rounded-lg border px-2 py-1 hover:bg-slate-50"
                    type="button"
                    title="Weitere Blockade hinzufügen"
                  >
                    + Weitere hinzufügen
                  </button>
                )}
              </div>

              <div className="relative">
                <textarea
                  value={row.output ?? ""}
                  onChange={(e) => setGenOutput(i, e.target.value)}
                  rows={5}
                  placeholder="Wird von Flowmioo generiert"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 whitespace-pre-line"
                />
                {!!(row.output && row.output.trim()) && (
                  <button
                    onClick={() => clearGenOutput(i)}
                    type="button"
                    title="Reframe löschen"
                    className="absolute top-2 right-2 text-xs px-2 py-1 rounded border bg-white hover:bg-slate-50"
                  >
                    ✕
                  </button>
                )}
              </div>
            </React.Fragment>
          ))}
        </div>

        <div className="mt-3 flex items-center justify-end gap-3">
          {saving && <span className="text-xs opacity-60">Speichere…</span>}
          <button
            onClick={optimizeAll}
            disabled={optimizing || gen.every((g) => !g.input.trim())}
            className={`btn btn-ghost ${optimizing || gen.every((g) => !g.input.trim()) ? "opacity-60 cursor-not-allowed" : ""}`}
            title="Alle Blockaden rechts knapp reframen (1 Satz + 3 Schritte)"
          >
            {optimizing ? "Optimieren…" : "✨ Mit KI optimieren"}
          </button>
        </div>
      </section>

      {/* Footer */}
      {showNext && (
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onNext}
            disabled={!allSolved && !!blocks.length}
            className={`btn btn-primary ${!allSolved && blocks.length ? "opacity-60 cursor-not-allowed" : ""}`}
          >
            Weiter →
          </button>
        </div>
      )}
    </div>
  );
}

function Header({ label }: { label: string }) {
  return (
    <div className="rounded-xl bg-white border border-slate-200 p-2 text-center text-sm font-medium sticky top-0">
      {label}
    </div>
  );
}

function shuffle<T>(arr: T[]) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
