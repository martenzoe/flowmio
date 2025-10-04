import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../../lib/supabase";

type Card = {
  key: string;
  title: string;
  summary?: string;       // kurze Front-Description
  description?: string;   // ausführlich, erscheint im Overlay
  pros?: string[];
  cons?: string[];
};

export type CardSelectContentJson = {
  lead?: string;
  cardSelect: {
    heading?: string;
    subheading?: string;
    cards: Card[];
    reflection?: {
      question: string;
      placeholder?: string;
    };
  };
};

function normalize(s?: string) {
  return (s ?? "").replace(/\\n/g, "\n");
}

export default function CardSelectLesson({
  moduleRow,
  lesson,
  cj,
  onNext,
  showNext = true,
}: {
  moduleRow: { id: string; slug: string; title: string };
  lesson: { id: string; slug: string; title: string };
  cj: CardSelectContentJson;
  onNext: () => void;
  showNext?: boolean;
}) {
  const data = cj.cardSelect;
  const cards = useMemo<Card[]>(() => data.cards ?? [], [data.cards]);

  const [selected, setSelected] = useState<string | null>(null);
  const [reflection, setReflection] = useState("");
  const [saving, setSaving] = useState(false);
  const [openKey, setOpenKey] = useState<string | null>(null);
  const hasLoaded = useRef(false);

  // persistiertes State laden
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
      const sel = typeof json?.card_select?.selected === "string" ? json.card_select.selected : null;
      const refl = typeof json?.card_select?.reflection === "string" ? json.card_select.reflection : "";
      setSelected(sel);
      setReflection(refl);
      hasLoaded.current = true;
    })();
  }, [lesson.id]);

  // Autosave
  useEffect(() => {
    if (!hasLoaded.current) return;
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
              card_select: { selected, reflection },
            },
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,lesson_id" }
        );
    } finally {
      setSaving(false);
    }
  }

  // ESC schließt Dialog
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpenKey(null);
    if (openKey) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openKey]);

  const activeCard = openKey ? cards.find((c) => c.key === openKey) ?? null : null;
  const choose = (k: string) => setSelected(k);

  return (
    <div className="space-y-5">
      {(cj.lead || data.heading || data.subheading) && (
        <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 space-y-2">
          {data.heading && <div className="font-medium">{data.heading}</div>}
          {data.subheading && <div className="text-sm opacity-80">{data.subheading}</div>}
          {cj.lead && <div className="text-sm opacity-80">{cj.lead}</div>}
        </div>
      )}

      {/* Nur Titel + kurze Summary auf der Karte */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((c, idx) => {
          const isSelected = selected === c.key;
          return (
            <div key={c.key} className="rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col min-h-[200px]">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 grid place-items-center rounded-full bg-blue-600 text-white text-xs">
                  {idx + 1}
                </div>
                <div className="font-medium">{c.title}</div>
              </div>

              {c.summary && (
                <div className="mt-2 text-sm opacity-80">{normalize(c.summary)}</div>
              )}

              <div className="mt-auto flex gap-2 pt-3">
                <button
                  onClick={() => choose(c.key)}
                  className={`btn btn-primary ${isSelected ? "!bg-blue-700" : ""}`}
                >
                  {isSelected ? "Gewählt" : "Auswählen"}
                </button>
                <button onClick={() => setOpenKey(c.key)} className="btn btn-ghost">
                  Mehr
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Reflexion */}
      {data.reflection?.question && (
        <div className="rounded-2xl border border-slate-200 p-4">
          <div className="font-medium mb-2">{data.reflection.question}</div>
          <textarea
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            className="w-full rounded-xl border border-slate-200/70 shadow-sm p-3 text-sm"
            rows={4}
            placeholder={data.reflection.placeholder ?? ""}
          />
          {saving && <div className="text-xs opacity-60 mt-1">Speichere…</div>}
        </div>
      )}

      {/* Weiter */}
      {showNext && (
        <div className="mt-4 text-right">
          <button
            onClick={onNext}
            className="btn btn-primary"
            disabled={!selected}
            title={!selected ? "Bitte wähle zunächst eine Karte" : ""}
          >
            Weiter →
          </button>
        </div>
      )}

      {/* Zentrales Overlay mit langer Beschreibung + Pros/Cons */}
      {activeCard && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-black/40">
          <div className="w-full max-w-2xl max-h-[85vh] overflow-auto rounded-2xl bg-white shadow-xl">
            <div className="p-5 border-b flex items-start justify-between gap-4">
              <div className="text-lg font-semibold">{activeCard.title}</div>
              <button
                onClick={() => setOpenKey(null)}
                className="px-2 py-1 rounded-lg hover:bg-slate-100"
                aria-label="Schließen"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              {activeCard.description && (
                <div className="text-[15px] leading-7 opacity-90 whitespace-pre-line">
                  {normalize(activeCard.description)}
                </div>
              )}

              {(activeCard.pros?.length || activeCard.cons?.length) && (
                <div className="grid md:grid-cols-2 gap-5">
                  {activeCard.pros?.length ? (
                    <div>
                      <div className="text-sm font-semibold text-emerald-700 mb-2">Vorteile</div>
                      <ul className="list-disc pl-5 space-y-1.5 text-[15px]">
                        {activeCard.pros.map((p, i) => <li key={i}>{p}</li>)}
                      </ul>
                    </div>
                  ) : null}
                  {activeCard.cons?.length ? (
                    <div>
                      <div className="text-sm font-semibold text-rose-700 mb-2">Nachteile</div>
                      <ul className="list-disc pl-5 space-y-1.5 text-[15px]">
                        {activeCard.cons.map((p, i) => <li key={i}>{p}</li>)}
                      </ul>
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            <div className="p-5 border-t flex items-center justify-end gap-2">
              <button onClick={() => setOpenKey(null)} className="btn btn-ghost">
                Zurück
              </button>
              <button
                onClick={() => {
                  choose(activeCard.key);
                  setOpenKey(null);
                }}
                className="btn btn-primary"
              >
                {selected === activeCard.key ? "Gewählt" : "Diesen Weg wählen"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
