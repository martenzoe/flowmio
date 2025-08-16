// src/routes/ResetPasswordPage.tsx
import { useEffect, useState, type FormEvent } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function ResetPasswordPage() {
  const [ready, setReady] = useState(false);
  const [pw, setPw] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [params] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null);
    try {
      const { error } = await supabase.auth.updateUser({ password: pw });
      if (error) throw error;
      setOk(true);
      const next = params.get('next') || '/app';
      setTimeout(() => navigate(next, { replace: true }), 800);
    } catch (e: any) {
      setErr(e.message ?? 'Fehler');
    } finally {
      setBusy(false);
    }
  }

  if (!ready) {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-50 text-slate-900">
        <div className="opacity-70">Link prüfen…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen grid place-items-center p-6 bg-slate-50 text-slate-900">
      <form onSubmit={submit} className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 space-y-3">
        <h1 className="text-xl font-semibold">Neues Passwort setzen</h1>
        <input
          className="w-full rounded-xl border px-3 py-2"
          type="password"
          placeholder="Neues Passwort (min. 8 Zeichen)"
          value={pw}
          onChange={(e)=>setPw(e.target.value)}
          required
          minLength={8}
        />
        <button disabled={busy || pw.length < 8} className="w-full rounded-xl border px-4 py-2 hover:bg-slate-50">
          {busy ? 'Speichere…' : 'Passwort sichern'}
        </button>
        {err ? <p className="text-sm text-red-600">{err}</p> : null}
        {ok ? <p className="text-sm text-green-600">Aktualisiert. Weiterleitung…</p> : null}
      </form>
    </div>
  );
}
