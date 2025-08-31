// src/routes/module/ModuleLayout.tsx
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";

type Lesson = {
  id: string;
  slug: string;
  title: string | null;
  order_index: number;
  kind: string; // tolerant: "intro" | "chapter"
  body_md: string | null;
  content_json: any | null; // object ODER string
};

type ModuleRow = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  phase_id: string | null;
  order_index: number | null;
};

type Phase = { id: string; title: string; slug: string };
type Ump = { module_id: string; completed: boolean | null };

// ---------------- Helpers ----------------
function normalizeText(raw?: string | null) {
  if (!raw) return "";
  let s = String(raw).replace(/\r\n/g, "\n").replace(/\\n/g, "\n").trim();
  // Falls jemand die Überschrift ins Feld kopiert hat: entfernen
  s = s.replace(/^\s*Flowmioo[’'`]?s Intro\s*/i, "");
  return s;
}
function toParagraphs(raw?: string | null): string[] {
  const s = normalizeText(raw);
  if (!s) return [];
  return s.split(/\n{2,}/).map((p) => p.replace(/\s*\n\s*/g, " ").trim()).filter(Boolean);
}
function formatPhaseLine(phase?: Phase | null) {
  if (!phase) return "";
  const num =
    phase.slug?.match(/\d+/)?.[0] ??
    phase.title?.match(/\d+/)?.[0] ??
    "";
  const title = (phase.title ?? "").replace(/^PHASE\s*\d+\s*:\s*/i, "").trim();
  return `PHASE ${num}: ${title}`;
}

// ---------------- Component ----------------
export default function ModuleLayout() {
  const { slug } = useParams();
  const [moduleRow, setModuleRow] = useState<ModuleRow | null>(null);
  const [phase, setPhase] = useState<Phase | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [phaseModules, setPhaseModules] = useState<ModuleRow[]>([]);
  const [userProgress, setUserProgress] = useState<Record<string, Ump>>({});
  const [loading, setLoading] = useState(true);
  const [openStory, setOpenStory] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);

      // Modul
      const { data: mod } = await supabase
        .from("modules")
        .select("id,title,slug,description,phase_id,order_index")
        .eq("slug", slug)
        .maybeSingle();
      if (!alive) return;
      if (!mod) { setLoading(false); return; }
      setModuleRow(mod as ModuleRow);

      // Phase
      const { data: ph } = await supabase
        .from("phases")
        .select("id,title,slug")
        .eq("id", mod?.phase_id)
        .maybeSingle();
      if (alive) setPhase((ph ?? null) as Phase | null);

      // Module der Phase
      const { data: pMods } = await supabase
        .from("modules")
        .select("id,title,slug,description,order_index,phase_id")
        .eq("phase_id", mod?.phase_id)
        .order("order_index", { ascending: true });
      if (alive) setPhaseModules((pMods ?? []) as ModuleRow[]);

      // Lessons (Intro & Kapitel)
      const { data: ls } = await supabase
        .from("module_lessons")
        .select("id,slug,title,order_index,kind,body_md,content_json")
        .eq("module_id", mod?.id)
        .order("order_index", { ascending: true });
      if (alive) setLessons((ls ?? []) as Lesson[]);

      // Progress
      const { data: u } = await supabase.auth.getUser();
      if (u?.user?.id && pMods?.length) {
        const { data: ump } = await supabase
          .from("user_module_progress")
          .select("module_id, completed")
          .eq("user_id", u.user.id)
          .in("module_id", pMods.map((m) => m.id));
        const map: Record<string, Ump> = {};
        (ump ?? []).forEach((r) => (map[r.module_id] = r));
        if (alive) setUserProgress(map);
      }

      if (alive) setLoading(false);
    })();
    return () => { alive = false; };
  }, [slug]);

  // ---------- Hooks (immer vor Early-Returns!) ----------
  // Intro robust finden
  const intro = useMemo(() => {
    if (!lessons.length) return null;
    // 1) bevorzugt "einleitung"
    const bySlug = lessons.find((l) => (l.slug ?? "").trim().toLowerCase() === "einleitung");
    if (bySlug) return bySlug;
    // 2) sonst kind === intro
    const byKind = lessons.find((l) => (l.kind ?? "").toString().trim().toLowerCase() === "intro");
    return byKind ?? null;
  }, [lessons]);

  // Kapitel
  const chapters = useMemo(
    () => lessons.filter((l) => (l.kind ?? "").toString().trim().toLowerCase() === "chapter"),
    [lessons]
  );
  const firstChapter = useMemo(() => (chapters.length ? chapters[0] : null), [chapters]);

  // Modulindex in Phase
  const modIndexInPhase = useMemo(() => {
    if (!moduleRow || !phaseModules.length) return null;
    const idx = phaseModules.findIndex((m) => m.id === moduleRow.id);
    return idx >= 0 ? idx + 1 : null;
  }, [moduleRow, phaseModules]);

  // content_json sicher parsen
  const cj = useMemo(() => {
    const raw = intro?.content_json;
    if (!raw) return {} as any;
    if (typeof raw === "string") {
      try { return JSON.parse(raw); } catch { return {}; }
    }
    return (raw ?? {}) as any;
  }, [intro]);

  // ---------- Early-Returns ----------
  if (loading) return <div className="p-6">Lade Modul…</div>;
  if (!moduleRow) return <div className="p-6 text-red-600">Modul nicht gefunden.</div>;

  // ---------- Inhalte ----------
  // Flowmioo's Intro: body_md → tip → lead → modul.description
  const introTextSource =
    normalizeText(intro?.body_md) ||
    normalizeText(cj.tip) ||
    normalizeText(cj.lead) ||
    normalizeText(moduleRow.description) ||
    "";

  const introTextParas = toParagraphs(introTextSource);

  // Lernziel: bevorzugt content_json.body_md; Fallback lead
  const lernzielParas = toParagraphs(cj.body_md || cj.lead);

  // Goals
  const goals: string[] =
    Array.isArray(cj.goals) && cj.goals.length
      ? cj.goals
      : [
          "Du entwickelst ein klares Bild deiner Unternehmer-Vision.",
          "Du verstehst, warum Visualisierung dein stärkster Motivator ist.",
          "Du formulierst konkrete Ziele, die dich in Aktion bringen.",
        ];

  // Optionale Story
  const storyParas = toParagraphs(cj.story?.body_md);

  return (
    <div className="layout-3col">
      {/* LINKS */}
      <aside className="hidden lg:block sticky top-16 self-start">
        <div className="sidebar-box">
          <Link
            to={phase ? `/app/academy/${phase.slug}` : "/app/academy"}
            className="text-sm text-gray-500 hover:underline"
          >
            ← Zurück zur Phase
          </Link>
          <h2 className="text-[17px] font-semibold mt-2 leading-tight">{moduleRow.title}</h2>

          <nav className="mt-3 space-y-2">
            <Link to={`/app/modules/${moduleRow.slug}`} className="nav-item nav-item-active">
              <div className="font-medium">Einführungsseite & Lernziele</div>
              <div className="text-xs text-gray-500 mt-0.5">Einführung & Lernziele</div>
            </Link>
            {chapters.map((c, idx) => (
              <Link key={c.id} to={`/app/modules/${moduleRow.slug}/lesson/${c.slug}`} className="nav-item">
                <div className="text-[11px] opacity-60">{`Kapitel ${idx + 1}`}</div>
                <div className="text-sm font-medium leading-tight">{c.title}</div>
              </Link>
            ))}
          </nav>
        </div>
      </aside>

      {/* MITTE */}
      <main className="space-y-4">
        <div className="panel">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-[22px] font-semibold leading-tight">
                Modul {modIndexInPhase ?? ""}: {moduleRow.title}
              </h1>
              {phase && (
                <div className="text-sm opacity-70">{formatPhaseLine(phase)}</div>
              )}
            </div>
            {modIndexInPhase && phaseModules.length ? (
              <div className="text-xs opacity-70 mt-1">{`Modul ${modIndexInPhase} von ${phaseModules.length}`}</div>
            ) : null}
          </div>

          {/* Intro-Box */}
          <div className="mt-4 rounded-2xl bg-slate-100 border border-slate-200 p-5">
            <div className="font-medium mb-2">Flowmioo&apos;s Intro</div>
            <div className="space-y-2 text-sm opacity-80">
              {introTextParas.length
                ? introTextParas.map((p, i) => <p key={i}>{p}</p>)
                : <p className="italic opacity-60">Kein Introtext gefunden.</p>}
            </div>

            {cj.cta && cj.story?.body_md ? (
              <div className="mt-3">
                <button
                  onClick={() => setOpenStory(true)}
                  className="inline-flex items-center justify-center rounded-XL px-4 py-2 font-medium shadow-sm bg-blue-600 text-white hover:bg-blue-700"
                >
                  {cj.cta.label ?? "Geschichte lesen"}
                </button>
              </div>
            ) : null}
          </div>

          {/* Lernziele */}
          <div className="mt-4">
            <h3 className="font-semibold mb-2">Lernziel</h3>

            {lernzielParas.length ? (
              <div className="text-sm opacity-80 space-y-2">
                {lernzielParas.map((p, i) => <p key={i}>{p}</p>)}
              </div>
            ) : (
              <p className="text-sm opacity-80">
                Kurze Beschreibung, was du nach dem Modul sicher kannst.
              </p>
            )}

            <div className="mt-3 grid gap-3 md:grid-cols-3">
              {goals.map((text, i) => (
                <CardN key={i} n={i + 1} text={text} />
              ))}
            </div>

            {/* Start / Weiter */}
            <div className="mt-6 flex justify-end">
              {firstChapter ? (
                <Link to={`/app/modules/${moduleRow.slug}/lesson/${firstChapter.slug}`} className="btn btn-primary">
                  Weiter
                </Link>
              ) : (
                <button className="btn btn-primary opacity-50 cursor-not-allowed">Noch kein Kapitel</button>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* RECHTS */}
      <aside className="hidden lg:flex sticky top-16 self-start flex-col gap-4">
        <div className="panel">
          <h3 className="font-medium">Flowmioo-Tipps</h3>
          <div className="mt-3 space-y-2">
            {getTipsForModule(moduleRow.slug).map((t, i) => (
              <div key={i} className="tip">{t}</div>
            ))}
          </div>
        </div>

        <div className="panel">
          <h3 className="font-medium">Dein Fortschritt</h3>
          <div className="mt-3 space-y-3">
            {phaseModules.map((m, i) => {
              const st = userProgress[m.id];
              const label = st?.completed ? "Abgeschlossen" : st ? "In Bearbeitung" : "Nicht begonnen";
              const pct = st?.completed ? 100 : st ? 40 : 10;
              return (
                <div key={m.id}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span>{`Modul ${i + 1}`}</span>
                    <span className="opacity-70">{label}</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-val" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          <button className="mt-4 w-full rounded-lg bg-white shadow px-3 py-2 text-sm hover:brightness-105">
            Frag Flowmioo
          </button>
          <input className="mt-2 w-full rounded-lg border px-3 py-2 text-sm" placeholder="Stelle deine Frage…" />
        </div>
      </aside>

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
            <div className="p-5 text-slate-800">
              <div className="space-y-3 text-[15px] leading-7">
                {storyParas.map((p, i) => (<p key={i}>{p}</p>))}
              </div>
            </div>
            <div className="p-4 border-t text-right">
              <button onClick={() => setOpenStory(false)} className="btn btn-primary">Schließen</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CardN({ n, text }: { n: number; text: string }) {
  return (
    <div className="card">
      <div className="flex flex-col items-center mb-2">
        <div className="num-badge">{n}</div>
        <div className="num-underline mt-2" />
      </div>
      <div className="text-sm opacity-80 text-center">{text}</div>
    </div>
  );
}

function getTipsForModule(moduleSlug: string) {
  switch (moduleSlug) {
    case "finde-dein-warum":
      return [
        "Sei ehrlich zu dir – dein Warum muss dich bewegen.",
        "Denke groß, aber beginne beim echten Kern in dir.",
        "Schreibe es auf – Klarheit entsteht beim Formulieren.",
      ];
    default:
      return [
        "Formuliere dein Ziel in einem Satz.",
        "Brich es in 3 konkrete Schritte runter.",
        "Committe dich zu einem kleinen täglichen Fortschritt.",
      ];
  }
}
