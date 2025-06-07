import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useCurrentUser } from "../hooks/useCurrentUser";

const avatarOptions = [
  "/avatars/cat1.png",
  "/avatars/cat2.png",
  "/avatars/cat3.png",
];

export default function ProfileSetup() {
  const { user } = useCurrentUser();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    vorname: "",
    nachname: "",
    nickname: "",
    telefon: "",
    adresse: "",
    plz: "",
    ort: "",
    land: "",
    profilbild: "",
    dsgvo_accept: false,
  });
  const [customAvatar, setCustomAvatar] = useState(null);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !user?.id) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Die Datei darf maximal 2 MB groß sein.");
      return;
    }

    const filePath = `avatars/${user.id}/${file.name}`;
    const { error } = await supabase.storage
      .from("profile-images")
      .upload(filePath, file, { upsert: true });

    if (!error) {
      const { data } = supabase.storage
        .from("profile-images")
        .getPublicUrl(filePath);
      handleChange("profilbild", data.publicUrl);
      setCustomAvatar(data.publicUrl);
    }
  };

  const handleSubmit = async () => {
    if (!form.vorname || !form.nachname || !form.nickname || !form.dsgvo_accept) {
      alert("Bitte alle Pflichtfelder ausfüllen und DSGVO akzeptieren.");
      return;
    }

    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      ...form,
    });

    if (error) {
      console.error("❌ Fehler beim Speichern:", error);
      return;
    }

    navigate("/dashboard");
  };

  return (
    <div className="max-w-3xl mx-auto bg-white p-10 rounded-xl shadow mt-12">
      <h1 className="text-2xl font-bold mb-6">Profil anlegen</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label="Vorname*" value={form.vorname} onChange={(v) => handleChange("vorname", v)} />
        <Input label="Nachname*" value={form.nachname} onChange={(v) => handleChange("nachname", v)} />
        <Input label="Nickname*" value={form.nickname} onChange={(v) => handleChange("nickname", v)} />
        <Input label="Telefon (optional)" value={form.telefon} onChange={(v) => handleChange("telefon", v)} />
        <Input label="Adresse (optional)" value={form.adresse} onChange={(v) => handleChange("adresse", v)} />
        <Input label="PLZ (optional)" value={form.plz} onChange={(v) => handleChange("plz", v)} />
        <Input label="Ort (optional)" value={form.ort} onChange={(v) => handleChange("ort", v)} />
        <Input label="Land (optional)" value={form.land} onChange={(v) => handleChange("land", v)} />
      </div>

      <div className="mt-6">
        <p className="text-sm font-medium mb-2">Avatar auswählen:</p>
        <div className="flex gap-4">
          {avatarOptions.map((url) => (
            <img
              key={url}
              src={url}
              onClick={() => handleChange("profilbild", url)}
              className={`w-16 h-16 rounded-full border-2 cursor-pointer ${
                form.profilbild === url ? "border-[#84C7AE]" : "border-gray-300"
              }`}
            />
          ))}
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Oder eigenes Profilbild hochladen</label>
          <input type="file" accept="image/*" onChange={handleFileUpload} />
          {customAvatar && <img src={customAvatar} className="mt-2 h-16 rounded-full" />}
        </div>
      </div>

      <div className="mt-6">
        <label className="inline-flex items-center text-sm">
          <input
            type="checkbox"
            checked={form.dsgvo_accept}
            onChange={(e) => handleChange("dsgvo_accept", e.target.checked)}
            className="mr-2"
          />
          Ich stimme der Datenschutzerklärung (DSGVO) zu*
        </label>
      </div>

      <div className="mt-6 text-right">
        <button
          onClick={handleSubmit}
          className="bg-[#84C7AE] hover:bg-[#6db49b] text-white px-6 py-2 rounded-xl text-sm"
        >
          Speichern & Weiter
        </button>
      </div>
    </div>
  );
}

function Input({ label, value, onChange }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
      />
    </div>
  );
}
