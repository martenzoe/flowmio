import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { supabase } from "./lib/supabase";

// Auth & Shell
import Auth from "./routes/Auth";
import AuthCallback from "./routes/AuthCallback";
import ResetPasswordPage from "./routes/ResetPasswordPage";
import RequireAuth from "./components/RequireAuth";
import Logout from "./routes/Logout";
import AppShell from "./app/AppShell";

// App-Seiten
import Dashboard from "./routes/Dashboard";
import AcademyIndex from "./routes/AcademyIndex";
import PhaseDetail from "./routes/PhaseDetail";

// Module
import ModuleLayout from "./routes/module/ModuleLayout";
import LessonPage from "./routes/module/LessonPage";

function AppLayout() {
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
        <a href="/auth" className="underline">
          Zur Anmeldung
        </a>
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

        {/* Geschützter Bereich */}
        <Route path="/app" element={<AppLayout />}>
          {/* Dashboard */}
          <Route index element={<Dashboard />} />

          {/* Gründer-Akademie */}
          <Route path="academy" element={<AcademyIndex />} />
          <Route path="academy/:phaseSlug" element={<PhaseDetail />} />

          {/* === OFFIZIELLE Modul-Routen (konsistent mit deinen Links) === */}
          <Route path="modules/:slug" element={<ModuleLayout />} />
          <Route path="modules/:slug/lesson/:lessonSlug" element={<LessonPage />} />

          {/* === BACKWARD-COMPAT: falls von PhaseDetail nach /academy/:phaseSlug/:slug verlinkt wird === */}
          <Route path="academy/:phaseSlug/:slug" element={<ModuleLayout />} />
          <Route path="academy/:phaseSlug/:slug/lesson/:lessonSlug" element={<LessonPage />} />
        </Route>

        {/* Defaults */}
        <Route path="/" element={<Navigate to="/auth" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
