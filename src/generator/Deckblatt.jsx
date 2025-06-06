import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { saveInput } from "../utils/saveInput";
import { UploadCloud } from "lucide-react";

export default function Deckblatt() {
  const { user } = useCurrentUser();
  const [form, setForm] = useState({});
  const [logo, setLogo] = useState(null);

  const handleChange = async (field, value) => {
    const newForm = { ...form, [field]: value };
    setForm(newForm);
    await saveInput(user?.id, "deckblatt", field, value);
  };

  useEffect(() => {
    if (!user) return;
    const loadData = async () => {
      const { data } = await supabase
        .from("businessplan_inputs")
        .select("field, value")
        .eq("user_id", user.id)
        .eq("kapitel", "deckblatt");

      const values = {};
      data?.forEach((item) => {
        values[item.field] = item.value;
      });

      setForm(values);
    };
    loadData();
  }, [user]);

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogo(URL.createObjectURL(file));
    }
  };

  return (
    <div className="bg-white p-10 rounded-2xl shadow-md max-w-7xl mx-auto min-h-[85vh]">
      <h1 className="text-2xl font-bold text-gray-800 mb-8">Über dein Unternehmen</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Linke Spalte: Labels & Beschreibung */}
        <div className="space-y-8 text-sm text-gray-600">
          <div>
            <h2 className="font-semibold text-gray-800">Unternehmen</h2>
            <p>Name, Gründung, Logo und Sitz</p>
          </div>
          <div>
            <h2 className="font-semibold text-gray-800">Kontakt</h2>
            <p>Gründer:in und Erreichbarkeit</p>
          </div>
        </div>

        {/* Rechte 2/3: Formular */}
        <div className="md:col-span-2 space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <Input
              label="Unternehmensname"
              value={form.unternehmensname}
              onChange={(v) => handleChange("unternehmensname", v)}
            />
            <Input
              label="Unternehmenssitz"
              value={form.sitz}
              onChange={(v) => handleChange("sitz", v)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Unternehmenslogo</label>
            <div className="flex items-center gap-3">
              <label className="cursor-pointer text-[#84C7AE] flex items-center gap-2">
                <UploadCloud className="w-4 h-4" />
                <span className="text-sm">Logo hochladen</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
              </label>
              <span className="text-xs text-gray-500">Empfohlen: 600×200 px</span>
            </div>
            {logo && <img src={logo} alt="Logo" className="h-16 mt-2 object-contain" />}
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <Input
              label="Gründung – Tag"
              value={form.gruendung_tag}
              onChange={(v) => handleChange("gruendung_tag", v)}
            />
            <Input
              label="Monat"
              value={form.gruendung_monat}
              onChange={(v) => handleChange("gruendung_monat", v)}
            />
            <Input
              label="Jahr"
              value={form.gruendung_jahr}
              onChange={(v) => handleChange("gruendung_jahr", v)}
            />
          </div>

          <hr className="my-6" />

          <div className="grid md:grid-cols-2 gap-4">
            <Input
              label="Vorname"
              value={form.vorname}
              onChange={(v) => handleChange("vorname", v)}
            />
            <Input
              label="Nachname"
              value={form.nachname}
              onChange={(v) => handleChange("nachname", v)}
            />
            <Input
              label="Straße & Hausnummer"
              value={form.adresse}
              onChange={(v) => handleChange("adresse", v)}
            />
            <Input
              label="PLZ & Ort"
              value={form.plzort}
              onChange={(v) => handleChange("plzort", v)}
            />
            <Input
              label="E-Mail"
              value={form.email}
              onChange={(v) => handleChange("email", v)}
            />
            <Input
              label="Telefonnummer"
              value={form.telefon}
              onChange={(v) => handleChange("telefon", v)}
            />
          </div>

          {/* Navigation */}
          <div className="flex justify-between mt-10">
            <button className="text-sm text-gray-500 hover:underline">Zurück</button>
            <button className="bg-[#84C7AE] text-white px-6 py-2 rounded-xl hover:bg-[#6db49b] text-sm">
              Speichern & Weiter
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Input({ label, value = "", onChange }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-[#84C7AE]"
      />
    </div>
  );
}
