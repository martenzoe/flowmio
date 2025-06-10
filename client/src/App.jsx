// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import RegisterPage from "./pages/RegisterPage";
import LoginPage from "./pages/LoginPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPassword from "./pages/ResetPassword";
import DashboardPage from "./pages/DashboardPage";
import ProfileSetup from "./pages/ProfileSetup";
import ProfileEdit from "./pages/ProfileEdit";
import ChangePassword from "./pages/ChangePassword";
import FAQPage from "./pages/FAQPage";
import KontaktPage from "./pages/KontaktPage";
import BusinessplanIntro from "./generator/BusinessplanIntro";
import GeneratorLayout from "./generator/GeneratorLayout";
import Deckblatt from "./generator/Deckblatt";
import Zusammenfassung from "./generator/zusammenfassung";
import Geschaeftsidee from "./generator/Geschaeftsidee";
import Unternehmen from "./generator/Unternehmen"; 
import Navbar from "./components/Navbar";
import PrivateRoute from "./components/PrivateRoute";
import PublicOnlyRoute from "./components/PublicOnlyRoute";

export default function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        {/* Öffentliche Routen */}
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <LoginPage />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicOnlyRoute>
              <RegisterPage />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <PublicOnlyRoute>
              <ForgotPasswordPage />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/reset-password"
          element={
            <PublicOnlyRoute>
              <ResetPassword />
            </PublicOnlyRoute>
          }
        />

        {/* Geschützte Routen */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <DashboardPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/profil/setup"
          element={
            <PrivateRoute>
              <ProfileSetup />
            </PrivateRoute>
          }
        />
        <Route
          path="/profil/edit"
          element={
            <PrivateRoute>
              <ProfileEdit />
            </PrivateRoute>
          }
        />
        <Route
          path="/profil/passwort"
          element={
            <PrivateRoute>
              <ChangePassword />
            </PrivateRoute>
          }
        />
        <Route
          path="/faq"
          element={
            <PrivateRoute>
              <FAQPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/kontakt"
          element={
            <PrivateRoute>
              <KontaktPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/businessplan"
          element={
            <PrivateRoute>
              <BusinessplanIntro />
            </PrivateRoute>
          }
        />
        <Route
          path="/businessplan/start"
          element={
            <PrivateRoute>
              <GeneratorLayout />
            </PrivateRoute>
          }
        >
          <Route path="deckblatt" element={<Deckblatt />} />
          <Route path="zusammenfassung" element={<Zusammenfassung />} />
          <Route path="/businessplan/start/geschaeftsidee" element={<Geschaeftsidee />} />
          <Route path="unternehmen" element={<Unternehmen />} />

          {/* Weitere Kapitel */}
        </Route>
      </Routes>
    </Router>
  );
}
