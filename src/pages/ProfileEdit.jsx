import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { useCurrentUser } from "../hooks/useCurrentUser";

const avatarOptions = [
  "/avatars/cat1.png",
  "/avatars/cat2.png",
  "/avatars/cat3.png",
];

export default function ProfileEdit() {
  const { user, profile, refreshUser } = useCurrentUser();
  const [form, setForm] = useState({
    vorname: "",
    nachname: "",
    nickname: "",
    telefon: "",
    adresse: "",
    land: "",
    avatar_url: "",
  });
  const [customAvatar, setCustomAvatar] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (profile) {
      setForm({
        vorname: profile.vorname || "",
        nachname: profile.nachname || "",
        nickname: profile.nickname || "",
        telefon: profile.telefon || "",
        adresse: profile.adresse || "",
        land: profile.land || "",
        avatar_url: profile.avatar_url || "",
      });
    }
  }, [profile]);

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
      handleChange("avatar_url", data.publicUrl);
      setCustomAvatar(data.publicUrl);
    }
  };

  const handleSubmit = async () => {
    const { error } = await supabase
      .from("profiles")
      .update({ ...form })
      .eq("id", user.id);

    if (error) {
      console.error("Fehler beim Speichern:", error);
      setMessage("❌ Fehler beim Speichern.");
    } else {
      await refreshUser();
      setMessage("✅ Profil erfolgreich aktualisiert.");
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white p-10 rounded-xl shadow mt-12">
      <h1 className="text-2xl font-bold mb-6">Profil bearbeiten</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label="Vorname" value={form.vorname} onChange={(v) => handleChange("vorname", v)} />
        <Input label="Nachname" value={form.nachname} onChange={(v) => handleChange("nachname", v)} />
        <Input label="Nickname" value={form.nickname} onChange={(v) => handleChange("nickname", v)} />
        <Input label="Telefon" value={form.telefon} onChange={(v) => handleChange("telefon", v)} />
        <Input label="Adresse" value={form.adresse} onChange={(v) => handleChange("adresse", v)} />
        <Input label="Land" value={form.land} onChange={(v) => handleChange("land", v)} />
      </div>

      <div className="mt-6">
        <p className="text-sm font-medium mb-2">Avatar auswählen:</p>
        <div className="flex gap-4">
          {avatarOptions.map((url) => (
            <img
              key={url}
              src={url}
              onClick={() => handleChange("avatar_url", url)}
              className={`w-16 h-16 rounded-full border-2 cursor-pointer ${
                form.avatar_url === url ? "border-[#84C7AE]" : "border-gray-300"
              }`}
            />
          ))}
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Oder eigenes Bild hochladen (max. 2MB)
          </label>
          <input type="file" accept="image/*" onChange={handleFileUpload} />
          {customAvatar && <img src={customAvatar} className="mt-2 h-16 rounded-full" />}
        </div>
      </div>

      <div className="mt-6 text-right">
        <button
          onClick={handleSubmit}
          className="bg-[#84C7AE] hover:bg-[#6db49b] text-white px-6 py-2 rounded-xl text-sm"
        >
          Speichern
        </button>
        {message && <p className="mt-2 text-sm">{message}</p>}
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
