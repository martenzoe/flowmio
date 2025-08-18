import { Link, useNavigate, useParams } from "react-router-dom";
import { useMemo } from "react";
import { supabase } from "../../lib/supabase";
import SidebarNav from "../../components/SidebarNav";
import MultiPrompts from "../../components/MultiPrompts";
import ChapterFallback, { ContentJson } from "../../components/ChapterFallback";
import { useLessonData } from "../../hooks/useLessonData";
import CompareLesson, { CompareContentJson } from "../../components/lesson/CompareLesson";
import QuizLesson, { QuizContentJson } from "../../components/lesson/QuizLesson";
import LikertLesson, { LikertContentJson } from "../../components/lesson/LikertLesson";

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

  const hasPrompts = Array.isArray((cj as any).prompts) && (cj as any).prompts.length > 0;
  const hasCompare = Array.isArray((cj as any).compareRows) && (cj as any).compareRows.length > 0;
  const hasQuiz = !!(cj as any).quiz && Array.isArray((cj as any).quiz.options);
  const hasLikert = !!(cj as any).likert && Array.isArray((cj as any).likert.items);

  if (loading) return <div className="p-6">Lade Kapitel…</div>;
  if (!moduleRow || !lesson) return <div className="p-6 text-red-600">Kapitel nicht gefunden.</div>;

  if (lesson.kind !== "chapter") {
    return (
      <div className="p-6">
        <p className="text-sm text-gray-600 mb-2">Diese Seite ist die Einführungsseite. Bitte ein Kapitel aus der Liste öffnen.</p>
        <Link className="text-blue-600 underline" to={`/app/modules/${moduleRow.slug}`}>
          Zur Einführungsseite
        </Link>
      </div>
    );
  }

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

          {/* Inhalt: interne Weiter-Buttons überall deaktivieren */}
          {hasLikert ? (
            <LikertLesson
                moduleRow={{ id: moduleRow.id, slug: moduleRow.slug, title: moduleRow.title }}
                lesson={{ id: lesson.id, slug: lesson.slug, title: lesson.title }}
                cj={cj as unknown as LikertContentJson}
                showNext={false}         // ← internen Weiter-Button aus
                // onNext weglassen, da optional
            />
          ) : hasPrompts ? (
            <MultiPrompts
              moduleRow={{ id: moduleRow.id, slug: moduleRow.slug, title: moduleRow.title }}
              lesson={{ id: lesson.id, slug: lesson.slug, title: lesson.title }}
              prompts={(cj as any).prompts}
              lead={(cj as any).lead}
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

          {/* Zentrale Navigation im Panel */}
          <div className="mt-4 flex items-center justify-between">
            <button onClick={goBack} className="btn btn-primary">Zurück</button>
            {nextChapter ? <button onClick={goNext} className="btn btn-primary">Weiter →</button> : <span />}
          </div>
        </div>

        {!nextChapter && (
          <div className="panel">
            <h3 className="font-medium mb-1">Abschluss des Moduls</h3>
            <p className="text-sm opacity-80">Großartig! Du hast den nächsten wichtigen Schritt gemacht.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link to={`/app/modules/${moduleRow.slug}`} className="btn btn-ghost">Zurück zu den Lernzielen</Link>
              {nextModule ? (
                <Link to={`/app/modules/${nextModule.slug}`} className="btn btn-primary">Weiter zum nächsten Modul</Link>
              ) : (
                <Link to={phase ? `/app/academy/${phase.slug}` : "/app/academy"} className="btn btn-primary">
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
