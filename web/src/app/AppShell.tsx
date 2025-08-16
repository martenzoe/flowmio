// src/app/AppShell.tsx
import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';

type Props = { children: ReactNode };

export default function AppShell({ children }: Props) {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState<string>('');
  const [displayName, setDisplayName] = useState<string>('');
  const [tokensLeft, setTokensLeft] = useState<number | null>(null);

  // Avatar-Initialen
  const initials = useMemo(() => {
    const src = displayName || email || '';
    const [a = '', b = ''] = src.split(' ');
    const first = a?.[0] ?? src?.[0] ?? '';
    const second = b?.[0] ?? '';
    return (first + second).toUpperCase() || 'U';
  }, [displayName, email]);

  useEffect(() => {
    (async () => {
      // User + Profil laden
      const [{ data: u }, { data: p }] = await Promise.all([
        supabase.auth.getUser(),
        supabase.from('profiles').select('full_name').maybeSingle(),
      ]);

      const mail = u.user?.email ?? '';
      setEmail(mail);
      setDisplayName(p?.full_name || (u.user?.user_metadata?.full_name as string | undefined) || '');

      // Token-Wallet laden
      const userId = u.user?.id;
      if (userId) {
        const { data } = await supabase
          .from('token_wallets')
          .select('tokens_total,tokens_used')
          .eq('user_id', userId)
          .maybeSingle();

        if (data) {
          setTokensLeft(Math.max(0, (data.tokens_total ?? 0) - (data.tokens_used ?? 0)));
        }
      }
    })();
  }, []);

  async function logout() {
    await supabase.auth.signOut();
    navigate('/auth', { replace: true });
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-slate-200 bg-white sticky top-0 h-screen">
        {/* Brand */}
        <div className="h-16 px-4 flex items-center gap-2 border-b border-slate-200">
          <div className="h-7 w-7 rounded bg-slate-900" />
          <span className="font-semibold">Flowmioo</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3">
          <SidebarLink to="/app" label="Dashboard" icon="📊" exact />
          <SidebarLink to="/app/modules" label="Alle Module" icon="📚" />
          <SidebarLink to="/app/plan" label="Dein Businessplan" icon="📝" />
          <SidebarLink to="/app/checklisten" label="Checklisten & Vorlagen" icon="🧾" />
          <SidebarLink to="/app/tipps" label="Flowmioo Tipps" icon="💡" />
          <SidebarLink to="/app/einstellungen" label="Einstellungen" icon="⚙️" />
        </nav>

        {/* Hilfe-Karte unten */}
        <div className="p-3 mt-auto">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-start gap-2">
              <div className="text-2xl leading-none">🐱</div>
              <div className="text-sm">
                <div className="font-medium">Brauchst du Hilfe?</div>
                <div className="opacity-70">Flowmioo steht dir jederzeit zur Verfügung!</div>
                <button
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-1.5 hover:bg-white text-sm"
                  onClick={() => navigate('/app/help')}
                >
                  Hilfe bekommen
                </button>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Header */}
        <header className="h-16 bg-white/80 backdrop-blur border-b border-slate-200 sticky top-0 z-10">
          <div className="h-full mx-auto max-w-7xl px-4 flex items-center gap-3">
            {/* Breadcrumb/Section name (optional) */}
            <div className="hidden sm:block text-sm opacity-60">
              {niceTitle(location.pathname)}
            </div>

            {/* Search */}
            <div className="flex-1 max-w-xl">
              <div className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-1.5">
                <span className="opacity-60">🔎</span>
                <input
                  className="w-full outline-none bg-transparent text-sm"
                  placeholder="Suche…"
                />
              </div>
            </div>

            {/* Tokens */}
            {tokensLeft !== null && (
              <span className="hidden md:inline rounded-full border border-slate-300 px-3 py-1 bg-white text-sm">
                Tokens: {tokensLeft.toLocaleString('de-DE')}
              </span>
            )}

            {/* Actions */}
            <button
              className="rounded-full border border-slate-300 h-9 w-9 grid place-items-center bg-white"
              title="Benachrichtigungen"
            >
              🔔
            </button>

            {/* User */}
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-full bg-slate-200 grid place-items-center text-xs font-semibold">
                {initials}
              </div>
              <div className="hidden sm:block text-sm">
                <div className="font-medium leading-none">
                  {displayName || email.split('@')[0] || 'Nutzer'}
                </div>
                <div className="text-xs opacity-60 leading-none">{email}</div>
              </div>
              <button
                onClick={logout}
                className="ml-2 rounded-lg border border-slate-300 px-3 py-1.5 hover:bg-white text-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="mx-auto max-w-7xl w-full px-4 py-6">{children}</main>
      </div>
    </div>
  );
}

/* ----------------- Helfer & Unterkomponenten ----------------- */

function SidebarLink(props: { to: string; label: string; icon?: string; exact?: boolean }) {
  return (
    <NavLink
      to={props.to}
      end={props.exact}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-lg px-3 py-2 text-sm mb-1
        ${isActive ? 'bg-slate-100 font-medium' : 'hover:bg-slate-50'}`
      }
    >
      <span className="w-5 text-center">{props.icon ?? '•'}</span>
      <span>{props.label}</span>
    </NavLink>
  );
}

function niceTitle(path: string) {
  const p = path.replace(/^\/+/, '');
  if (!p || p === 'app') return 'Dashboard';
  return p
    .replace(/^app\//, '')
    .split('/')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(' · ');
}
