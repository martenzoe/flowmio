import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";

export default function ResetPassword() {
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!newPassword || !confirm) {
      return setMessage("❌ Bitte alle Felder ausfüllen.");
    }

    if (newPassword !== confirm) {
      return setMessage("❌ Passwörter stimmen nicht überein.");
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      setMessage("❌ Fehler: " + error.message);
    } else {
      setMessage("✅ Passwort wurde geändert. Du wirst weitergeleitet …");
      setTimeout(() => navigate("/login"), 3000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-xl shadow-md w-full max-w-md space-y-4"
      >
        <h2 className="text-2xl font-bold text-center">Neues Passwort setzen</h2>

        <input
          type="password"
          placeholder="Neues Passwort"
          className="w-full p-3 border rounded-lg"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Neues Passwort bestätigen"
          className="w-full p-3 border rounded-lg"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
        />

        <button
          type="submit"
          className="w-full bg-[#84C7AE] text-white font-semibold py-2 rounded-lg hover:bg-[#6db49b]"
        >
          Passwort ändern
        </button>

        {message && <p className="text-sm text-center text-gray-600">{message}</p>}
      </form>
    </div>
  );
}
