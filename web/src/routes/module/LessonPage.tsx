// src/routes/module/LessonPage.tsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { callAi } from "../../lib/ai";

type Lesson = {
  id: string;
  slug: string;
  title: string;
  order_index: number;
  kind: "intro" | "chapter";
  body_md: string | null;
  module_id: string;
};

type ModuleRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  phase_id?: string | null;
};

type Phase = { id: string; title: string; slug: string };

function Spinner({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
    </svg>
  );
}

export default function LessonPage() {
  const { slug, lessonSlug } = useParams();
  const navigate = useNavigate();

  const [moduleRow, setModuleRow] = useState<ModuleRow | null>(null);
  const [phase, setPhase] = useState<Phase | null>(null);
  const [allLessons, setAllLessons] = useState<Lesson[]>([]);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);

  // Formular-State
  const [selections, setSelections] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [err, setErr] = useState<string>("");

  // ----- Laden: Modul / Phase / Lessons / aktuelle Lesson -----
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);

      const { data: mod } = await supabase
        .from("modules")
        .select("id,slug,title,description,phase_id")
        .eq("slug", slug)
        .single();
      if (!alive || !mod) return;
      setModuleRow(mod as ModuleRow);

      const { data: ph } = await supabase
        .from("phases")
        .select("id,title,slug")
        .eq("id", mod.phase_id)
        .maybeSingle();
      if (alive) setPhase((ph ?? null) as Phase | null);

      const { data: ls } = await supabase
        .from("module_lessons")
        .select("*")
        .eq("module_id", mod.id)
        .order("order_index", { ascending: true });

      if (!alive) return;
      const lessons = (ls ?? []) as Lesson[];
      setAllLessons(lessons);
      setLesson(lessons.find((l) => l.slug === lessonSlug) ?? null);

      setLoading(false);
    })();
    return () => { alive = false; };
  }, [slug, lessonSlug]);

  // Intro/Chapters + Position
  const intro = useMemo(() => allLessons.find((l) => l.kind === "intro") ?? null, [allLessons]);
  const chapters = useMemo(() => allLessons.filter((l) => l.kind === "chapter"), [allLessons]);

  const currentIdx = useMemo(() => {
    if (!lesson) return -1;
    return chapters.findIndex((c) => c.id === lesson.id);
  }, [chapters, lesson]);

  const nextChapter = useMemo(() => {
    if (currentIdx < 0 || currentIdx + 1 >= chapters.length) return null;
    return chapters[currentIdx + 1];
  }, [chapters, currentIdx]);

  function toggleChoice(opt: string) {
    setSelections((prev) => (prev.includes(opt) ? prev.filter((o) => o !== opt) : [...prev, opt]));
  }

  // ----- Vorhandene Antworten laden -----
  useEffect(() => {
    (async () => {
      if (!lesson?.id) return;
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;

      const { data, error } = await supabase
        .from("user_lesson_responses")
        .select("data_json")
        .eq("user_id", u.user.id)
        .eq("lesson_id", lesson.id)
        .maybeSingle();

      if (!error && data?.data_json) {
        const dj = data.data_json as any;
        setSelections(Array.isArray(dj.selections) ? dj.selections : []);
        setNotes(typeof dj.notes === "string" ? dj.notes : "");
      }
    })();
  }, [lesson?.id]);

  // ----- Speichern (nimmt optional direkte Werte entgegen!) -----
  async function saveResponse(nextNotes?: string, nextSelections?: string[]) {
    if (!lesson?.id) return;
    setSaving(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;

      const notesToSave = typeof nextNotes === "string" ? nextNotes : notes;
      const selectionsToSave = Array.isArray(nextSelections) ? nextSelections : selections;

      await supabase
        .from("user_lesson_responses")
        .upsert(
          {
            user_id: u.user.id,
            lesson_id: lesson.id,
            data_json: { selections: selectionsToSave, notes: notesToSave },
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,lesson_id" }
        );
    } finally {
      setSaving(false);
    }
  }

  // ----- Fortschritt markieren -----
  async function markLessonCompleted() {
    if (!lesson?.id) return;
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;

      await supabase
        .from("user_lesson_progress")
        .upsert(
          {
            user_id: u.user.id,
            lesson_id: lesson.id,
            completed: true,
            completed_at: new Date().toISOString(),
          },
          { onConflict: "user_id,lesson_id" }
        );
    } catch { /* ok */ }
  }

  // ----- Weiter-Button -----
  async function goNext() {
    await saveResponse(); // speichert letzten Stand
    await markLessonCompleted();
    if (!moduleRow) return;
    if (nextChapter) navigate(`/app/modules/${moduleRow.slug}/lesson/${nextChapter.slug}`);
    else navigate(`/app/modules/${moduleRow.slug}`);
  }

  // ----- KI-Optimierung (speichert den neuen Text SOFORT) -----
  async function handleAiOptimize() {
    setErr("");
    if (!moduleRow || !lesson) return;

    if (!notes.trim() && selections.length === 0) {
      setErr("Bitte mindestens Stichpunkte eintragen.");
      return;
    }

    setAiLoading(true);
    try {
      const res = await callAi({
        promptType: "motivation",
        inputs: {
          selected: selections,
          user_notes: notes,
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
        await saveResponse(newText, selections); // <<— wichtig: neuen Text direkt speichern
      }
    } catch (e: any) {
      setErr(e?.message ?? "Unbekannter Fehler beim Optimieren.");
    } finally {
      setAiLoading(false);
    }
  }

  if (loading) return <div className="p-6">Lade Kapitel…</div>;
  if (!moduleRow || !lesson) return <div className="p-6 text-red-600">Kapitel nicht gefunden.</div>;
  if (lesson.kind !== "chapter") {
    return (
      <div className="p-6">
        <p className="text-sm text-gray-600 mb-2">Diese Seite ist die Einführungsseite. Bitte ein Kapitel aus der Liste öffnen.</p>
        <Link className="text-blue-600 underline" to={`/app/modules/${moduleRow.slug}`}>Zur Einführungsseite</Link>
      </div>
    );
  }

  // UI-Daten Kapitel 1
  const lead =
    "Viele Menschen träumen von der Selbstständigkeit – doch was treibt DICH an? Warum willst du gründen? Wähle hier deine Motivation aus:";
  const choices = [
    "Finanzielle Freiheit",
    "Ich möchte mein:e eigene:r Chef:in sein",
    "Ich möchte mehr Zeit für meine Freunde/Familie",
    "Stolz auf sich selbst sein und sich selbst verwirklichen",
    "Freie Zeiteinteilung",
    "Flexible Arbeitszeiten",
    "Erfüllung und ein selbstbestimmtes Leben",
    "Meinen Kindern eine bessere Zukunft bieten",
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-[250px_minmax(0,1fr)]">
      {/* LINKS – Modul-Navi */}
      <aside className="hidden lg:block sticky top-16 self-start">
        <div className="sidebar-box">
          <Link to={phase ? `/app/academy/${phase.slug}` : "/app/academy"} className="text-sm text-gray-500 hover:underline">
            ← Zurück zur Phase
          </Link>
          <h2 className="text-[17px] font-semibold mt-2 leading-tight">{moduleRow.title}</h2>

          <nav className="mt-3 space-y-2">
            <Link to={`/app/modules/${moduleRow.slug}`} className="nav-item">
              <div className="font-medium">Einführungsseite & Lernziele</div>
              {intro?.title && <div className="text-xs text-gray-500 mt-0.5">{intro.title}</div>}
            </Link>
            {chapters.map((c, idx) => {
              const active = c.slug === lesson.slug;
              return (
                <Link
                  key={c.id}
                  to={`/app/modules/${moduleRow.slug}/lesson/${c.slug}`}
                  className={`nav-item ${active ? "nav-item-active font-medium" : ""}`}
                >
                  <div className="text-[11px] opacity-60">{`Kapitel ${idx + 1}`}</div>
                  <div className="text-sm font-medium leading-tight">{c.title}</div>
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* MITTE – Kapitelinhalt */}
      <main className="space-y-5">
        <div className="panel">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <Link to={`/app/modules/${moduleRow.slug}`} className="text-sm text-gray-500 hover:underline">
                ← Zur Einführungsseite
              </Link>
              <h1 className="text-[22px] font-semibold leading-tight">{lesson.title}</h1>
            </div>
          </div>

          <p className="mt-3 text-sm opacity-80">{lead}</p>

          {/* Checkboxen */}
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {choices.map((opt) => {
              const checked = selections.includes(opt);
              return (
                <label
                  key={opt}
                  className={`flex items-center gap-3 rounded-xl border border-slate-200/60 shadow-sm p-3 cursor-pointer ${
                    checked ? "bg-blue-50 border-blue-200" : "hover:bg-slate-50"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={checked}
                    onChange={() => toggleChoice(opt)}
                  />
                  <span className="text-sm">{opt}</span>
                </label>
              );
            })}
          </div>

          {/* Textfeld + KI-Button */}
          <div className="mt-6">
            <div className="font-medium mb-2">Schreibe hier deine persönliche Motivation auf:</div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={() => saveResponse()}  // speichert beim Verlassen des Feldes
              rows={6}
              className="w-full rounded-xl border border-slate-200/60 shadow-sm p-3 text-sm"
              placeholder="Mit der Unternehmensgründung möchte ich…"
            />
            <div className="flex items-center justify-end mt-2">
              <button
                onClick={handleAiOptimize}
                disabled={aiLoading || (!notes.trim() && selections.length === 0)}
                className={`btn btn-ghost ${aiLoading || (!notes.trim() && selections.length === 0) ? "opacity-60 cursor-not-allowed" : ""}`}
                title={
                  notes.trim() || selections.length
                    ? "Formulierung mit KI verbessern"
                    : "Bitte zuerst Auswahl treffen oder Text eingeben"
                }
                aria-busy={aiLoading}
              >
                {aiLoading ? (
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
            {err && <div className="mt-2 text-sm text-red-600">{err}</div>}
          </div>

          {/* Tipp */}
          <div className="mt-6 rounded-xl bg-slate-50 border border-slate-200/60 shadow-sm p-3 text-sm">
            <div className="flex items-start gap-2">
              <div className="text-blue-600 text-lg leading-none">💡</div>
              <div>
                „Wenn’s mal schwer wird (und das wird es), liest du genau hier nach –
                und erinnerst dich: Darum hast du angefangen.“
              </div>
            </div>
          </div>

          {/* Weiter */}
          <div className="mt-6 flex items-center justify-end gap-3">
            {saving && <span className="text-xs opacity-60">Speichere…</span>}
            <button
              onClick={goNext}
              className="btn btn-primary"
              aria-label={nextChapter ? "Weiter zum nächsten Kapitel" : "Zur Modul-Übersicht"}
            >
              <span>Weiter</span>
              <span>→</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
