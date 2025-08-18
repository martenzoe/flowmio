// src/routes/PhaseExport.tsx
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";

type Phase = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  order_index: number | null;
};
type ModuleRow = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  order_index: number | null;
};
type Lesson = {
  id: string;
  module_id: string;
  slug: string;
  title: string;
  order_index: number;
  kind: "intro" | "chapter";
  body_md: string | null;
  content_json: any | null;
};
type UResponse = {
  lesson_id: string;
  data_json: any;
  updated_at: string;
};

export default function PhaseExport() {
  const { phaseSlug = "" } = useParams();
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState<Phase | null>(null);
  const [modules, setModules] = useState<ModuleRow[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [responses, setResponses] = useState<Record<string, UResponse>>({});
  const [userName, setUserName] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);

      // Phase
      const { data: ph } = await supabase
        .from("phases")
        .select("id,title,slug,description,order_index")
        .eq("slug", phaseSlug)
        .maybeSingle();
      if (!alive || !ph) {
        setPhase(null);
        setLoading(false);
        return;
      }
      setPhase(ph as Phase);

      // Module
      const { data: ms } = await supabase
        .from("modules")
        .select("id,title,slug,description,order_index")
        .eq("phase_id", ph.id)
        .order("order_index", { ascending: true });
      const mods = (ms ?? []) as ModuleRow[];
      if (!alive) return;
      setModules(mods);

      // Lessons
      let allLessons: Lesson[] = [];
      if (mods.length) {
        const { data: ls } = await supabase
          .from("module_lessons")
          .select("id,module_id,slug,title,order_index,kind,body_md,content_json")
          .in("module_id", mods.map((m) => m.id))
          .order("order_index", { ascending: true });
        allLessons = (ls ?? []) as Lesson[];
      }
      if (!alive) return;
      setLessons(allLessons);

      // Nutzername für Deckblatt
      const { data: u } = await supabase.auth.getUser();
      if (u.user?.id) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", u.user.id)
          .maybeSingle();
        setUserName(prof?.full_name || "");
      }

      // Antworten laden
      if (u.user?.id && allLessons.length) {
        const { data: rs } = await supabase
          .from("user_lesson_responses")
          .select("lesson_id,data_json,updated_at")
          .eq("user_id", u.user.id)
          .in("lesson_id", allLessons.map((l) => l.id));
        const map: Record<string, UResponse> = {};
        (rs ?? []).forEach((r: any) => (map[r.lesson_id] = r as UResponse));
        if (alive) setResponses(map);
      }

      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [phaseSlug]);

  const modulesWithLessons = useMemo(() => {
    const byModule: Record<string, Lesson[]> = {};
    lessons.forEach((l) => {
      if (!byModule[l.module_id]) byModule[l.module_id] = [];
      byModule[l.module_id].push(l);
    });
    Object.values(byModule).forEach((arr) => arr.sort((a, b) => a.order_index - b.order_index));
    return modules.map((m) => ({ module: m, lessons: byModule[m.id] ?? [] }));
  }, [modules, lessons]);

  const stats = useMemo(() => {
    let fields = 0,
      filled = 0;
    lessons.forEach((l) => {
      const r = responses[l.id];
      if (Array.isArray(r?.data_json?.blocks)) {
        const bs = r!.data_json.blocks as Array<{ id: string; text: string }>;
        fields += bs.length || (Array.isArray(l.content_json?.prompts) ? l.content_json.prompts.length : 1);
        filled += bs.filter((b) => String(b.text ?? "").trim().length).length;
      } else {
        fields += 1;
        const has =
          (Array.isArray(r?.data_json?.selections) && r!.data_json.selections.length) ||
          (typeof r?.data_json?.notes === "string" && r!.data_json.notes.trim().length);
        if (has) filled += 1;
      }
    });
    return { fields, filled };
  }, [lessons, responses]);

  function handlePrint() {
    window.print();
  }

  if (loading) return <div className="p-6">Bereite Export vor…</div>;
  if (!phase) return <div className="p-6 text-red-600">Phase nicht gefunden.</div>;

  const dateStr = new Date().toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });

  return (
    <div className="mx-auto max-w-4xl p-6 print:p-0">
      {/* Toolbar (nur Bildschirm) */}
      <div className="no-print flex items-center justify-between mb-6">
        <Link to={`/app/academy/${phase.slug}`} className="btn btn-ghost">
          ← Zurück zur Phase
        </Link>
        <button onClick={handlePrint} className="btn btn-primary">
          Als PDF speichern
        </button>
      </div>

      {/* Deckblatt */}
      <section className="print-page bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="text-sm opacity-70">Flowmioo — Founder Academy</div>
        <h1 className="text-2xl font-semibold mt-1">{phase.title}</h1>
        {phase.description && <p className="mt-2 text-sm opacity-80 whitespace-pre-wrap">{phase.description}</p>}

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <InfoCard label="Nutzer" value={userName || "—"} />
          <InfoCard label="Datum" value={dateStr} />
          <InfoCard label="Module in Phase" value={String(modules.length)} />
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <InfoCard
            label="Kapitel gesamt"
            value={String(lessons.filter((l) => l.kind === "chapter").length)}
          />
          <InfoCard label="Antwort-Felder (gefüllt/gesamt)" value={`${stats.filled} / ${stats.fields}`} />
          <InfoCard label="Export" value="Persönliche Antworten" />
        </div>
      </section>

      {/* Module */}
      {modulesWithLessons.map(({ module, lessons }, mi) => (
        <section
          key={module.id}
          className="print-page bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mt-6"
        >
          <h2 className="text-xl font-semibold">{`Modul ${module.order_index ?? mi + 1}: ${module.title}`}</h2>
          {module.description && <p className="mt-1 text-sm opacity-80">{module.description}</p>}

          {/* Intro (Kurzfassung) */}
          {(() => {
            const intro = lessons.find((l) => l.kind === "intro");
            if (!intro) return null;
            const introText =
              intro.body_md?.trim() ||
              (typeof intro.content_json?.lead === "string" ? String(intro.content_json.lead) : "");
            if (!introText) return null;
            return (
              <div className="mt-3 rounded-xl bg-slate-50 border border-slate-200/60 p-3">
                <div className="text-sm opacity-70">Intro</div>
                <div className="text-sm whitespace-pre-wrap">{introText}</div>
              </div>
            );
          })()}

          {/* Kapitel */}
          <div className="mt-4 space-y-5">
            {lessons
              .filter((l) => l.kind === "chapter")
              .map((l, li) => (
                <article key={l.id} className="rounded-xl border border-slate-200/60 p-4 break-inside-avoid">
                  <h3 className="font-medium">{`Kapitel ${li + 1}: ${l.title}`}</h3>
                  {renderLessonAnswers(l, responses[l.id])}
                </article>
              ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200/70 p-3">
      <div className="text-[11px] opacity-60">{label}</div>
      <div className="text-sm font-medium">{value}</div>
    </div>
  );
}

function renderLessonAnswers(lesson: Lesson, resp?: UResponse) {
  // MultiPrompts?
  const prompts: Array<{ id?: string; question?: string }> = Array.isArray(lesson.content_json?.prompts)
    ? lesson.content_json.prompts
    : [];

  // Antworten
  const blocks: Array<{ id: string; text: string }> = Array.isArray(resp?.data_json?.blocks)
    ? resp!.data_json.blocks
    : [];

  const selections: string[] = Array.isArray(resp?.data_json?.selections) ? resp!.data_json.selections : [];
  const notes: string = typeof resp?.data_json?.notes === "string" ? resp!.data_json.notes : "";

  if (prompts.length) {
    const byId: Record<string, string> = {};
    blocks.forEach((b) => (byId[b.id] = String(b.text ?? "")));
    const answered = prompts
      .map((p, idx) => {
        const id = p.id || `q${idx + 1}`;
        const text = (byId[id] || "").trim();
        return { question: String(p.question || `Frage ${idx + 1}`), text };
      })
      .filter((x) => x.text.length > 0);

    if (!answered.length) return <EmptyHint />;

    return (
      <div className="mt-2 space-y-3">
        {answered.map((a, i) => (
          <div key={i}>
            <div className="text-sm font-medium">{a.question}</div>
            <div className="mt-1 text-sm whitespace-pre-wrap print-answer">{a.text}</div>
          </div>
        ))}
      </div>
    );
  }

  if (!selections.length && !notes.trim().length) return <EmptyHint />;
  return (
    <div className="mt-2 space-y-2">
      {selections.length > 0 && (
        <ul className="list-disc ml-5 text-sm">
          {selections.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ul>
      )}
      {notes.trim().length > 0 && <div className="text-sm whitespace-pre-wrap print-answer">{notes}</div>}
    </div>
  );
}

function EmptyHint() {
  return <div className="mt-2 text-sm opacity-60 italic">Keine Eingaben in diesem Kapitel.</div>;
}
