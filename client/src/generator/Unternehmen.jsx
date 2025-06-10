import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { saveInput } from "../utils/saveInput";
import { CheckCircle } from "lucide-react";
import EditableTable from "../components/EditableTable";
import CITable from "../components/CITable";

export default function Unternehmen() {
  const { user } = useCurrentUser();
  const [form, setForm] = useState({});
  const [done, setDone] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    const loadData = async () => {
      const { data } = await supabase
        .from("businessplan_inputs")
        .select("field, value")
        .eq("user_id", user.id)
        .eq("kapitel", "unternehmen");

      const values = {};
      data?.forEach((item) => {
        if (item.field === "status") {
          setDone(item.value === "done");
        } else {
          try {
            values[item.field] = JSON.parse(item.value);
          } catch {
            values[item.field] = item.value;
          }
        }
      });
      setForm(values);
    };
    loadData();
  }, [user]);

  const handleChange = async (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    await saveInput(user.id, "unternehmen", field, value);
  };

  const handleTableChange = async (field, updatedData) => {
    setForm((prev) => ({ ...prev, [field]: updatedData }));
    await saveInput(user.id, "unternehmen", field, JSON.stringify(updatedData));
  };

  const toggleDone = async () => {
    const newStatus = !done ? "done" : "open";
    setDone(!done);
    await saveInput(user?.id, "unternehmen", "status", newStatus);
  };

  const handleNext = () => {
    navigate("/businessplan/start/markt");
  };

  return (
    <div className="bg-white p-10 rounded-2xl shadow-md max-w-5xl mx-auto min-h-[75vh]">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Unternehmen</h1>

      <div className="space-y-6">
        <Section label="Vorname & Nachname" value={form.name} onChange={(v) => handleChange("name", v)} />
        <Section label="Straße, Hausnummer" value={form.adresse} onChange={(v) => handleChange("adresse", v)} />
        <Section label="PLZ, Stadt" value={form.ort} onChange={(v) => handleChange("ort", v)} />
        <Section label="3.1 Unternehmensführung" textarea value={form.geschaeftsfuehrung} onChange={(v) => handleChange("geschaeftsfuehrung", v)} />
        <Section label="3.2 Mitarbeiter" textarea value={form.mitarbeiter} onChange={(v) => handleChange("mitarbeiter", v)} />
        <Section label="3.2.1 Ausfallregelung" textarea value={form.ausfall} onChange={(v) => handleChange("ausfall", v)} />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">3.3 Partner (Tabelle)</label>
          <EditableTable
            columns={["Partner", "Firma", "Web-Adresse"]}
            data={form.partnerTabelle || []}
            onChange={(data) => handleTableChange("partnerTabelle", data)}
          />
        </div>

        <Section label="3.4 Rechtsform" value={form.rechtsform} onChange={(v) => handleChange("rechtsform", v)} />
        <Section label="3.5 Versicherungen" textarea value={form.versicherungen} onChange={(v) => handleChange("versicherungen", v)} />
        <Section label="3.6 Standort" textarea value={form.standort} onChange={(v) => handleChange("standort", v)} />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">3.7 Corporate Identity (Tabelle)</label>
          <CITable
            value={form.ciTabelle || {}}
            onChange={(data) => handleTableChange("ciTabelle", data)}
          />
        </div>
      </div>

      <div className="flex justify-between items-center mt-8 border-t pt-4">
        <button
          onClick={toggleDone}
          className={`flex items-center space-x-2 text-sm px-4 py-2 rounded-xl ${
            done ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
          } hover:bg-green-200 transition`}
        >
          <CheckCircle className="w-4 h-4" />
          <span>{done ? "Erledigt" : "Noch offen"}</span>
        </button>

        <button
          onClick={handleNext}
          className="bg-[#84C7AE] text-white px-6 py-2 rounded-xl hover:bg-[#6db49b] text-sm"
        >
          Speichern & Weiter
        </button>
      </div>
    </div>
  );
}

function Section({ label, value = "", onChange, textarea = false }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {textarea ? (
        <textarea rows={5} className="w-full p-3 border rounded-xl text-sm" value={value} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input type="text" className="w-full p-2 border rounded-lg text-sm" value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </div>
  );
}
