// src/components/RequireAuth.tsx
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate, useLocation } from 'react-router-dom';

export default function RequireAuth({ children }: { children: ReactNode }) {
  const [checking, setChecking] = useState(true);
  const [authed, setAuthed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let alive = true;

    async function verify() {
      try {
        const { data } = await supabase.auth.getSession();
        if (!alive) return;
        const hasSession = !!data.session;
        setAuthed(hasSession);
        setChecking(false);

        if (!hasSession) {
          const next = `${location.pathname}${location.search || ''}${location.hash || ''}`;
          navigate(`/auth?next=${encodeURIComponent(next)}`, { replace: true });
        }
      } catch {
        if (!alive) return;
        setChecking(false);
        const next = `${location.pathname}${location.search || ''}${location.hash || ''}`;
        navigate(`/auth?next=${encodeURIComponent(next)}`, { replace: true });
      }
    }

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const isAuthed = !!session;
      setAuthed(isAuthed);
      if (!isAuthed) {
        const next = `${location.pathname}${location.search || ''}${location.hash || ''}`;
        navigate(`/auth?next=${encodeURIComponent(next)}`, { replace: true });
      }
    });

    verify();

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, [navigate, location.pathname, location.search, location.hash]);

  if (checking) {
    return (
      <div className="min-h-[50vh] grid place-items-center">
        <div className="text-sm opacity-70 animate-pulse">Lade…</div>
      </div>
    );
  }

  return <>{authed ? children : null}</>;
}
