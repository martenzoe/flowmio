// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate, useNavigate, Outlet } from 'react-router-dom';
import { supabase } from './lib/supabase';
import Auth from './routes/Auth';
import AuthCallback from './routes/AuthCallback';
import ResetPasswordPage from './routes/ResetPasswordPage';
import RequireAuth from './components/RequireAuth';
import Logout from './routes/Logout';
import AppShell from './app/AppShell';
import ModulesIndex from './routes/ModulesIndex';

function AppHome() {
  const navigate = useNavigate();
  async function logout() {
    await supabase.auth.signOut();
    navigate('/auth', { replace: true });
  }
  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">👋 Willkommen in der App</h1>
        <button
          onClick={logout}
          className="rounded-xl border px-3 py-1 hover:bg-slate-50 text-sm"
        >
          Logout
        </button>
      </div>
      <p className="text-slate-600">Hier kommt gleich das Academy-Layout hin.</p>
    </div>
  );
}

function AppLayout() {
  // Geschütztes Layout für alle /app/* Routen
  return (
    <RequireAuth>
      <AppShell>
        <Outlet />
      </AppShell>
    </RequireAuth>
  );
}

function NotFound() {
  return (
    <div className="min-h-screen grid place-items-center p-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold mb-2">404 – Seite nicht gefunden</h1>
        <a href="/auth" className="underline">Zur Anmeldung</a>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth */}
        <Route path="/auth" element={<Auth />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/auth/reset" element={<ResetPasswordPage />} />
        <Route path="/logout" element={<Logout />} />

        {/* Geschützter Bereich: /app/* */}
        <Route path="/app" element={<AppLayout />}>
          <Route index element={<AppHome />} />
          <Route path="modules" element={<ModulesIndex />} />
          {/* hier kommen später weitere App-Routen rein, z.B.: */}
          {/* <Route path="modules/:slug" element={<ModuleLayout />} /> */}
        </Route>

        {/* Defaults */}
        <Route path="/" element={<Navigate to="/auth" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
