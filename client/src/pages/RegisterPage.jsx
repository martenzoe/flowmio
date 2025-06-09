import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { Link } from "react-router-dom";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [accepted, setAccepted] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!accepted) {
      setMessage("Bitte bestätige die Datenschutzerklärung.");
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/profile-setup`,
      },
    });

    if (error) {
      setMessage("Fehler: " + error.message);
    } else {
      setMessage("Bitte bestätige deine E-Mail-Adresse. Schau in dein Postfach.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#e6f5f1] to-[#fdfdfd] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-800">Konto erstellen</h2>
          <p className="text-sm text-gray-500 mt-1">Starte jetzt mit deinem Flowmio-Zugang</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-Mail-Adresse</label>
            <input
              type="email"
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#84C7AE]"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Passwort</label>
            <input
              type="password"
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#84C7AE]"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <label className="text-sm flex items-start space-x-2">
            <input
              type="checkbox"
              className="mt-1"
              checked={accepted}
              onChange={() => setAccepted(!accepted)}
              required
            />
            <span>
              Ich stimme der{" "}
              <Link to="/datenschutz" className="underline text-blue-600">
                Datenschutzerklärung
              </Link>{" "}
              zu.
            </span>
          </label>

          <button
            type="submit"
            className="w-full py-3 bg-[#84C7AE] hover:bg-[#6db49b] text-white rounded-xl font-semibold transition"
          >
            Registrieren
          </button>
        </form>

        {message && (
          <div className="text-center text-sm text-red-600 bg-red-50 p-3 rounded-xl border border-red-200">
            {message}
          </div>
        )}

        <p className="text-center text-sm text-gray-500">
          Bereits ein Konto?{" "}
          <Link to="/login" className="text-[#84C7AE] font-medium hover:underline">
            Zum Login
          </Link>
        </p>
      </div>
    </div>
  );
}
