// src/routes/PhaseDetail.tsx
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';

type Phase = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
};

type ModuleRow = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  order_index: number | null;
};

export default function PhaseDetail() {
  const { phaseSlug = '' } = useParams();
  const [phase, setPhase] = useState<Phase | null>(null);
  const [modules, setModules] = useState<ModuleRow[]>([]);
  const [loading, setLoading] = useState(true);

  const progressPct = useMemo(() => {
    if (!modules.length) return 0;
    return 0; // später echt berechnen
  }, [modules]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: p } = await supabase
        .from('phases')
        .select('id,title,slug,description')
        .eq('slug', phaseSlug)
        .maybeSingle();

      setPhase(p ?? null);

      if (p) {
        const { data: mods } = await supabase
          .from('modules')
          .select('id,title,slug,description,order_index')
          .eq('phase_id', p.id)
          .order('order_index', { ascending: true });

        setModules((mods ?? []) as ModuleRow[]);
      } else {
        setModules([]);
      }
      setLoading(false);
    })();
  }, [phaseSlug]);

  if (loading) return <div className="panel">Lade…</div>;
  if (!phase) return <div className="panel">Phase nicht gefunden.</div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Hauptspalte */}
      <div className="lg:col-span-8 space-y-4">
        <div className="panel">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-xl md:text-2xl font-semibold">{phase.title}</h1>
              {phase.description && <p className="text-sm opacity-80 mt-2">{phase.description}</p>}
            </div>
            <Link to={`/app/academy/${phase.slug}/export`} className="btn btn-ghost">
              Als PDF speichern
            </Link>
          </div>

          {/* Video/Intro Platzhalter */}
          <div className="mt-4 aspect-video w-full rounded-xl bg-slate-100 grid place-items-center text-sm text-slate-500">
            Phase-Intro (Video/Player)
          </div>

          <div className="mt-4">
            <h3 className="font-medium mb-2">In dieser Phase lernst du…</h3>
            <ul className="space-y-1 text-sm list-disc pl-5 opacity-80">
              <li>5 klar umrissene Themen – je Modul ein Thema.</li>
              <li>Jedes Modul startet mit einer Einführung und besteht aus mehreren Abschnitten.</li>
              <li>Dein Fortschritt wird gespeichert.</li>
            </ul>
          </div>
        </div>

        {/* Module der Phase */}
        <div className="panel">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold">Module in dieser Phase</h2>
            <div className="text-xs opacity-70">
              {modules.length} {modules.length === 1 ? 'Modul' : 'Module'}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {modules.map((m, i) => (
              <Link
                key={m.id}
                to={`/app/academy/${phase.slug}/${m.slug}`}
                className="card hover:translate-y-[1px] transition"
              >
                <div className="text-xs opacity-60 mb-1">Modul {i + 1}</div>
                <div className="font-medium">{m.title}</div>
                {m.description && (
                  <div className="text-sm opacity-70 mt-1 line-clamp-2">{m.description}</div>
                )}
                <div className="mt-3">
                  <button className="rounded-lg bg-white shadow px-3 py-1.5 text-sm hover:brightness-105">
                    Öffnen
                  </button>
                </div>
              </Link>
            ))}
            {!modules.length && <div className="card">Noch keine Module in dieser Phase.</div>}
          </div>
        </div>
      </div>

      {/* Rechte Infobox-Spalte */}
      <aside className="lg:col-span-4 space-y-4">
        <div className="panel">
          <h3 className="font-medium">Flowmioo-Tipps</h3>
          <div className="mt-2 space-y-2 text-sm">
            <Tip>Stärke dein Mindset – dein Warum muss dich tragen.</Tip>
            <Tip>Glaube an dich, bevor andere an deine Idee glauben.</Tip>
            <Tip>Ein positives Mindset öffnet Türen, die vorher verschlossen wirkten.</Tip>
          </div>
        </div>

        <div className="panel">
          <h3 className="font-medium">Dein Fortschritt</h3>
          <div className="mt-2 text-sm opacity-70">{Math.round(progressPct)}%</div>
          <div className="mt-2 progress-bar">
            <div className="progress-val" style={{ width: `${progressPct}%` }} />
          </div>
          <div className="mt-3">
            <button className="w-full rounded-lg bg-white shadow px-3 py-1.5 text-sm hover:brightness-105">
              Frag Flowmioo
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}

function Tip({ children }: { children: React.ReactNode }) {
  return <div className="tip">{children}</div>;
}
