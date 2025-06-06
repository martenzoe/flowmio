import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { saveInput } from "../utils/saveInput";
import { UploadCloud, CheckCircle } from "lucide-react";

export default function Deckblatt() {
  const { user } = useCurrentUser();
  const [form, setForm] = useState({});
  const [logo, setLogo] = useState(null);
  const [status, setStatus] = useState("offen");
  const navigate = useNavigate();

  const handleChange = async (field, value) => {
  const updatedForm = { ...form, [field]: value };
  setForm(updatedForm);

  if (!user?.id) {
    console.warn("⚠️ Kein User beim handleChange:", { field, value });
    return;
  }

  await saveInput(user.id, "deckblatt", field, value);
};


  const toggleStatus = async () => {
    const newStatus = status === "erledigt" ? "offen" : "erledigt";
    setStatus(newStatus);
    await saveInput(user?.id, "deckblatt", "status", newStatus);
  };

  const handleNext = () => {
    navigate("/businessplan/start/zusammenfassung");
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
        if (item.field === "status") {
          setStatus(item.value);
        } else {
          values[item.field] = item.value;
        }
      });
      setForm(values);
    };
    loadData();
  }, [user]);

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setLogo(imageUrl);
    }
  };

  return (
    <div className="bg-white p-10 rounded-2xl shadow-md max-w-[1200px] mx-auto min-h-[85vh]">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Deckblatt – Unternehmensdaten</h1>

      <div className="space-y-10">
        {/* Block: Unternehmen */}
        <section className="border p-6 rounded-xl">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Unternehmen</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Input label="Unternehmensname" value={form.unternehmensname} onChange={(v) => handleChange("unternehmensname", v)} />
            <Input label="Unternehmenssitz" value={form.sitz} onChange={(v) => handleChange("sitz", v)} />
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Unternehmenslogo</label>
            <div className="flex items-center gap-4">
              <label className="cursor-pointer text-[#84C7AE] flex items-center gap-2">
                <UploadCloud className="w-4 h-4" />
                <span className="text-sm">Logo hochladen</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
              </label>
              <span className="text-xs text-gray-500">Empfohlen: 600×200 px</span>
            </div>
            {logo && <img src={logo} alt="Logo" className="h-16 mt-3 object-contain" />}
          </div>

          <div className="grid md:grid-cols-3 gap-4 mt-6">
            <Input label="Gründung – Tag" value={form.gruendung_tag} onChange={(v) => handleChange("gruendung_tag", v)} />
            <Input label="Monat" value={form.gruendung_monat} onChange={(v) => handleChange("gruendung_monat", v)} />
            <Input label="Jahr" value={form.gruendung_jahr} onChange={(v) => handleChange("gruendung_jahr", v)} />
          </div>
        </section>

        {/* Block: Kontakt */}
        <section className="border p-6 rounded-xl">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Gründer:in & Kontakt</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Input label="Vorname" value={form.vorname} onChange={(v) => handleChange("vorname", v)} />
            <Input label="Nachname" value={form.nachname} onChange={(v) => handleChange("nachname", v)} />
            <Input label="Straße & Hausnummer" value={form.adresse} onChange={(v) => handleChange("adresse", v)} />
            <Input label="PLZ & Ort" value={form.plzort} onChange={(v) => handleChange("plzort", v)} />
            <Input label="E-Mail" value={form.email} onChange={(v) => handleChange("email", v)} />
            <Input label="Telefonnummer" value={form.telefon} onChange={(v) => handleChange("telefon", v)} />
          </div>
        </section>

        {/* Footer */}
        <div className="flex justify-between items-center border-t pt-6">
          <button
            onClick={toggleStatus}
            className={`flex items-center space-x-2 text-sm px-4 py-2 rounded-xl ${
              status === "erledigt" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
            } hover:bg-green-200 transition`}
          >
            <CheckCircle className="w-4 h-4" />
            <span>{status === "erledigt" ? "Erledigt" : "Noch offen"}</span>
          </button>

          <button
            onClick={handleNext}
            className="bg-[#84C7AE] text-white px-6 py-2 rounded-xl hover:bg-[#6db49b] text-sm"
          >
            Speichern & Weiter
          </button>
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
        className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-[#84C7AE] bg-white"
      />
    </div>
  );
}
