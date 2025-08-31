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
  const [mobileOpen, setMobileOpen] = useState(false);

  const initials = useMemo(() => {
    const src = displayName || email || '';
    const [a = '', b = ''] = src.split(' ');
    const first = a?.[0] ?? src?.[0] ?? '';
    const second = b?.[0] ?? '';
    return (first + second).toUpperCase() || 'U';
  }, [displayName, email]);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      const userId = u.user?.id ?? null;

      setEmail(u.user?.email ?? '');

      // 🔹 Profiles immer gefiltert auf eigene ID (RLS-stabil)
      let profileName = '';
      if (userId) {
        const { data: p } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', userId)
          .maybeSingle();
        profileName =
          p?.full_name ||
          (u.user?.user_metadata?.full_name as string | undefined) ||
          '';
      }
      setDisplayName(profileName);

      // Token-Wallet
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
    <div className="min-h-screen bg-[#F5F7FB] text-slate-900 flex">
      {/* Desktop-Sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col sticky top-0 h-screen bg-white shadow-md">
        {/* Brand */}
        <div className="h-16 px-4 flex items-center gap-2">
          <div className="h-7 w-7 rounded bg-slate-900" />
          <span className="font-semibold">Flowmioo</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3">
          <SidebarLink to="/app" label="Dashboard" icon="📊" exact />
          <SidebarLink to="/app/academy" label="Gründer-Akademie" icon="🎓" />
          <SidebarLink to="/app/plan" label="Dein Businessplan" icon="📝" />
          <SidebarLink to="/app/checklisten" label="Checklisten & Vorlagen" icon="🧾" />
          <SidebarLink to="/app/tipps" label="Flowmioo Tipps" icon="💡" />
          <SidebarLink to="/app/einstellungen" label="Einstellungen" icon="⚙️" />
        </nav>

        {/* Hilfe-Karte unten */}
        <div className="p-3 mt-auto">
          <div className="card">
            <div className="flex items-start gap-2">
              <div className="text-2xl leading-none">🐱</div>
              <div className="text-sm">
                <div className="font-medium">Brauchst du Hilfe?</div>
                <div className="opacity-70">Flowmioo steht dir jederzeit zur Verfügung!</div>
                <button
                  className="mt-2 w-full rounded-lg bg-white shadow px-3 py-1.5 text-sm hover:brightness-105"
                  onClick={() => navigate('/app/help')}
                >
                  Hilfe bekommen
                </button>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <div className="absolute left-0 top-0 h-full w-72 bg-white shadow-xl p-3 overflow-y-auto">
            <div className="h-12 flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded bg-slate-900" />
                <span className="font-semibold">Flowmioo</span>
              </div>
              <button
                className="rounded-full bg-white shadow h-8 w-8 grid place-items-center"
                onClick={() => setMobileOpen(false)}
                aria-label="Schließen"
              >
                ✕
              </button>
            </div>
            <nav className="mt-2">
              <MobileLink to="/app" onClick={() => setMobileOpen(false)} icon="📊">Dashboard</MobileLink>
              <MobileLink to="/app/academy" onClick={() => setMobileOpen(false)} icon="🎓">Gründer-Akademie</MobileLink>
              <MobileLink to="/app/plan" onClick={() => setMobileOpen(false)} icon="📝">Dein Businessplan</MobileLink>
              <MobileLink to="/app/checklisten" onClick={() => setMobileOpen(false)} icon="🧾">Checklisten & Vorlagen</MobileLink>
              <MobileLink to="/app/tipps" onClick={() => setMobileOpen(false)} icon="💡">Flowmioo Tipps</MobileLink>
              <MobileLink to="/app/einstellungen" onClick={() => setMobileOpen(false)} icon="⚙️">Einstellungen</MobileLink>
            </nav>
          </div>
        </div>
      )}

      {/* Main column */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Header */}
        <header className="h-16 bg-white/85 backdrop-blur shadow-md sticky top-0 z-10">
          <div className="h-full mx-auto w-full max-w-[1600px] px-3 sm:px-4 flex items-center gap-3">
            {/* Mobile: Hamburger */}
            <button
              className="md:hidden rounded-full bg-white shadow h-9 w-9 grid place-items-center"
              onClick={() => setMobileOpen(true)}
              aria-label="Menü öffnen"
            >
              ☰
            </button>

            {/* Breadcrumb */}
            <div className="hidden sm:block text-sm opacity-60">
              {niceTitle(location.pathname)}
            </div>

            {/* Search */}
            <div className="flex-1 max-w-xl">
              <div className="flex items-center gap-2 rounded-xl bg-white shadow px-3 py-1.5">
                <span className="opacity-60">🔎</span>
                <input
                  className="w-full outline-none bg-transparent text-sm"
                  placeholder="Suche…"
                />
              </div>
            </div>

            {/* Tokens */}
            {tokensLeft !== null && (
              <span className="hidden md:inline rounded-full bg-white shadow px-3 py-1 text-sm">
                Tokens: {tokensLeft.toLocaleString('de-DE')}
              </span>
            )}

            {/* Actions */}
            <button
              className="rounded-full bg-white shadow h-9 w-9 grid place-items-center"
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
                className="ml-1 rounded-lg bg-white shadow px-3 py-1.5 text-sm hover:brightness-105"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="mx-auto w-full max-w-[1500px] px-3 sm:px-4 py-6 sm:py-8">
          {children}
        </main>
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
        `${isActive ? 'nav-item nav-item-active font-medium' : 'nav-item'} flex items-center gap-3 mb-1`
      }
    >
      <span className="w-5 text-center">{props.icon ?? '•'}</span>
      <span>{props.label}</span>
    </NavLink>
  );
}

function MobileLink({
  to, onClick, icon, children,
}: { to: string; onClick: () => void; icon?: string; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-xl px-3 py-2 text-base mb-1 ${isActive ? 'bg-blue-50 font-medium' : 'hover:bg-slate-50'}`
      }
    >
      <span className="w-6 text-center">{icon ?? '•'}</span>
      <span>{children}</span>
    </NavLink>
  );
}

function niceTitle(path: string) {
  const p = path.replace(/^\/+/, '');
  if (!p || p === 'app') return 'Dashboard';
  return p
    .replace(/^app\//, '')
    .split('/')
    .map((s) => s.replace(/-/g, ' '))             // 🔹 hübschere Slugs
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(' · ');
}
