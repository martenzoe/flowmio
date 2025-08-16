import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";

type Lesson = {
  id: string;
  slug: string;
  title: string;
  order_index: number;
  kind: "intro" | "chapter";
  body_md: string | null;
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

export default function ModuleLayout() {
  const { slug } = useParams();
  const [moduleRow, setModuleRow] = useState<ModuleRow | null>(null);
  const [phase, setPhase] = useState<Phase | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [phaseModules, setPhaseModules] = useState<ModuleRow[]>([]);
  const [userProgress, setUserProgress] = useState<Record<string, Ump>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);

      // Modul
      const { data: mod } = await supabase
        .from("modules")
        .select("id,title,slug,description,phase_id,order_index")
        .eq("slug", slug)
        .single();
      if (!alive) return;
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

      // Lessons
      const { data: ls } = await supabase
        .from("module_lessons")
        .select("id,slug,title,order_index,kind,body_md")
        .eq("module_id", mod?.id)
        .order("order_index", { ascending: true });
      if (alive) setLessons((ls ?? []) as Lesson[]);

      // (optional) User-Progress
      const { data: u } = await supabase.auth.getUser();
      if (u.user?.id && pMods?.length) {
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
    return () => {
      alive = false;
    };
  }, [slug]);

  const intro = useMemo(() => lessons.find((l) => l.kind === "intro") ?? null, [lessons]);
  const chapters = useMemo(() => lessons.filter((l) => l.kind === "chapter"), [lessons]);
  const firstChapter = useMemo(() => (chapters.length ? chapters[0] : null), [chapters]);

  const modIndexInPhase = useMemo(() => {
    if (!moduleRow || !phaseModules.length) return null;
    const idx = phaseModules.findIndex((m) => m.id === moduleRow.id);
    return idx >= 0 ? idx + 1 : null;
  }, [moduleRow, phaseModules]);

  if (loading) return <div className="p-6">Lade Modul…</div>;
  if (!moduleRow) return <div className="p-6 text-red-600">Modul nicht gefunden.</div>;

  const tips = getTipsForModule(moduleRow.slug);

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
              {intro?.title && <div className="text-xs text-gray-500 mt-0.5">{intro.title}</div>}
            </Link>
            {chapters.map((c, idx) => (
              <Link
                key={c.id}
                to={`/app/modules/${moduleRow.slug}/lesson/${c.slug}`}
                className="nav-item"
              >
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
                <div className="text-sm opacity-70">
                  {`PHASE ${phaseTitlePrefix(phase.slug)}: ${phase.title}`}
                </div>
              )}
            </div>
            {modIndexInPhase && phaseModules.length ? (
              <div className="text-xs opacity-70 mt-1">{`Modul ${modIndexInPhase} von ${phaseModules.length}`}</div>
            ) : null}
          </div>

          {intro && (
            <div className="mt-4 muted">
              <div className="font-medium mb-1">Flowmioo's Intro</div>
              <p className="text-sm opacity-80 whitespace-pre-wrap">
                {intro.body_md?.length
                  ? intro.body_md
                  : "In diesem Modul arbeitest du fokussiert an einem klaren Schritt."}
              </p>
            </div>
          )}

          <div className="mt-4">
            <h3 className="font-semibold mb-2">Lernziel</h3>
                <p className="text-sm opacity-80">
                Du findest dein echtes Warum – klar, persönlich, motivierend. Keine Floskeln, sondern dein echter Antrieb:
                Wofür stehst du morgens auf? Warum willst du gründen? Und wofür lohnt sich jede Mühe?
                </p>

            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <CardN
                n={1}
                text="Dein persönliches Warum entdecken und schriftlich klar formulieren."
              />
              <CardN
                n={2}
                text="Motivation langfristig festhalten, um Durchhänger sicher zu überstehen."
              />
              <CardN
                n={3}
                text="Die Grundlage für alle künftigen Entscheidungen im Business legen."
              />
            </div>

            {/* Weiter/Start-Button */}
            <div className="mt-6 flex justify-end">
              {firstChapter ? (
                <Link
                  to={`/app/modules/${moduleRow.slug}/lesson/${firstChapter.slug}`}
                  className="btn btn-primary"
                >
                  Jetzt starten
                </Link>
              ) : (
                <button className="btn btn-primary opacity-50 cursor-not-allowed">
                  Noch kein Kapitel
                </button>
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
            {tips.map((t, i) => (
              <div key={i} className="tip">
                {t}
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <h3 className="font-medium">Dein Fortschritt</h3>
          <div className="mt-3 space-y-3">
            {phaseModules.map((m, i) => {
              const st = userProgress[m.id];
              const label = st?.completed
                ? "Abgeschlossen"
                : st
                ? "In Bearbeitung"
                : "Nicht begonnen";
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
          <input
            className="mt-2 w-full rounded-lg border px-3 py-2 text-sm"
            placeholder="Stelle deine Frage…"
          />
        </div>
      </aside>
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

function phaseTitlePrefix(slug?: string | null) {
  if (!slug) return "";
  const m = slug.match(/(\d+)/);
  return m ? m[1] : "";
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
