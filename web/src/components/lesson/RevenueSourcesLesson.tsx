import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../../lib/supabase";

type Source = {
  key: string;
  title: string;
  desc?: string;
};

export type RevenueSourcesContentJson = {
  lead?: string;
  revenueSources: {
    heading?: string;
    subheading?: string;
    multiple?: boolean; // default: true (Mehrfachauswahl)
    options: Source[];
    reflection?: {
      question: string;
      placeholder?: string;
    };
  };
};

function norm(s?: string) {
  return (s ?? "").replace(/\\n/g, "\n");
}

export default function RevenueSourcesLesson({
  moduleRow,
  lesson,
  cj,
  onNext,
  showNext = true,
}: {
  moduleRow: { id: string; slug: string; title: string };
  lesson: { id: string; slug: string; title: string };
  cj: RevenueSourcesContentJson;
  onNext: () => void;
  showNext?: boolean;
}) {
  const data = cj.revenueSources;
  const options: Source[] = useMemo(() => data.options ?? [], [data.options]);

  const [selected, setSelected] = useState<string[]>([]);
  const [reflection, setReflection] = useState("");
  const [saving, setSaving] = useState(false);
  const loadedRef = useRef(false);

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

      const json = (data?.data_json ?? {}) as any;
      const sel = Array.isArray(json?.revenue_sources?.selected)
        ? (json.revenue_sources.selected as string[])
        : [];
      const refl =
        typeof json?.revenue_sources?.reflection === "string"
          ? (json.revenue_sources.reflection as string)
          : "";
      setSelected(sel);
      setReflection(refl);
      loadedRef.current = true;
    })();
  }, [lesson.id]);

  // Autosave
  useEffect(() => {
    if (!loadedRef.current) return;
    const t = setTimeout(() => void save(), 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, reflection]);

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
              revenue_sources: {
                selected,
                reflection,
              },
            },
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,lesson_id" }
        );
    } finally {
      setSaving(false);
    }
  }

  function toggle(key: string) {
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }

  const multiple = data.multiple !== false;

  return (
    <div className="space-y-5">
      {(data.heading || data.subheading || cj.lead) && (
        <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 space-y-2">
          {data.heading && <div className="font-medium">{data.heading}</div>}
          {data.subheading && (
            <div className="text-sm opacity-80">{norm(data.subheading)}</div>
          )}
          {cj.lead && <div className="text-sm opacity-80">{norm(cj.lead)}</div>}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {options.map((o) => {
          const checked = selected.includes(o.key);
          return (
            <label
              key={o.key}
              className={`flex items-start gap-3 rounded-2xl border p-4 cursor-pointer transition ${
                checked
                  ? "border-blue-300 bg-blue-50"
                  : "border-slate-200 hover:bg-slate-50"
              }`}
            >
              <input
                type={multiple ? "checkbox" : "radio"}
                className="mt-1 h-4 w-4"
                checked={checked}
                onChange={() => toggle(o.key)}
                name="revenue-src"
              />
              <div>
                <div className="font-medium">{o.title}</div>
                {o.desc && (
                  <div className="text-sm opacity-80">{norm(o.desc)}</div>
                )}
              </div>
            </label>
          );
        })}
      </div>

      {data.reflection?.question && (
        <div className="rounded-2xl border border-slate-200 p-4">
          <div className="font-medium mb-2">{data.reflection.question}</div>
          <textarea
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            rows={4}
            className="w-full rounded-xl border border-slate-200/70 shadow-sm p-3 text-sm"
            placeholder={data.reflection.placeholder ?? ""}
          />
          {saving && (
            <div className="text-xs opacity-60 mt-1">Speichere…</div>
          )}
        </div>
      )}

      {showNext && (
        <div className="text-right">
          <button
            onClick={onNext}
            className="btn btn-primary"
            disabled={selected.length === 0}
            title={selected.length === 0 ? "Bitte mindestens eine Option wählen" : ""}
          >
            Weiter →
          </button>
        </div>
      )}
    </div>
  );
}
