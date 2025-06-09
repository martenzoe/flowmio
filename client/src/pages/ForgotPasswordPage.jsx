import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { Link } from "react-router-dom";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleReset = async (e) => {
    e.preventDefault();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/reset-password",
    });

    if (error) {
      setMessage("Fehler: " + error.message);
    } else {
      setMessage("Bitte prüfe dein Postfach für den Zurücksetzungslink.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <form
        onSubmit={handleReset}
        className="bg-white p-6 rounded-xl shadow-md w-full max-w-md space-y-4"
      >
        <h2 className="text-2xl font-bold text-center">Passwort vergessen?</h2>
        <input
          type="email"
          placeholder="E-Mail-Adresse"
          className="w-full p-3 border rounded-lg"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button
          type="submit"
          className="w-full bg-[#84C7AE] text-white font-semibold py-2 rounded-lg hover:bg-[#6db49b]"
        >
          Link zum Zurücksetzen senden
        </button>
        {message && <p className="text-sm text-center text-gray-600">{message}</p>}
        <p className="text-sm text-center">
          Zurück zum <Link to="/login" className="underline">Login</Link>
        </p>
      </form>
    </div>
  );
}
