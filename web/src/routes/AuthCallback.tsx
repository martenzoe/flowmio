// src/routes/AuthCallback.tsx
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';

export default function AuthCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [msg, setMsg] = useState<string>('Verifiziere…');
  const [err, setErr] = useState<string | null>(null);

  const next = useMemo(() => params.get('next') || '/app', [params]);
  const lastEmail = (typeof window !== 'undefined' && localStorage.getItem('flowmio:lastEmail')) || '';

  useEffect(() => {
    const urlError = params.get('error');
    const errorDesc = params.get('error_description');
    const code = params.get('code');

    // 1) Explizite Fehler aus der URL zuerst anzeigen
    if (urlError) {
      setErr(decodeURIComponent(errorDesc || urlError));
      setMsg('');
      return;
    }

    (async () => {
      try {
        // 2) Wenn ein Code vorhanden ist: erst versuchen, ihn zu tauschen (OAuth/Magic)
        if (code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (!error && data?.session) {
            navigate(next, { replace: true });
            return;
          }
          // 2a) Typischer Signup-Confirm-Fall: kein PKCE-Verifier vorhanden
          //     -> NICHT als Fehler werten, sondern als „E-Mail bestätigt“
          if (error && /code.*verifier|invalid[_\s-]?request|invalid[_\s-]?grant/i.test(error.message)) {
            setErr(null);
            setMsg('E-Mail bestätigt. Du kannst dich jetzt einloggen.');
            return;
          }
          // sonst echter Fehler
          if (error) throw error;
        }

        // 3) Vielleicht hat detectSessionInUrl bereits eine Session gesetzt
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          navigate(next, { replace: true });
          return;
        }

        // 4) Fallback: Bestätigung ohne Session (Signup-Confirm)
        setErr(null);
        setMsg('E-Mail bestätigt. Du kannst dich jetzt einloggen.');
      } catch (e: any) {
        setErr(e?.message ?? 'Konnte Session nicht herstellen.');
        setMsg('');
      }
    })();
  }, [navigate, next, params]);

  async function resendConfirmation() {
    try {
      setErr(null);
      if (!lastEmail) throw new Error('Keine E-Mail gefunden. Bitte zurück zur Anmeldung.');
      setMsg('Sende Bestätigungs-Mail…');
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: lastEmail,
        options: { emailRedirectTo: redirectTo },
      });
      if (error) throw error;
      setMsg('Bestätigungs-Mail erneut gesendet. Prüfe dein Postfach.');
    } catch (e: any) {
      setMsg('');
      setErr(e?.message ?? 'Fehler beim Senden.');
    }
  }

  return (
    <div className="min-h-screen grid place-items-center p-6 bg-slate-50 text-slate-900">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold mb-2">Anmeldung</h1>
        {msg && <p className="text-sm text-slate-700">{msg}</p>}

        {err && (
          <div className="space-y-3">
            <p className="text-sm text-red-600 break-words">{err}</p>
            {lastEmail ? (
              <button
                onClick={resendConfirmation}
                className="rounded-xl border px-4 py-2 hover:bg-slate-50 text-sm"
              >
                Bestätigungs-Mail erneut senden
              </button>
            ) : null}
            <Link to="/auth" className="block text-sm underline underline-offset-4">
              Zurück zur Anmeldung
            </Link>
          </div>
        )}

        {!err && msg && (
          <div className="mt-4">
            <Link to="/auth" className="text-sm underline underline-offset-4">
              Zur Anmeldung
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
