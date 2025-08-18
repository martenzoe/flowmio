// src/hooks/useLessonData.ts
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

export type Lesson = {
  id: string;
  slug: string;
  title: string;
  order_index: number;
  kind: "intro" | "chapter";
  body_md: string | null;
  module_id: string;
  content_json?: any;
};

export type ModuleRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  phase_id?: string | null;
  order_index?: number | null;
};

export type Phase = { id: string; title: string; slug: string };

export function useLessonData(slug?: string, lessonSlug?: string) {
  const [moduleRow, setModuleRow] = useState<ModuleRow | null>(null);
  const [phase, setPhase] = useState<Phase | null>(null);
  const [phaseModules, setPhaseModules] = useState<ModuleRow[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);

      // Modul
      const { data: mod } = await supabase
        .from("modules")
        .select("id,slug,title,description,phase_id,order_index") // <- description dabei (fix für TS)
        .eq("slug", slug)
        .single();

      if (!alive || !mod) {
        setLoading(false);
        return;
      }
      setModuleRow(mod as ModuleRow);

      // Phase
      const { data: ph } = await supabase
        .from("phases")
        .select("id,title,slug")
        .eq("id", mod.phase_id)
        .maybeSingle();
      if (alive) setPhase((ph ?? null) as Phase | null);

      // Module der Phase (für "Weiter zum nächsten Modul")
      if (mod?.phase_id) {
        const { data: pMods } = await supabase
          .from("modules")
          .select("id,slug,title,description,order_index,phase_id") // <- description mit selektieren
          .eq("phase_id", mod.phase_id)
          .order("order_index", { ascending: true });
        if (alive) setPhaseModules((pMods ?? []) as ModuleRow[]);
      }

      // Lessons des Moduls
      const { data: ls } = await supabase
        .from("module_lessons")
        .select("*")
        .eq("module_id", mod.id)
        .order("order_index", { ascending: true });

      if (!alive) return;
      const all = (ls ?? []) as Lesson[];
      setLessons(all);
      setLesson(all.find((l) => l.slug === lessonSlug) ?? null);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [slug, lessonSlug]);

  // abgeleitete Werte
  const intro = useMemo(() => lessons.find((l) => l.kind === "intro") ?? null, [lessons]);
  const chapters = useMemo(() => lessons.filter((l) => l.kind === "chapter"), [lessons]);

  const currentIdx = useMemo(() => {
    if (!lesson) return -1;
    return chapters.findIndex((c) => c.id === lesson.id);
  }, [chapters, lesson]);

  const nextChapter = useMemo(() => {
    if (currentIdx < 0 || currentIdx + 1 >= chapters.length) return null;
    return chapters[currentIdx + 1];
  }, [chapters, currentIdx]);

  const nextModule = useMemo(() => {
    if (!moduleRow || !phaseModules.length) return null;
    const idx = phaseModules.findIndex((m) => m.id === moduleRow.id);
    return idx >= 0 ? phaseModules[idx + 1] ?? null : null;
  }, [moduleRow, phaseModules]);

  return {
    loading,
    moduleRow,
    phase,
    intro,
    chapters,
    lessons,
    lesson,
    currentIdx,
    nextChapter,
    nextModule,
  };
}
