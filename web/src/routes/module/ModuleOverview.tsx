// src/routes/module/ModuleOverview.tsx
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

type ModuleRow = { id: string; title: string; order_index: number };
type ChapterRow = { id: string; slug: string; title: string; order_index: number };

export default function ModuleOverview() {
  const { moduleSlug, phaseSlug } = useParams();
  const navigate = useNavigate();

  const [mod, setMod] = useState<ModuleRow | null>(null);
  const [chapters, setChapters] = useState<ChapterRow[]>([]);

  const baseUrl = useMemo(() => {
    return `/app/academy/phase/${phaseSlug}/module/${moduleSlug}`;
  }, [phaseSlug, moduleSlug]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data: m } = await supabase
        .from('modules')
        .select('id,title,order_index')
        .eq('slug', moduleSlug)
        .maybeSingle();

      if (!alive) return;
      if (!m) return;

      setMod({ id: m.id, title: m.title, order_index: m.order_index });

      const { data: ch } = await supabase
        .from('module_lessons')
        .select('id,slug,title,order_index')
        .eq('module_id', m.id)
        .order('order_index', { ascending: true });

      if (!alive) return;
      setChapters(ch ?? []);
    })();
    return () => { alive = false; };
  }, [moduleSlug]);

  const firstChapter = chapters[0];

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="text-xs opacity-70 mb-1">
          {`Modul ${mod?.order_index ?? ''} von 5`}
        </div>
        <h1 className="text-xl font-semibold mb-2">{mod?.title ?? 'Modul'}</h1>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="font-medium mb-1">Flowmioo's Intro</div>
          <p className="text-sm opacity-80">
            In diesem Modul arbeitest du fokussiert an einem klaren Schritt.
          </p>
        </div>

        <div className="mt-3 text-xs opacity-70">
          {chapters.length
            ? `0 von ${chapters.length} Kapiteln abgeschlossen`
            : 'Keine Kapitel angelegt'}
        </div>

        <div className="mt-3">
          <button
            disabled={!firstChapter}
            onClick={() => firstChapter && navigate(`${baseUrl}/lesson/${firstChapter.slug}`)}
            className="rounded-xl border border-slate-300 px-4 py-2 hover:bg-slate-50"
          >
            {firstChapter ? 'Jetzt mit Kapitel 1 starten' : 'Noch kein Kapitel angelegt'}
          </button>
        </div>
      </div>

      {/* Lernziele – Beispiel-Layout */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="font-medium">Lernziel</h3>
        <p className="text-sm opacity-80">Kurze Beschreibung, was du nach dem Modul sicher kannst.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="rounded-xl border p-4">
              <div className="h-6 w-6 rounded-full border grid place-items-center text-sm mb-2">
                {n}
              </div>
              <div className="text-sm opacity-80">
                {`Konkretes Lernziel #${n} für dieses Modul.`}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
