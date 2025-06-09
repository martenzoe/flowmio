import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useNavigate, Link } from "react-router-dom";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setMessage("Fehler: " + error.message);
    } else {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const res = await fetch("http://localhost:4000/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });

        const data = await res.json();
        if (data.token) {
          localStorage.setItem("token", data.token);
        }
      }

      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#e6f5f1] to-[#fdfdfd] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-800">Willkommen zurück</h2>
          <p className="text-sm text-gray-500 mt-1">Login mit deinem Flowmio-Konto</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
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

          <div className="text-right text-sm">
            <Link to="/forgot-password" className="text-[#84C7AE] hover:underline">
              Passwort vergessen?
            </Link>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-[#84C7AE] hover:bg-[#6db49b] text-white rounded-xl font-semibold transition"
          >
            Login
          </button>
        </form>

        {message && (
          <div className="text-center text-sm text-red-600 bg-red-50 p-3 rounded-xl border border-red-200">
            {message}
          </div>
        )}

        <p className="text-center text-sm text-gray-500">
          Noch kein Konto?{" "}
          <Link to="/register" className="text-[#84C7AE] font-medium hover:underline">
            Jetzt registrieren
          </Link>
        </p>
      </div>
    </div>
  );
}
