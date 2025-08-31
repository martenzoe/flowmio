// src/components/MultiPrompts.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { callAi } from "../lib/ai";
import { supabase } from "../lib/supabase";
import InfoCallout from "./lesson/InfoCallout";

type ModuleRow = { id: string; slug: string; title: string };
type Lesson = { id: string; slug: string; title: string };

type Choice = { key: string; label: string };
type PromptWire = {
  id?: string;
  type?: "textarea" | "radios" | "checkboxes" | "input";
  question?: string;
  label?: string; // alias
  placeholder?: string;
  aiPromptType?: string;
  tip?: string; // alias für callout.text
  callout?: {
    title?: string;
    text?: string;
    bullets?: string[];
    footer?: string[];
  };
  options?: Array<string | { key: string; label?: string }>;
  rows?: number;
  input?: "short" | "long";
};

type PromptNorm = {
  id: string;
  baseType: "textarea" | "radios" | "checkboxes" | "input";
  renderAs: "textarea" | "input" | "radios" | "checkboxes";
  question: string;
  placeholder?: string;
  aiPromptType?: string;
  callout?: {
    title?: string;
    text?: string;
    bullets?: string[];
    footer?: string[];
  };
  options?: Choice[];
  rows?: number;
};

type BlockState = { id: string; text: string };

/* ---------- Utils ---------- */

function normalize(text?: string) {
  return (text ?? "").replace(/\r\n/g, "\n").replace(/\\n/g, "\n");
}

function toChoices(opts?: PromptWire["options"]): Choice[] {
  const raw = Array.isArray(opts) ? opts : [];
  return raw.map((o, i) =>
    typeof o === "string"
      ? { key: `opt${i + 1}`, label: o }
      : { key: o.key, label: o.label ?? o.key }
  );
}

/* ---------- Video ---------- */

function VideoBlock({
  video,
  title = "Video",
}: {
  video?:
    | {
        kind?: "placeholder" | "youtube" | "vimeo" | "file";
        url?: string;
        poster?: string;
        title?: string;
      }
    | {
        // legacy shape
        provider?: "youtube" | "vimeo" | "placeholder";
        ref?: string;
        url?: string;
        poster?: string;
        title?: string;
      }
    | string
    | boolean
    | null;
  title?: string;
}) {
  if (!video) return null;

  let kind = "";
  let src = "";
  let poster: string | undefined;
  let vtitle = (video as any)?.title ?? title;

  if (typeof video === "string" || typeof video === "boolean") {
    kind = "placeholder";
  } else {
    const v: any = video;
    poster = v.poster;

    if (v.kind) kind = String(v.kind).toLowerCase();

    if (!kind && v.provider) {
      const p = String(v.provider).toLowerCase();
      if (p === "placeholder") kind = "placeholder";
      if (p === "youtube") {
        kind = "youtube";
        if (v.ref) src = `https://www.youtube.com/embed/${v.ref}`;
      }
      if (p === "vimeo") {
        kind = "vimeo";
        if (v.ref) src = `https://player.vimeo.com/video/${v.ref}`;
      }
    }

    const url = v.url ?? "";
    if (!src && url) {
      if (/youtu\.be\/|youtube\.com/.test(url)) {
        kind = "youtube";
        const id =
          url.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{6,})/)?.[1] ?? url;
        src = `https://www.youtube.com/embed/${id}`;
      } else if (/vimeo\.com/.test(url)) {
        kind = "vimeo";
        const id = url.match(/vimeo\.com\/(?:video\/)?(\d+)/)?.[1] ?? url;
        src = `https://player.vimeo.com/video/${id}`;
      } else {
        kind = "file";
        src = url;
      }
    }

    if (kind === "file" && !src) kind = "placeholder";
  }

  if (kind === "youtube" || kind === "vimeo") {
    return (
      <div className="aspect-video w-full overflow-hidden rounded-2xl border border-slate-200 bg-black">
        <iframe
          className="w-full h-full"
          src={src}
          title={vtitle}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    );
  }

  if (kind === "file" && src) {
    return (
      <video className="w-full rounded-2xl border border-slate-200" controls poster={poster}>
        <source src={src} />
      </video>
    );
  }

  return (
    <div className="aspect-video grid place-items-center w-full rounded-2xl border border-slate-200 bg-slate-50 text-sm text-slate-500">
      Video folgt
    </div>
  );
}

/* ---------- Auswahl-Controls ---------- */

function RadioGroup({
  name,
  options,
  value,
  onChange,
}: {
  name: string;
  options: Choice[];
  value?: string;
  onChange: (key: string) => void;
}) {
  return (
    <div className="space-y-2">
      {options.map((o) => {
        const active = value === o.key;
        return (
          <label
            key={o.key}
            className={`flex items-center gap-3 rounded-xl border p-3 cursor-pointer transition ${
              active
                ? "border-blue-300 bg-blue-50"
                : "border-slate-200 hover:bg-slate-50"
            }`}
          >
            <input
              type="radio"
              className="h-4 w-4"
              name={name}
              checked={active}
              onChange={() => onChange(o.key)}
            />
            <span className="text-sm">{o.label}</span>
          </label>
        );
      })}
    </div>
  );
}

function CheckboxGroup({
  options,
  values,
  onToggle,
}: {
  options: Choice[];
  values: string[];
  onToggle: (key: string) => void;
}) {
  return (
    <div className="space-y-2">
      {options.map((o) => {
        const checked = values.includes(o.key);
        return (
          <label
            key={o.key}
            className={`flex items-center gap-3 rounded-xl border p-3 cursor-pointer transition ${
              checked
                ? "border-blue-300 ring-1 ring-blue-100 bg-blue-50"
                : "border-slate-200 hover:bg-slate-50"
            }`}
          >
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={checked}
              onChange={() => onToggle(o.key)}
            />
            <span className="text-sm">{o.label}</span>
          </label>
        );
      })}
    </div>
  );
}

/* ---------- Hauptkomponente ---------- */

export default function MultiPrompts({
  moduleRow,
  lesson,
  prompts,
  lead,
  body_md,
  video,
  pageAiPromptType = "motivation",
  onNext,
  showNext = true,
}: {
  moduleRow: ModuleRow;
  lesson: Lesson;
  prompts: PromptWire[];
  lead?: string;
  body_md?: string;
  video?: { kind?: "placeholder" | "youtube" | "vimeo" | "file"; url?: string; poster?: string; title?: string };
  pageAiPromptType?: string;
  onNext: () => Promise<void> | void;
  showNext?: boolean;
}) {
  /** Callout direkt nach dem Video (aus Prompts abgeleitet oder Default) */
  const afterVideoCallout = useMemo(() => {
    const p = (prompts ?? []).find((x: any) =>
      x?.type === "callout" ||
      (!!x?.tip && !x?.question && !x?.label && !x?.options)
    );
    if (p?.callout) return p.callout;
    if (p?.tip) return { text: p.tip };

    // Fallback für dieses Modul
    if (moduleRow.slug === "zielgruppe-verstehen") {
      return {
        title: "Vorschlag für eine einfache Validierungsaktion",
        text: "Sprich mit 3 Personen aus deiner Zielgruppe. Stelle offene Fragen, höre aktiv zu und sammle wörtliche Zitate.",
        bullets: [
          "Finde 3 echte Menschen (nicht nur Freund*innen).",
          "Frage nach konkreten Situationen statt Meinungen.",
          "Dokumentiere 3–5 Originalzitate.",
        ],
      };
    }
    return null;
  }, [prompts, moduleRow.slug]);

  /** Prompts ohne den Callout-Eintrag */
  const promptsForInputs = useMemo(
    () =>
      (prompts ?? []).filter(
        (x: any) =>
          !(
            x?.type === "callout" ||
            (!!x?.tip && !x?.question && !x?.label && !x?.options)
          )
      ),
    [prompts]
  );

  const norm: PromptNorm[] = useMemo(() => {
    return (promptsForInputs as PromptWire[]).map((p, i): PromptNorm => {
      const baseType = (p.type ?? "textarea") as PromptNorm["baseType"];
      const wantsShort =
        baseType === "input" || p.input === "short" || p.rows === 1;

      const renderAs: PromptNorm["renderAs"] =
        baseType === "radios"
          ? "radios"
          : baseType === "checkboxes"
          ? "checkboxes"
          : wantsShort
          ? "input"
          : "textarea";

      return {
        id: p.id ?? `q${i + 1}`,
        baseType,
        renderAs,
        question: (p.question ?? p.label ?? `Frage ${i + 1}`).trim(),
        placeholder: p.placeholder,
        aiPromptType: p.aiPromptType,
        callout: p.callout ?? (p.tip ? { text: p.tip } : undefined),
        options: toChoices(p.options),
        rows: p.rows,
      };
    });
  }, [promptsForInputs]);

  const ids = useMemo(() => norm.map((p) => p.id), [norm]);
  const [blocks, setBlocks] = useState<BlockState[]>(
    ids.map((id) => ({ id, text: "" }))
  );
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const [err, setErr] = useState("");
  const hasLoadedRef = useRef(false);

  // Laden
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
        for (const b of data.data_json.blocks)
          if (b?.id) byId[b.id] = String(b.text ?? "");
        setBlocks(ids.map((id) => ({ id, text: byId[id] ?? "" })));
      } else {
        setBlocks(ids.map((id) => ({ id, text: "" })));
      }
      hasLoadedRef.current = true;
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson.id, ids.join("|")]);

  // Autosave
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
      await supabase.from("user_lesson_responses").upsert(
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

  function setText(id: string, text: string, saveImmediately = false) {
    const next = blocks.map((b) => (b.id === id ? { ...b, text } : b));
    setBlocks(next);
    if (saveImmediately) void save(next);
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

    if (def.renderAs !== "textarea" || !text.length || !aiType || aiType === "none")
      return;

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
        const next = blocks.map((b) =>
          b.id === id ? { ...b, text: newText } : b
        );
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
      {/* Kurzer Lead oben */}
      {lead && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
          {normalize(lead)}
        </div>
      )}

      {/* Video – kleiner & mit Luft */}
      {video && (
        <div className="mt-6 md:mt-8 max-w-4xl mx-auto">
          <VideoBlock video={video} />
        </div>
      )}

      {/* Interview/Validierungs-Tipp zwischen Video und Inputs */}
      {afterVideoCallout && (
        <div className="mt-4">
          <InfoCallout
            title={afterVideoCallout.title}
            text={normalize(afterVideoCallout.text)}
            bullets={afterVideoCallout.bullets}
            footer={afterVideoCallout.footer?.map(normalize)}
          />
        </div>
      )}

      {/* Optionaler grauer Infotext */}
      {body_md && (
        <div className="mt-4 rounded-xl bg-slate-50 border border-slate-200 p-3">
          <div className="text-sm opacity-80 whitespace-pre-line">
            {normalize(body_md)}
          </div>
        </div>
      )}

      {/* Eingaben */}
      <div className="mt-4 space-y-5">
        {norm.map((p) => {
          const val = blocks.find((b) => b.id === p.id)?.text ?? "";
          const isTextarea = p.renderAs === "textarea";
          const isInput = p.renderAs === "input";
          const isRadios = p.renderAs === "radios";
          const isCheckboxes = p.renderAs === "checkboxes";

          const checkboxValues = isCheckboxes ? (val ? val.split(",") : []) : [];

          const promptAiType = p.aiPromptType ?? pageAiPromptType;
          const aiAllowed =
            isTextarea && !!promptAiType && promptAiType !== "none";
          const optimizeDisabled = !val.trim().length || aiLoading !== null;

          return (
            <div
              key={p.id}
              className="rounded-xl border border-slate-200/60 shadow-sm p-3"
            >
              <div className="font-medium">{normalize(p.question)}</div>

              {isTextarea && (
                <textarea
                  value={val}
                  onChange={(e) => setText(p.id, e.target.value)}
                  onBlur={() => save()}
                  rows={p.rows ?? 4}
                  className="mt-2 w-full rounded-xl border border-slate-200/60 shadow-sm p-3 text-sm"
                  placeholder={p.placeholder ?? "Notiere hier deine Gedanken…"}
                />
              )}

              {isInput && (
                <input
                  value={val}
                  onChange={(e) => setText(p.id, e.target.value)}
                  onBlur={() => save()}
                  className="mt-2 w-full rounded-xl border border-slate-200/60 shadow-sm px-3 py-2 text-sm"
                  placeholder={p.placeholder ?? ""}
                />
              )}

              {isRadios && (
                <div className="mt-2">
                  <RadioGroup
                    name={`radio-${p.id}`}
                    options={p.options ?? []}
                    value={val || undefined}
                    onChange={(key) => setText(p.id, key, true)}
                  />
                </div>
              )}

              {isCheckboxes && (
                <div className="mt-2">
                  <CheckboxGroup
                    options={p.options ?? []}
                    values={checkboxValues}
                    onToggle={(key) => {
                      const next = checkboxValues.includes(key)
                        ? checkboxValues.filter((k) => k !== key)
                        : [...checkboxValues, key];
                      setText(p.id, next.join(","), true);
                    }}
                  />
                </div>
              )}

              {/* Optionaler Callout pro Prompt */}
              {p.callout && (
                <div className="mt-3">
                  <InfoCallout
                    title={p.callout.title}
                    text={normalize(p.callout.text)}
                    bullets={p.callout.bullets}
                    footer={p.callout.footer?.map(normalize)}
                  />
                </div>
              )}

              {/* KI-Aktionen nur bei Textareas */}
              {aiAllowed && (
                <div className="flex items-center justify-end mt-2">
                  <button
                    onClick={() => optimizeBlock(p.id)}
                    disabled={optimizeDisabled}
                    className={`btn btn-ghost ${
                      optimizeDisabled ? "opacity-60 cursor-not-allowed" : ""
                    }`}
                    title={
                      optimizeDisabled
                        ? "Bitte zuerst etwas eintragen"
                        : "Formulierung mit KI verbessern"
                    }
                  >
                    {aiLoading === p.id ? "Optimieren…" : "✨ Mit KI optimieren"}
                  </button>
                  <button
                    onClick={() => clearBlock(p.id)}
                    className="ml-2 text-xs text-gray-500 hover:underline"
                  >
                    Antwort hier löschen
                  </button>
                </div>
              )}
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
