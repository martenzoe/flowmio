// src/app/pages/Dashboard.tsx
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';

type ModuleRow = {
  id: string;
  title: string;
  slug: string;
};

export default function Dashboard() {
  const [name, setName] = useState<string | null>(null);
  const [modules, setModules] = useState<ModuleRow[]>([]);
  const [completed, setCompleted] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const total = modules.length;
  const progress = useMemo(() => {
    if (!total) return 0;
    return Math.min(100, Math.round((completed / total) * 100));
  }, [completed, total]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [{ data: u }, { data: profile }] = await Promise.all([
        supabase.auth.getUser(),
        supabase.from('profiles').select('full_name').maybeSingle(),
      ]);
      if (!alive) return;

      const display =
        profile?.full_name ||
        (u.user?.user_metadata?.full_name as string | undefined) ||
        u.user?.email ||
        null;
      setName(display);

      const [{ data: mods }, { data: prog }] = await Promise.all([
        supabase.from('modules').select('id,title,slug').order('title', { ascending: true }),
        supabase.from('user_module_progress').select('id,completed').eq('completed', true),
      ]);
      if (!alive) return;

      setModules(mods ?? []);
      setCompleted((prog ?? []).length);
      setLoading(false);
    })();
    return () => { alive = false; };
  }, []);

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start gap-4">
          <div className="text-3xl leading-none">🐱</div>
          <div className="min-w-[260px] flex-1">
            <h1 className="text-xl md:text-2xl font-semibold">
              Miau! Schön, dass du wieder da bist{name ? `, ${firstName(name)}` : ''}!
            </h1>
            <p className="mt-1 text-sm opacity-80">Bereit für deinen nächsten Gründerschritt?</p>

            <div className="mt-3">
              <div className="flex items-center justify-between text-xs opacity-70 mb-1">
                <span>Du hast {completed} von {total || '…'} Modulen abgeschlossen</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-slate-900" style={{ width: `${progress}%` }} />
              </div>
            </div>
          </div>

          <div className="ml-auto">
            <button className="rounded-xl border border-slate-300 px-4 py-2 hover:bg-slate-50">
              Weiterlernen
            </button>
          </div>
        </div>
      </div>

      {/* Tools-Grid */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold">Deine Flowmioo Tools im Überblick</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <ToolCard icon="📘" title="Businessplan-Generator" desc="Dein smarter Businessplan – Modul für Modul" meta="2 von 7 Abschnitten fertig" action="Öffnen" />
          <ToolCard icon="🎓" title="Gründer-Akademie" desc="Videolektionen, Übungen und Reflexionsfragen zum Mitmachen" meta={`${completed} von ${total || '…'} Modulen abgeschlossen`} action="Öffnen" />
          <ToolCard icon="🧰" title="Gründer-Kit" desc="Worksheets, Checklisten und Vorlagen zum Download" meta="12 Downloads verfügbar" action="Öffnen" />
          <ToolCard icon="🧭" title="Entscheidungshilfe" desc="Interaktive Tools, um Klarheit bei Gründungsfragen zu gewinnen" meta="4 Tools verfügbar" action="Öffnen" />
          <ToolCard icon="🗂️" title="Kanbanboard" desc="Visualisiere deine Schritte – behalte den Überblick" meta="8 Aufgaben offen" action="Öffnen" />
          <ToolCard icon="ℹ️" title="Wie geht was?" desc="Gewerbe anmelden, Bankkonto eröffnen u.v.m." meta="Guides & Checklisten" action="Öffnen" />
        </div>
      </section>

      {/* Empfehlung + Fortschritt */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="text-xl">🐾</div>
            <div className="flex-1">
              <h3 className="font-medium">Tägliche Empfehlung</h3>
              <p className="text-sm opacity-80 mt-1">Dein nächster Schritt: Überarbeite dein Angebot im Businessplan-Modul.</p>
              <button className="mt-3 rounded-xl border border-slate-300 px-3 py-1.5 hover:bg-slate-50 text-sm">Los geht’s!</button>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="font-medium">Dein Fortschritt</h3>
          <div className="mt-2 text-3xl font-semibold">42</div>
          <div className="text-sm opacity-70 -mt-1">Tage seit Beginn deiner Gründungsreise</div>
          <div className="mt-3 flex items-center gap-2 text-lg">
            <span className="opacity-60">Du bist auf einem guten Weg!</span>
          </div>
          <div className="mt-3 flex items-center gap-2 text-slate-700">
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i} className={`inline-flex h-8 w-8 items-center justify-center rounded-full border ${i < Math.max(1, Math.round((progress / 100) * 5)) ? 'bg-slate-900 text-white' : 'bg-white'}`}>
                {i + 1}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Motivation / Stempel */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
          <div className="lg:col-span-2">
            <h3 className="font-medium">Motivationsbereich</h3>
            <blockquote className="mt-2 rounded-xl border bg-slate-50 p-4 text-sm">
              „Der beste Weg, etwas vorherzusagen, ist, es zu erschaffen.“
              <div className="mt-2 text-right opacity-60">– Peter Drucker</div>
            </blockquote>
            <div className="mt-3 text-sm opacity-80">🎯 Dein Ziel: Dein Weg zum Unternehmer</div>
          </div>
          <div className="lg:col-span-1">
            <div className="rounded-xl border p-4">
              <div className="flex items-center gap-2">
                <span className="text-amber-400">⭐</span>
                <div className="font-medium">Du hast 3 Flowmioo-Stempel gesammelt</div>
              </div>
              <div className="mt-2 grid grid-cols-6 gap-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className={`h-8 rounded ${i < 3 ? 'bg-amber-200' : 'bg-slate-100'}`} title={i < 3 ? 'gesammelt' : 'frei'} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs opacity-60">Mehr Tools & Vorlagen folgen – stay tuned 🚀</div>
    </div>
  );
}

/* ——— Unterkomponenten ——— */

function ToolCard(props: { icon: string; title: string; desc: string; meta: string; action: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="text-2xl leading-none">{props.icon}</div>
        <div className="flex-1">
          <div className="font-medium">{props.title}</div>
          <p className="text-sm opacity-80 mt-1">{props.desc}</p>
          <div className="mt-3 flex items-center justify-between">
            <div className="text-xs opacity-70">{props.meta}</div>
            <button className="rounded-xl border border-slate-300 px-3 py-1.5 hover:bg-slate-50 text-sm">{props.action}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function firstName(full: string) {
  const s = full.trim();
  return s.split(' ')[0] || s;
}
