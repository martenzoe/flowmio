import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import RegisterPage from "./pages/RegisterPage";
import LoginPage from "./pages/LoginPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import DashboardPage from "./pages/DashboardPage";
import BusinessplanIntro from "./generator/BusinessplanIntro";
import GeneratorLayout from "./generator/GeneratorLayout";
import Deckblatt from "./generator/Deckblatt";
import Zusammenfassung from "./generator/zusammenfassung";
import ProfileSetup from "./pages/ProfileSetup";
// import weitere Kapitel nach Bedarf

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/profil/setup" element={<ProfileSetup />} />

        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/businessplan" element={<BusinessplanIntro />} />

        {/* Generator mit Nested Routes */}
        <Route path="/businessplan/start" element={<GeneratorLayout />}>
          <Route path="deckblatt" element={<Deckblatt />} />
          <Route path="zusammenfassung" element={<Zusammenfassung />} />
          {/* Hier weitere Kapitel */}
        </Route>
      </Routes>
    </Router>
  );
}
