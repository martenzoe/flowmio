import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { saveInput } from "../utils/saveInput";
import { CheckCircle } from "lucide-react";

export default function Zusammenfassung() {
  const { user } = useCurrentUser();
  const [text, setText] = useState("");
  const [done, setDone] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    const loadData = async () => {
      const { data } = await supabase
        .from("businessplan_inputs")
        .select("field, value")
        .eq("user_id", user.id)
        .eq("kapitel", "zusammenfassung");

      data?.forEach((item) => {
        if (item.field === "text") setText(item.value);
        if (item.field === "status") setDone(item.value === "done");
      });
    };
    loadData();
  }, [user]);

  const handleChange = async (v) => {
    setText(v);

    if (!user?.id) {
      console.warn("⚠️ Kein User beim handleChange:", v);
      return;
    }

    await saveInput(user.id, "zusammenfassung", "text", v);
  };

  const toggleDone = async () => {
    const newStatus = !done ? "done" : "open";
    setDone(!done);
    await saveInput(user?.id, "zusammenfassung", "status", newStatus);
  };

  const handleNext = () => {
    navigate("/businessplan/start/angebot"); // Zielkapitel anpassen
  };

  return (
    <div className="bg-white p-10 rounded-2xl shadow-md max-w-5xl mx-auto min-h-[75vh]">
      <h1 className="text-2xl font-bold mb-4 text-gray-800">Zusammenfassung</h1>
      <p className="text-sm text-gray-500 mb-6">
        Hinweis: Die Zusammenfassung kann auch am Ende des Prozesses ausgefüllt werden.
      </p>

      <textarea
        rows="8"
        value={text}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Geplant ist die Gründung des Unternehmens XYZ, mit Sitz in XYZ und einer Umsatzgröße von XYZ."
        className="w-full p-4 border rounded-xl text-sm"
      />

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
