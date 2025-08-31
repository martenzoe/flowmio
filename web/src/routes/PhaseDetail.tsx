// src/routes/PhaseDetail.tsx
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';

type Phase = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  content_json?: any | null;
  order_index?: number | null;
};

type ModuleRow = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  order_index: number | null;
};

function normalizeText(raw?: string) {
  if (!raw) return '';
  let s = raw.replace(/\r\n/g, '\n').replace(/\\n/g, '\n').trim();
  s = s.replace(/^\s*Flowmioo[’'`]?s Intro\s*/i, '');
  return s;
}
function toParagraphs(raw?: string) {
  const s = normalizeText(raw);
  if (!s) return [] as string[];
  return s.split(/\n{2,}/).map(p => p.replace(/\s*\n\s*/g, ' ').trim()).filter(Boolean);
}

function VideoPlayer({
  provider, videoRef, url, title = 'Phase-Intro',
}: { provider?: string | null; videoRef?: string | null; url?: string | null; title?: string }) {
  let src: string | null = null;
  if (provider && videoRef) {
    const p = provider.toLowerCase();
    if (p === 'youtube') src = `https://www.youtube.com/embed/${videoRef}`;
    else if (p === 'vimeo') src = `https://player.vimeo.com/video/${videoRef}`;
  } else if (url && /^https?:\/\//i.test(url)) src = url;

  if (!src) {
    return (
      <div className="aspect-video w-full rounded-xl bg-slate-100 grid place-items-center text-sm text-slate-500 border border-slate-200">
        Phase-Intro (Video/Player)
      </div>
    );
  }
  return (
    <div className="aspect-video w-full rounded-xl overflow-hidden border border-slate-200 bg-black">
      <iframe
        src={src}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        className="w-full h-full"
      />
    </div>
  );
}

function Tip({ children }: { children: React.ReactNode }) {
  return <div className="tip">{children}</div>;
}

export default function PhaseDetail() {
  const { phaseSlug = '' } = useParams();
  const [phase, setPhase] = useState<Phase | null>(null);
  const [modules, setModules] = useState<ModuleRow[]>([]);
  const [loading, setLoading] = useState(true);

  const progressPct = useMemo(() => (modules.length ? 0 : 0), [modules]);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const { data: p } = await supabase
        .from('phases')
        .select('id,title,slug,description,content_json,order_index')
        .eq('slug', phaseSlug)
        .maybeSingle();

      if (!alive) return;
      setPhase((p ?? null) as Phase | null);

      if (p?.id) {
        const { data: mods } = await supabase
          .from('modules')
          .select('id,title,slug,description,order_index')
          .eq('phase_id', p.id)
          .order('order_index', { ascending: true });
        if (alive) setModules((mods ?? []) as ModuleRow[]);
      } else {
        if (alive) setModules([]);
      }
      if (alive) setLoading(false);
    })();
    return () => { alive = false; };
  }, [phaseSlug]);

  if (loading) return <div className="panel">Lade…</div>;
  if (!phase) return <div className="panel">Phase nicht gefunden.</div>;

  // Inhalte aus JSON (Intro liegt entweder im Root oder unter "intro")
  const root = (phase.content_json ?? {}) as any;
  const intro = (root?.intro && typeof root.intro === 'object') ? root.intro : root;

  const headline = intro?.headline as string | undefined;
  const lead     = intro?.lead as string | undefined;
  const bodyMd   = intro?.body_md as string | undefined;

  // bullets: string[] oder {title?, body_md?}[]
  const rawBullets = Array.isArray(intro?.bullets) ? intro.bullets : [];
  const bullets: Array<{ title?: string; body_md?: string }> =
    rawBullets.map((b: any) => (typeof b === 'string' ? { body_md: b } : b));

  const videoProvider = intro?.video?.provider ?? null;
  const videoRef      = intro?.video?.ref ?? null;
  const videoUrl      = intro?.video?.url ?? null;

  const introParagraphs = toParagraphs(bodyMd ?? lead ?? phase.description ?? '');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Hauptspalte */}
      <div className="lg:col-span-8 space-y-4">
        {/* HERO / Einführung & Lernziele */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 md:p-6 shadow-sm">
          <div className="text-xs opacity-70 mb-1">Einführung und Lernziele</div>
          <h1 className="text-xl md:text-2xl font-semibold">{phase.title}</h1>

          <div className="mt-4">
            <VideoPlayer provider={videoProvider} videoRef={videoRef} url={videoUrl} />
          </div>

          {(headline || introParagraphs.length) && (
            <div className="mt-6">
              <h3 className="font-medium mb-2">{`Einführung${headline ? `: ${headline}` : ''}`}</h3>
              <div className="space-y-2 text-sm opacity-80">
                {introParagraphs.map((p, i) => <p key={i}>{p}</p>)}
              </div>
            </div>
          )}

          {bullets.length > 0 && (
            <div className="mt-6">
              <h3 className="font-medium mb-2">
                {`In ${phase.order_index ? `Phase ${phase.order_index}` : 'dieser Phase'} lernst du…`}
              </h3>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {bullets.map((b, i) => (
                  <li key={i} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 flex gap-3">
                    <div className="h-8 w-8 rounded-full border grid place-items-center shrink-0">{i + 1}</div>
                    <div>
                      {b.title && <div className="font-medium">{b.title}</div>}
                      {toParagraphs(b.body_md).map((p2, k) => (
                        <p key={k} className="text-sm opacity-80 mt-1">{p2}</p>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
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
                to={`/app/modules/${m.slug}`}
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
