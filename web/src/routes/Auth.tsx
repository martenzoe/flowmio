// src/routes/Auth.tsx
import type { FormEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { supabase, authRedirect } from '../lib/supabase';
import { useNavigate, useSearchParams } from 'react-router-dom';

type Mode = 'signin' | 'signup' | 'magic' | 'forgot';

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [showResend, setShowResend] = useState(false);

  const [params] = useSearchParams();
  const navigate = useNavigate();
  const next = useMemo(() => params.get('next') || '/app', [params]);
  const redirectTo = useMemo(() => authRedirect(next), [next]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate(next, { replace: true });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
        navigate(next, { replace: true });
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate, next]);

  function maybeMarkResend(e: unknown) {
    const m = (e as any)?.message?.toString().toLowerCase?.() || '';
    if (m.includes('not confirmed') || m.includes('confirm') || m.includes('verification')) {
      setShowResend(true);
    }
  }

  async function handleEmailPass(e: FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null); setMsg(null); setShowResend(false);
    try {
      // E-Mail fürs Callback/Resend merken
      localStorage.setItem('flowmio:lastEmail', email);

      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: redirectTo },
        });
        if (error) throw error;
        setMsg('Registrierung erfolgreich. Bitte bestätige deine E-Mail, dann kannst du dich einloggen.');
      }
    } catch (e: any) {
      setErr(e.message ?? 'Unerwarteter Fehler');
      maybeMarkResend(e);
    } finally {
      setBusy(false);
    }
  }

  async function handleMagic(e: FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null); setMsg(null); setShowResend(false);
    try {
      // E-Mail fürs Callback/Resend merken
      localStorage.setItem('flowmio:lastEmail', email);

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: redirectTo },
      });
      if (error) throw error;
      setMsg('Magic Link gesendet. Bitte Postfach prüfen.');
    } catch (e: any) {
      setErr(e.message ?? 'Unerwarteter Fehler');
      maybeMarkResend(e);
    } finally {
      setBusy(false);
    }
  }

  async function handleForgot(e: FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null); setMsg(null); setShowResend(false);
    try {
      const resetRedirect = redirectTo.replace('/auth/callback', '/auth/reset');
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: resetRedirect });
      if (error) throw error;
      setMsg('Reset-Link gesendet. Bitte Postfach prüfen.');
    } catch (e: any) {
      setErr(e.message ?? 'Unerwarteter Fehler');
    } finally {
      setBusy(false);
    }
  }

  async function signInWithGoogle() {
    setBusy(true); setErr(null); setShowResend(false);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo },
      });
      if (error) throw error;
      // Redirect zu Google → zurück auf redirectTo
    } catch (e: any) {
      setErr(e.message ?? 'OAuth Fehler');
      setBusy(false);
    }
  }

  async function resendConfirmation() {
    setBusy(true); setErr(null);
    try {
      // E-Mail fürs Callback/Resend merken
      localStorage.setItem('flowmio:lastEmail', email);

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: { emailRedirectTo: redirectTo },
      });
      if (error) throw error;
      setMsg('Bestätigungs-Mail erneut gesendet.');
      setShowResend(false);
    } catch (e: any) {
      setErr(e.message ?? 'Konnte Bestätigungs-Mail nicht senden.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center p-6 bg-slate-50 text-slate-900">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold mb-1">Willkommen bei Flowmio</h1>
        <p className="text-sm opacity-70 mb-6">Einloggen oder neuen Account erstellen.</p>

        <div className="flex flex-wrap gap-2 mb-4">
          <Tab label="Login" active={mode==='signin'} onClick={()=>setMode('signin')} />
          <Tab label="Registrieren" active={mode==='signup'} onClick={()=>setMode('signup')} />
          <Tab label="Magic Link" active={mode==='magic'} onClick={()=>setMode('magic')} />
          <Tab label="Passwort vergessen" active={mode==='forgot'} onClick={()=>setMode('forgot')} />
        </div>

        {(mode === 'signin' || mode === 'signup') && (
          <form onSubmit={handleEmailPass} className="space-y-3">
            <Input label="E-Mail" type="email" value={email} onChange={setEmail} required autoFocus />
            <Input label="Passwort" type="password" value={password} onChange={setPassword} required />
            <button disabled={busy} className="w-full rounded-xl border px-4 py-2 hover:bg-slate-50">
              {busy ? 'Bitte warten…' : mode === 'signin' ? 'Einloggen' : 'Account erstellen'}
            </button>
            <Divider />
            <button
              type="button"
              onClick={signInWithGoogle}
              disabled={busy}
              className="w-full rounded-xl border px-4 py-2 hover:bg-slate-50"
            >
              Mit Google fortfahren
            </button>
          </form>
        )}

        {mode === 'magic' && (
          <form onSubmit={handleMagic} className="space-y-3">
            <Input label="E-Mail" type="email" value={email} onChange={setEmail} required autoFocus />
            <button disabled={busy} className="w-full rounded-xl border px-4 py-2 hover:bg-slate-50">
              {busy ? 'Sende…' : 'Magic Link senden'}
            </button>
          </form>
        )}

        {mode === 'forgot' && (
          <form onSubmit={handleForgot} className="space-y-3">
            <Input label="E-Mail" type="email" value={email} onChange={setEmail} required autoFocus />
            <button disabled={busy} className="w-full rounded-xl border px-4 py-2 hover:bg-slate-50">
              {busy ? 'Sende…' : 'Passwort-Reset senden'}
            </button>
          </form>
        )}

        {err ? <p className="mt-4 text-sm text-red-600">{err}</p> : null}
        {showResend && email ? (
          <button
            type="button"
            onClick={resendConfirmation}
            disabled={busy}
            className="mt-2 text-sm underline underline-offset-4"
          >
            Bestätigungs-Mail erneut senden
          </button>
        ) : null}
        {msg ? <p className="mt-4 text-sm text-green-600">{msg}</p> : null}

        <p className="mt-6 text-xs opacity-60">
          Mit Login akzeptierst du unsere Nutzungsbedingungen & Datenschutz.
        </p>
      </div>
    </div>
  );
}

function Tab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl px-3 py-1 text-sm border ${active ? 'bg-slate-900 text-white' : 'hover:bg-slate-50'}`}
      type="button"
    >
      {label}
    </button>
  );
}

function Divider() {
  return (
    <div className="relative my-3">
      <div className="absolute inset-0 flex items-center"><div className="w-full border-t" /></div>
      <div className="relative flex justify-center text-xs"><span className="bg-white px-2 opacity-70">oder</span></div>
    </div>
  );
}

function Input(props: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  autoFocus?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm">{props.label}</span>
      <input
        className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:ring-2"
        type={props.type ?? 'text'}
        value={props.value}
        onChange={(e)=>props.onChange(e.target.value)}
        required={props.required}
        autoFocus={props.autoFocus}
        autoComplete="on"
      />
    </label>
  );
}
