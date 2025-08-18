import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import QuizQuestion, { QuizOption } from "./QuizQuestion";

export type QuizContentJson = {
  lead?: string;
  quiz: {
    scenario: string;
    options: QuizOption[];
    correctKey: string;
    explanation: string;
  };
};

export default function QuizLesson({
  moduleRow,
  lesson,
  cj,
  onNext,
  showNext = true,
}: {
  moduleRow: { id: string; slug: string; title: string };
  lesson: { id: string; slug: string; title: string };
  cj: QuizContentJson;
  onNext: () => void;
  showNext?: boolean;
}) {
  const { quiz, lead } = cj;
  const [selected, setSelected] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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
      const sel = (data?.data_json as any)?.quiz?.selected;
      setSelected(typeof sel === "string" ? sel : null);
    })();
  }, [lesson.id]);

  async function save(selectedKey: string) {
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
              quiz: {
                selected: selectedKey,
                correct: selectedKey === quiz.correctKey,
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

  const onSelect = (key: string) => {
    setSelected(key);
    void save(key);
  };

  return (
    <>
      <QuizQuestion
        lead={lead}
        scenario={quiz.scenario}
        options={quiz.options}
        selected={selected}
        onSelect={onSelect}
        correctKey={quiz.correctKey}
        explanation={quiz.explanation}
      />

      {showNext && (
        <div className="mt-6 flex items-center justify-end gap-3">
          {saving && <span className="text-xs opacity-60">Speichere…</span>}
          <button
            onClick={onNext}
            disabled={!selected}
            className={`btn btn-primary ${!selected ? "opacity-60 cursor-not-allowed" : ""}`}
          >
            Weiter →
          </button>
        </div>
      )}
    </>
  );
}
