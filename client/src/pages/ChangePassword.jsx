// src/pages/ChangePassword.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

export default function ChangePassword() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    newPassword: "",
    confirmNewPassword: "",
  });
  const [message, setMessage] = useState("");

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!form.newPassword || !form.confirmNewPassword) {
      return setMessage("❌ Bitte alle Felder ausfüllen.");
    }

    if (form.newPassword !== form.confirmNewPassword) {
      return setMessage("❌ Neue Passwörter stimmen nicht überein.");
    }

    const { error } = await supabase.auth.updateUser({
      password: form.newPassword,
    });

    if (error) {
      setMessage("❌ " + error.message);
    } else {
      setMessage("✅ Passwort erfolgreich geändert.");
      setTimeout(() => navigate("/dashboard"), 1500); // kurze Bestätigung, dann weiter
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12 bg-white p-6 rounded-xl shadow">
      <h1 className="text-xl font-bold mb-4">Passwort ändern</h1>

      <label className="block text-sm font-medium text-gray-700 mb-1">
        Neues Passwort
      </label>
      <input
        type="password"
        className="w-full mb-4 p-2 border rounded"
        value={form.newPassword}
        onChange={(e) => handleChange("newPassword", e.target.value)}
      />

      <label className="block text-sm font-medium text-gray-700 mb-1">
        Neues Passwort bestätigen
      </label>
      <input
        type="password"
        className="w-full mb-6 p-2 border rounded"
        value={form.confirmNewPassword}
        onChange={(e) => handleChange("confirmNewPassword", e.target.value)}
      />

      <button
        onClick={handleSubmit}
        className="bg-[#84C7AE] text-white px-4 py-2 rounded hover:bg-[#6db49b]"
      >
        Speichern
      </button>

      {message && <p className="mt-4 text-sm text-center">{message}</p>}
    </div>
  );
}
