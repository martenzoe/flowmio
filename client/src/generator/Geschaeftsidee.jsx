import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { saveInput } from "../utils/saveInput";
import { CheckCircle } from "lucide-react";

const fields = [
  {
    key: "angebot",
    label: "2.1 Angebot",
    placeholder:
      "Welches Produkt oder Dienstleistung möchtest du anbieten? Was gehört zum Leistungsspektrum?",
  },
  {
    key: "zielgruppe",
    label: "2.2 Zielgruppe",
    placeholder:
      "Wer ist deine Zielgruppe? Wie kannst du sie definieren und erreichen?",
  },
  {
    key: "nutzen",
    label: "2.3 Nutzen",
    placeholder:
      "Warum sollte jemand dein Angebot kaufen? Welchen konkreten Nutzen bietest du?",
  },
  {
    key: "kernfaehigkeiten",
    label: "2.4 Kernfähigkeiten",
    placeholder:
      "Was sind die besonderen Stärken und Kompetenzen deines Unternehmens?",
  },
];

export default function Geschaeftsidee() {
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
        .eq("kapitel", "geschaeftsidee");

      const newForm = {};
      data?.forEach((item) => {
        if (item.field === "status") {
          setDone(item.value === "done");
        } else {
          newForm[item.field] = item.value;
        }
      });
      setForm(newForm);
    };

    loadData();
  }, [user]);

  const handleChange = async (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (!user?.id) return;
    await saveInput(user.id, "geschaeftsidee", field, value);
  };

  const toggleDone = async () => {
    const newStatus = !done ? "done" : "open";
    setDone(!done);
    await saveInput(user?.id, "geschaeftsidee", "status", newStatus);
  };

  const handleNext = () => {
    navigate("/businessplan/start/unternehmen");
  };

  return (
    <div className="bg-white p-10 rounded-2xl shadow-md max-w-5xl mx-auto min-h-[75vh]">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Geschäftsidee</h1>

      <div className="space-y-6">
        {fields.map((field) => (
          <div key={field.key}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label}
            </label>
            <textarea
              rows="5"
              value={form[field.key] || ""}
              onChange={(e) => handleChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              className="w-full p-4 border rounded-xl text-sm"
            />
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center mt-6 border-t pt-4">
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
