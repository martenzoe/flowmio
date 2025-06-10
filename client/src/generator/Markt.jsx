import statistaImg from "../assets/statista.png";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { saveInput } from "../utils/saveInput";
import { CheckCircle, UploadCloud } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Markt() {
  const { user } = useCurrentUser();
  const [form, setForm] = useState({});
  const [done, setDone] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    const loadData = async () => {
      const { data } = await supabase
        .from("businessplan_inputs")
        .select("field, value")
        .eq("user_id", user.id)
        .eq("kapitel", "markt");

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
    await saveInput(user.id, "markt", field, value);
  };

  const toggleDone = async () => {
    const newStatus = !done ? "done" : "open";
    setDone(!done);
    await saveInput(user?.id, "markt", "status", newStatus);
  };

  const handleNext = () => {
    navigate("/businessplan/start/marketing");
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const fileName = `marktbild-${Date.now()}.${file.name.split(".").pop()}`;
    const { error } = await supabase.storage
      .from("marktbilder")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      alert("Fehler beim Hochladen.");
      setUploading(false);
      return;
    }

    const { data, error: urlError } = await supabase.storage
      .from("marktbilder")
      .createSignedUrl(fileName, 60 * 60 * 24 * 7);

    if (urlError) {
      alert("Fehler beim Abrufen der URL.");
      setUploading(false);
      return;
    }

    setUploadedImage(data.signedUrl);
    await handleChange("marktbild", data.signedUrl);
    setUploading(false);
  };

  return (
    <div className="bg-white p-10 rounded-2xl shadow-md max-w-5xl mx-auto mb-10">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">4. Der Markt</h1>

      <div className="bg-gray-100 text-sm text-gray-700 p-4 rounded-xl space-y-2 mb-6">
        <p>Eine Marktanalyse hört sich immer sehr kompliziert an, kann aber ganz einfach sein. Sie fängt mit einer Googlesuche an. Hier können nach Statistiken gesucht werden. Wenn du z. B. einen Onlineshop eröffnen möchtest, dann suche nach dem Stichwort „E-Commerce Statistiken“.</p>
        <p>Sehr gut ist es auch, wenn sich deine Geschäftsidee in einem wachsenden Markt befindet. Eine sehr gute Quelle für Statistiken ist hierbei Statista.de.</p>
        <p>Ein Beispiel: Nachdem das Online-Shopping den traditionellen Einzelhandel überholt hat, boomt der E-Commerce weltweit. Im Jahr 2023 lag der Online-Umsatz bereits bei 22 % des Einzelhandelsumsatzes (Statista). Bis 2040 könnten 95 % der Einkäufe online erfolgen (Nasdaq).</p>
      </div>

        <img src={statistaImg} alt="Statistik Beispiel" className="mb-6 rounded-xl border" />

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Eigenes Bild hochladen (optional)</label>
        {uploadedImage && (
          <img src={uploadedImage} alt="Upload Vorschau" className="w-64 h-auto rounded-xl border mb-2" />
        )}
        <label className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-xl border border-gray-300 cursor-pointer text-sm hover:bg-gray-200 transition w-fit">
          <UploadCloud className="w-4 h-4" />
          <span>{uploading ? "Wird hochgeladen..." : "Bild hochladen"}</span>
          <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
        </label>
      </div>

      <Section label="4.1 Marktposition" textarea value={form.marktposition} onChange={(v) => handleChange("marktposition", v)} />
      <Section label="4.2 Wettbewerb" textarea value={form.wettbewerb} onChange={(v) => handleChange("wettbewerb", v)} />

      {[1, 2, 3].map((n) => (
        <div key={n} className="grid grid-cols-3 gap-4 mb-4">
          <h3 className="col-span-3 font-semibold text-sm text-gray-700">Mitbewerber {n}</h3>
          <Section label="Name" value={form[`mitbewerber${n}_name`]} onChange={(v) => handleChange(`mitbewerber${n}_name`, v)} />
          <Section label="Straße" value={form[`mitbewerber${n}_strasse`]} onChange={(v) => handleChange(`mitbewerber${n}_strasse`, v)} />
          <Section label="Stadt" value={form[`mitbewerber${n}_stadt`]} onChange={(v) => handleChange(`mitbewerber${n}_stadt`, v)} />
        </div>
      ))}

      <div className="grid grid-cols-3 gap-4 mb-4">
        <h3 className="col-span-3 font-semibold text-sm text-gray-700">Eigenes Unternehmen</h3>
        <Section label="Name" value={form.eigen_name} onChange={(v) => handleChange("eigen_name", v)} />
        <Section label="Straße" value={form.eigen_strasse} onChange={(v) => handleChange("eigen_strasse", v)} />
        <Section label="Stadt" value={form.eigen_stadt} onChange={(v) => handleChange("eigen_stadt", v)} />
      </div>

      <Bewertungsmatrix matrix={form.bewertung || {}} onChange={(v) => handleChange("bewertung", v)} />

      <div className="bg-gray-100 text-sm text-gray-700 p-4 rounded-xl mt-8">
        <p>Mögliche Formulierungshilfe:</p>
        <p>Die Wettbewerbsanalyse zeigt, dass das Unternehmen im Wettbewerbsumfeld sehr gut positioniert ist. Alle direkten Wettbewerbsunternehmen weisen ein schwächeres Stärken-Schwächen-Gesamtprofil auf. Die Ergebnisse haben gezeigt, dass das Angebot von XYZ sehr fokussiert und zielgruppenorientiert ist.</p>
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
        <textarea rows={4} className="w-full p-3 border rounded-xl text-sm" value={value} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input type="text" className="w-full p-2 border rounded-lg text-sm" value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </div>
  );
}

function Bewertungsmatrix({ matrix, onChange }) {
  const rows = [
    "Angebot/Preis-Leistung", "Strategie", "Unternehmensführung", "Mitarbeiterqualität",
    "Rechtsform", "Organisation", "Bekanntheitsgrad", "Online Auftritt", "Vertrieb",
    "Marketing", "Standort", "Gesamtbewertung"
  ];

  const cols = ["Sehr gut", "Gut", "Mittel", "Schlecht", "Sehr schlecht"];

  const update = (row, col) => {
    const updated = { ...matrix, [row]: col };
    onChange(updated);
  };

  return (
    <div className="mt-8 overflow-x-auto">
      <table className="min-w-full text-sm text-left border rounded-xl">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-3 py-2 border">Kriterium</th>
            {cols.map((col) => (
              <th key={col} className="px-3 py-2 border text-center">{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row}>
              <td className="px-3 py-2 border">{row}</td>
              {cols.map((col) => (
                <td key={col} className="px-3 py-2 border text-center">
                  <input
                    type="radio"
                    name={row}
                    checked={matrix[row] === col}
                    onChange={() => update(row, col)}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
