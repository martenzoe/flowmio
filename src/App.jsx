import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import RegisterPage from "./pages/RegisterPage";
import LoginPage from "./pages/LoginPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import DashboardPage from "./pages/DashboardPage";
import BusinessplanIntro from "./generator/BusinessplanIntro";
import GeneratorLayout from "./generator/GeneratorLayout";
import Kapitel1 from "./generator/Kapitel1";
import Deckblatt from "./generator/Deckblatt";  // Importiere weitere Kapitel hier


export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/businessplan" element={<BusinessplanIntro />} />

        <Route path="/businessplan/start" element={<GeneratorLayout />}>
        <Route path="/businessplan/start/kapitel1" element={<Deckblatt />} />
        <Route path="kapitel1" element={<Kapitel1 />} />
        </Route>
        {/* Später: Dashboard, FAQ, Kontakt usw. */}
      </Routes>
    </Router>
  );
}
