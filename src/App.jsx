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
import FAQPage from "./pages/FAQPage.jsx";
import KontaktPage from "./pages/KontaktPage";
import ProfileEdit from "./pages/ProfileEdit";
import ChangePassword from "./pages/ChangePassword";
import Navbar from "./components/Navbar"; // Neue Navigation

export default function App() {
  return (
    <Router>
      <Navbar />

      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        <Route path="/profil/setup" element={<ProfileSetup />} />
        <Route path="/profil/edit" element={<ProfileEdit />} />
        <Route path="/profil/passwort" element={<ChangePassword />} />

        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/faq" element={<FAQPage />} />
        <Route path="/kontakt" element={<KontaktPage />} />

        <Route path="/businessplan" element={<BusinessplanIntro />} />
        <Route path="/businessplan/start" element={<GeneratorLayout />}>
          <Route path="deckblatt" element={<Deckblatt />} />
          <Route path="zusammenfassung" element={<Zusammenfassung />} />
          {/* weitere Kapitel folgen */}
        </Route>
      </Routes>
    </Router>
  );
}
