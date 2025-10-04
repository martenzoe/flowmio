// src/routes/module/LessonPage.tsx
import { Link, useNavigate, useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import SidebarNav from "../../components/SidebarNav";
import MultiPrompts from "../../components/MultiPrompts";
import ChapterFallback, { ContentJson } from "../../components/ChapterFallback";
import { useLessonData } from "../../hooks/useLessonData";
import CompareLesson, { CompareContentJson } from "../../components/lesson/CompareLesson";
import QuizLesson, { QuizContentJson } from "../../components/lesson/QuizLesson";
import LikertLesson, { LikertContentJson } from "../../components/lesson/LikertLesson";
import ReframeLesson, { ReframeContentJson } from "../../components/lesson/ReframeLesson";
import PersonaEditor from "../../components/lesson/PersonaEditor";
import ValuesLesson, { ValuesContentJson } from "../../components/lesson/ValuesLesson";
import CardSelectLesson, { CardSelectContentJson } from "../../components/lesson/CardSelectLesson";
import RevenueSourcesLesson, {
  RevenueSourcesContentJson,
} from "../../components/lesson/RevenueSourcesLesson";
import WeeklyPlanLesson, {
  WeeklyPlanContentJson,
} from "../../components/lesson/WeeklyPlanLesson";

function normalize(s?: string) {
  if (!s) return "";
  return s.replace(/\r\n/g, "\n").replace(/\\n/g, "\n").trim();
}

type ClosingRow = { title: string | null; text: string | null; cta_label: string | null };

export default function LessonPage() {
  const { slug, lessonSlug } = useParams();
  const nav = useNavigate();

  const { loading, moduleRow, phase, intro, chapters, lesson, nextChapter, nextModule } =
    useLessonData(slug, lessonSlug);

  const cj = useMemo(() => {
    if (!lesson?.content_json || typeof lesson.content_json !== "object") return {} as ContentJson;
    return lesson.content_json as ContentJson;
  }, [lesson?.content_json]);

  const prevChapter = useMemo(() => {
    if (!lesson) return null;
    const idx = chapters.findIndex((c) => c.id === lesson.id);
    return idx > 0 ? chapters[idx - 1] : null;
  }, [chapters, lesson]);

  const isChapter = (lesson?.kind ?? "chapter") === "chapter";

  useEffect(() => {
    if (lesson && moduleRow && !isChapter) {
      nav(`/app/modules/${moduleRow.slug}`, { replace: true });
    }
  }, [isChapter, lesson, moduleRow, nav]);

  async function goNext() {
    if (!lesson || !moduleRow) return;
    try {
      const { data: u } = await supabase.auth.getUser();
      if (u.user?.id) {
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

        if (!nextChapter) {
          await supabase
            .from("user_module_progress")
            .upsert(
              {
                user_id: u.user.id,
                module_id: moduleRow.id,
                completed: true,
                completed_at: new Date().toISOString(),
              },
              { onConflict: "user_id,module_id" }
            );
        }
      }
    } finally {
      if (nextChapter) nav(`/app/modules/${moduleRow.slug}/lesson/${nextChapter.slug}`);
      else nav(`/app/modules/${moduleRow.slug}`);
    }
  }

  function goBack() {
    if (!moduleRow || !lesson) return;
    if (prevChapter) nav(`/app/modules/${moduleRow.slug}/lesson/${prevChapter.slug}`);
    else nav(`/app/modules/${moduleRow.slug}`);
  }

  // Feature-Flags (stabil & defensiv)
  const hasPrompts = Array.isArray((cj as any).prompts) && (cj as any).prompts.length > 0;
  const hasCompare = Array.isArray((cj as any).compareRows) && (cj as any).compareRows.length > 0;
  const hasQuiz = !!(cj as any).quiz && Array.isArray((cj as any).quiz.options);
  const hasLikert = !!(cj as any).likert && Array.isArray((cj as any).likert.items);
  const hasReframe =
    !!(cj as any).reframe &&
    Array.isArray((cj as any).reframe.blocks) &&
    Array.isArray((cj as any).reframe.frames) &&
    typeof (cj as any).reframe.correct === "object";

  const hasValues = useMemo(() => {
    const j: any = cj || {};
    return Boolean(j?.template === "values" || j?.values);
  }, [cj]);

  const hasCardSelect = useMemo(() => {
    const j: any = cj || {};
    return Boolean(j?.cardSelect && Array.isArray(j.cardSelect.cards));
  }, [cj]);

  // Einnahmequellen-Lesson
  const hasRevenueSources = useMemo(() => {
    const j: any = cj || {};
    return Boolean(j?.revenueSources || j?.template === "revenue-sources");
  }, [cj]);

  // Weekly-Plan-Lesson (4 Wochen Planer)
  const hasWeeklyPlan = useMemo(() => {
    const j: any = cj || {};
    return Boolean(j?.weeklyPlan || j?.template === "weekly-plan");
  }, [cj]);

  const hasPersonaEditor = useMemo(() => {
    const j: any = cj || {};
    const flag =
      j?.personaTemplate ||
      j?.persona_editor ||
      j?.personaEditor ||
      j?.template === "persona" ||
      j?.kind === "persona";
    const slugMatch = !!(lesson?.slug && /persona/i.test(lesson.slug));
    return Boolean(flag || slugMatch);
  }, [cj, lesson?.slug]);

  /* ---------------- Closing (aus DB + Fallback JSON) ---------------- */
  const [closingRow, setClosingRow] = useState<ClosingRow | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!moduleRow?.id) { setClosingRow(null); return; }
      const { data } = await supabase
        .from("module_closings")
        .select("title,text,cta_label")
        .eq("module_id", moduleRow.id)
        .maybeSingle();
      if (alive) setClosingRow((data as ClosingRow) ?? null);
    })();
    return () => { alive = false; };
  }, [moduleRow?.id]);

  const closing = useMemo(() => {
    if (nextChapter) return null;

    if (closingRow?.text && closingRow.text.trim().length > 0) {
      return {
        title: closingRow.title ?? "Abschluss des Moduls",
        text: normalize(closingRow.text),
        ctaLabel: closingRow.cta_label ?? null,
      };
    }

    const pick = (arr: any[]) => arr.find((x) => x && (typeof x === "string" || typeof x === "object"));

    const fromCurrent = pick([
      (cj as any)?.closing,
      (cj as any)?.abschluss,
      (cj as any)?.finish,
      (cj as any)?.outro,
      (cj as any)?.closing_md,
    ]);

    const introJson = (intro?.content_json ?? {}) as any;
    const fromIntro = pick([
      introJson?.closing,
      introJson?.abschluss,
      introJson?.finish,
      introJson?.outro,
      introJson?.closing_md,
    ]);

    const src = fromCurrent ?? fromIntro;
    if (!src) return null;

    if (typeof src === "string") {
      const text = normalize(src);
      return text ? { title: "Abschluss des Moduls", text, ctaLabel: null as string | null } : null;
    }

    const title = src.title ?? "Abschluss des Moduls";
    const text =
      normalize(src.body_md) ||
      normalize(src.body) ||
      normalize(src.text) ||
      normalize(src.closing_md) ||
      "";
    const ctaLabel = src?.cta?.label ?? src?.cta_label ?? null;

    return text ? { title, text, ctaLabel: ctaLabel as string | null } : null;
  }, [closingRow, cj, intro?.content_json, nextChapter]);

  if (loading) return <div className="p-6">Lade Kapitel…</div>;
  if (!moduleRow || !lesson) return <div className="p-6 text-red-600">Kapitel nicht gefunden.</div>;
  if (!isChapter) return null;

  return (
    <div className="grid gap-6 lg:grid-cols-[250px_minmax(0,1fr)]">
      <SidebarNav
        phase={phase}
        moduleRow={moduleRow}
        intro={intro}
        chapters={chapters}
        activeLessonSlug={lesson.slug}
      />

      <main className="space-y-5">
        <div className="panel">
          <h1 className="text-[22px] font-semibold leading-tight">{lesson.title}</h1>

          {hasValues ? (
            <ValuesLesson
              moduleRow={{ id: moduleRow.id, slug: moduleRow.slug, title: moduleRow.title }}
              lesson={{ id: lesson.id, slug: lesson.slug, title: lesson.title }}
              cj={cj as unknown as ValuesContentJson}
              onNext={goNext}
              showNext={false}
            />
          ) : hasLikert ? (
            <LikertLesson
              moduleRow={{ id: moduleRow.id, slug: moduleRow.slug, title: moduleRow.title }}
              lesson={{ id: lesson.id, slug: lesson.slug, title: lesson.title }}
              cj={cj as unknown as LikertContentJson}
              showNext={false}
            />
          ) : hasReframe ? (
            <ReframeLesson
              moduleRow={{ id: moduleRow.id, slug: moduleRow.slug, title: moduleRow.title }}
              lesson={{ id: lesson.id, slug: lesson.slug, title: lesson.title }}
              cj={cj as unknown as ReframeContentJson}
              onNext={goNext}
              showNext={false}
            />
          ) : hasRevenueSources ? (
            <RevenueSourcesLesson
              moduleRow={{ id: moduleRow.id, slug: moduleRow.slug, title: moduleRow.title }}
              lesson={{ id: lesson.id, slug: lesson.slug, title: lesson.title }}
              cj={cj as unknown as RevenueSourcesContentJson}
              onNext={goNext}
              showNext={false}
            />
          ) : hasWeeklyPlan ? (
            <WeeklyPlanLesson
              moduleRow={{ id: moduleRow.id, slug: moduleRow.slug, title: moduleRow.title }}
              lesson={{ id: lesson.id, slug: lesson.slug, title: lesson.title }}
              cj={cj as unknown as WeeklyPlanContentJson}
              onNext={goNext}
              showNext={false}
            />
          ) : hasPersonaEditor ? (
            <PersonaEditor
              moduleRow={{ id: moduleRow.id, slug: moduleRow.slug, title: moduleRow.title }}
              lesson={{ id: lesson.id, slug: lesson.slug, title: lesson.title }}
              onNext={goNext}
              showNext={false}
            />
          ) : hasCardSelect ? (
            <CardSelectLesson
              moduleRow={{ id: moduleRow.id, slug: moduleRow.slug, title: moduleRow.title }}
              lesson={{ id: lesson.id, slug: lesson.slug, title: lesson.title }}
              cj={cj as unknown as CardSelectContentJson}
              onNext={goNext}
              showNext={false}
            />
          ) : hasPrompts ? (
            <MultiPrompts
              moduleRow={{ id: moduleRow.id, slug: moduleRow.slug, title: moduleRow.title }}
              lesson={{ id: lesson.id, slug: lesson.slug, title: lesson.title }}
              prompts={(cj as any).prompts}
              lead={(cj as any).lead}
              body_md={(cj as any).body_md}
              video={(cj as any).video}
              pageAiPromptType={(cj as any).aiPromptType ?? "motivation"}
              onNext={goNext}
              showNext={false}
            />
          ) : hasCompare ? (
            <CompareLesson
              moduleRow={{ id: moduleRow.id, slug: moduleRow.slug, title: moduleRow.title }}
              lesson={{ id: lesson.id, slug: lesson.slug, title: lesson.title }}
              cj={cj as unknown as CompareContentJson}
              onNext={goNext}
              showNext={false}
            />
          ) : hasQuiz ? (
            <QuizLesson
              moduleRow={{ id: moduleRow.id, slug: moduleRow.slug, title: moduleRow.title }}
              lesson={{ id: lesson.id, slug: lesson.slug, title: lesson.title }}
              cj={cj as unknown as QuizContentJson}
              onNext={goNext}
              showNext={false}
            />
          ) : (
            <ChapterFallback
              moduleRow={{ id: moduleRow.id, slug: moduleRow.slug, title: moduleRow.title }}
              lesson={{ id: lesson.id, slug: lesson.slug, title: lesson.title }}
              cj={cj}
              onNext={goNext}
              showNext={false}
            />
          )}

          <div className="mt-4 flex items-center justify-between">
            <button onClick={goBack} className="btn btn-primary">Zurück</button>
            {nextChapter ? <button onClick={goNext} className="btn btn-primary">Weiter →</button> : <span />}
          </div>
        </div>

        {/* Abschluss-Panel: nur anzeigen, wenn aus DB/JSON Text geladen wurde */}
        {!nextChapter && closing && (
          <div className="panel">
            <h3 className="font-medium mb-2">{closing.title ?? "Abschluss des Moduls"}</h3>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm opacity-80 whitespace-pre-line">{closing.text}</p>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <Link to={`/app/modules/${moduleRow.slug}`} className="btn btn-ghost">
                Zurück zur Modul-Übersicht
              </Link>
              {nextModule ? (
                <Link to={`/app/modules/${nextModule.slug}`} className="btn btn-primary">
                  {closing.ctaLabel ?? "Weiter zum nächsten Modul"}
                </Link>
              ) : (
                <Link
                  to={phase ? `/app/academy/${phase.slug}` : "/app/academy"}
                  className="btn btn-primary"
                >
                  Zur Phase
                </Link>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
