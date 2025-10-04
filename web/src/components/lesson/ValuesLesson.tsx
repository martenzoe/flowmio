import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../../lib/supabase";

type ModuleRow = { id: string; slug: string; title: string };
type Lesson = { id: string; slug: string; title: string };

export type ValuesContentJson = {
  template?: "values";
  lead?: string;
  values?: {
    suggestions?: string[];
    min?: number;   // default 3
    max?: number;   // default 5
  };
  explain?: {
    question?: string;
    placeholder?: string;
  };
  tip_md?: string;
};

type PersistShape = {
  selected: string[];
  explanation: string;
};

function norm(s?: string) {
  return (s ?? "").replace(/\r\n/g, "\n").replace(/\\n/g, "\n");
}

function chipClass(active?: boolean) {
  return `inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm
    ${active ? "border-blue-300 bg-blue-50" : "border-slate-200 hover:bg-slate-50"}`;
}

export default function ValuesLesson({
  moduleRow,
  lesson,
  cj,
  onNext,
  showNext = true,
}: {
  moduleRow: ModuleRow;
  lesson: Lesson;
  cj: ValuesContentJson;
  onNext?: () => void;
  showNext?: boolean;
}) {
  const min = Math.max(1, cj?.values?.min ?? 3);
  const max = Math.max(min, cj?.values?.max ?? 5);

  const [available, setAvailable] = useState<string[]>(
    Array.from(new Set((cj?.values?.suggestions ?? []).map((s) => s.trim()).filter(Boolean)))
  );
  const [selected, setSelected] = useState<string[]>([]);
  const [explanation, setExplanation] = useState("");
  const [newVal, setNewVal] = useState("");
  const [saving, setSaving] = useState(false);
  const dndIdx = useRef<number | null>(null);

  // Load previously saved
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

      const saved = (data?.data_json ?? {}) as PersistShape;
      if (Array.isArray(saved?.selected)) setSelected(saved.selected);
      if (typeof saved?.explanation === "string") setExplanation(saved.explanation);

      // merge saved custom values into available list (avoid duplicates)
      const merged = Array.from(
        new Set([...(saved?.selected ?? []), ...available])
      );
      setAvailable(merged);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson.id]);

  // Autosave
  useEffect(() => {
    const t = setTimeout(() => {
      void save({ selected, explanation });
    }, 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, explanation]);

  async function save(data: PersistShape) {
    setSaving(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      await supabase.from("user_lesson_responses").upsert(
        {
          user_id: u.user.id,
          lesson_id: lesson.id,
          data_json: data,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,lesson_id" }
      );
    } finally {
      setSaving(false);
    }
  }

  // Actions
  function addToSelected(v: string) {
    v = v.trim();
    if (!v) return;
    if (selected.includes(v)) return;         // avoid duplicates
    if (selected.length >= max) return;       // cap
    setSelected([...selected, v]);
    if (!available.includes(v)) setAvailable((a) => [...a, v]);
  }

  function removeFromSelected(v: string) {
    setSelected(selected.filter((x) => x !== v));
  }

  function addCustom() {
    const v = newVal.trim();
    if (!v) return;
    setNewVal("");
    addToSelected(v);
  }

  // DnD (HTML5 – simple index based)
  function onDragStart(i: number) {
    dndIdx.current = i;
  }
  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
  }
  function onDrop(i: number) {
    const from = dndIdx.current;
    dndIdx.current = null;
    if (from === null || from === i) return;
    const arr = [...selected];
    const [moved] = arr.splice(from, 1);
    arr.splice(i, 0, moved);
    setSelected(arr);
  }

  const canProceed = selected.length >= min;

  return (
    <div className="space-y-5">
      {cj?.lead && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
          {norm(cj.lead)}
        </div>
      )}

      {/* Vorschlags-Karten */}
      <div>
        <div className="font-medium mb-2">Karten-Stapel „Meine Werte“</div>
        <div className="text-xs opacity-70 mb-2">Ziehe aus Vorschlägen (und ergänze eigene):</div>
        <div className="flex flex-wrap gap-2">
          {available.map((v) => (
            <button
              key={v}
              type="button"
              className={chipClass(selected.includes(v))}
              onClick={() => addToSelected(v)}
              disabled={selected.includes(v) || selected.length >= max}
              title={selected.includes(v) ? "Schon ausgewählt" : "Karte hinzufügen"}
            >
              {v}
              {!selected.includes(v) && <span className="text-xs opacity-60">+</span>}
            </button>
          ))}
          {/* eigene Eingabe */}
          <div className="inline-flex items-center gap-2">
            <input
              value={newVal}
              onChange={(e) => setNewVal(e.target.value)}
              className="rounded-xl border px-3 py-2 text-sm"
              placeholder="Eigenen Wert eingeben…"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCustom();
                }
              }}
            />
            <button
              type="button"
              className="rounded-xl border px-3 py-2 text-sm hover:bg-slate-50"
              onClick={addCustom}
              disabled={!newVal.trim() || selected.length >= max}
            >
              Hinzufügen
            </button>
          </div>
        </div>
        <div className="mt-2 text-xs opacity-70">
          Sortiere {min}–{max} Kernwerte nach Priorität.
        </div>
      </div>

      {/* Drop-Zone / Sortierliste */}
      <div>
        <div className="text-sm font-medium mb-2">Deine Kernwerte:</div>
        <div className="flex flex-wrap gap-2">
          {selected.map((v, i) => (
            <div
              key={v}
              draggable
              onDragStart={() => onDragStart(i)}
              onDragOver={onDragOver}
              onDrop={() => onDrop(i)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm cursor-move"
              title="Ziehen zum Sortieren"
            >
              <span className="text-xs opacity-60">{i + 1}.</span>
              {v}
              <button
                className="text-xs opacity-60 hover:opacity-100"
                onClick={() => removeFromSelected(v)}
                title="Entfernen"
              >
                ✕
              </button>
            </div>
          ))}
          {/* Dummy Drop-Slot */}
          <div
            onDragOver={onDragOver}
            onDrop={() => onDrop(selected.length)}
            className="grid place-items-center rounded-xl border border-dashed border-slate-300 px-6 py-6 text-xs text-slate-500"
            style={{ minWidth: 160 }}
          >
            +
          </div>
        </div>
      </div>

      {/* Erklärung */}
      <div>
        <div className="font-medium mb-1">
          {cj?.explain?.question ?? "Warum ist dir dein erster Wert besonders wichtig?"}
        </div>
        <textarea
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
          className="mt-1 w-full rounded-xl border border-slate-200/60 shadow-sm p-3 text-sm"
          rows={3}
          placeholder={cj?.explain?.placeholder ?? "Beschreibe es kurz …"}
        />
      </div>

      {/* Tipp */}
      {cj?.tip_md && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
          <span className="font-medium">Tipp:&nbsp;</span>
          <span className="opacity-80 whitespace-pre-line">{norm(cj.tip_md)}</span>
        </div>
      )}

      {showNext && (
        <div className="flex items-center justify-end gap-3">
          {saving && <span className="text-xs opacity-60">Speichere…</span>}
          <button
            className={`btn btn-primary ${!canProceed ? "opacity-60 cursor-not-allowed" : ""}`}
            onClick={() => canProceed && onNext && onNext()}
            disabled={!canProceed}
            title={!canProceed ? `Bitte mindestens ${min} Werte wählen` : ""}
          >
            Weiter →
          </button>
        </div>
      )}
    </div>
  );
}