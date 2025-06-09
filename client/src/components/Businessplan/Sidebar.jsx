import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { CheckCircle } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";

const kapitel = [
  {
    title: "Deckblatt",
    key: "deckblatt",
    unterpunkte: ["Allgemeine Infos", "Kontakt", "Logo"],
  },
  {
    title: "Zusammenfassung",
    key: "zusammenfassung",
    unterpunkte: ["Überblick"],
  },
  {
    title: "Geschäftsidee",
    key: "geschaeftsidee",
    unterpunkte: ["Angebot", "Zielgruppe", "Nutzen", "Kernfähigkeiten"],
  },
  {
    title: "Unternehmen",
    key: "unternehmen",
    unterpunkte: [
      "Unternehmensführung",
      "Mitarbeiter",
      "Ausfallregelung",
      "Partner",
      "Rechtsform",
      "Versicherungen",
      "Standort",
      "Corporate Identity (CI)",
    ],
  },
  {
    title: "Der Markt",
    key: "markt",
    unterpunkte: ["Marktposition Morelo", "Wettbewerb"],
  },
  {
    title: "Marketingkonzept",
    key: "marketing",
    unterpunkte: ["Vertriebswege", "Marketing-Mix", "SWOT-Analyse"],
  },
  {
    title: "Finanzen",
    key: "finanzen",
    unterpunkte: [
      "Ertragsquellen/Umsatz",
      "Kosten",
      "Privatentnahme",
      "Umsatz- und Rentabilitätsplan",
      "Umsatzplanung 2023",
      "Umsatzplanung 2024",
      "Umsatzprognose 2025",
    ],
  },
];

export default function Sidebar() {
  const location = useLocation();
  const [status, setStatus] = useState({});

  useEffect(() => {
    const loadStatus = async () => {
      const { data } = await supabase
        .from("businessplan_inputs")
        .select("kapitel, field, value")
        .eq("field", "status");

      const result = {};
      data?.forEach((entry) => {
        result[entry.kapitel] = entry.value;
      });
      setStatus(result);
    };

    loadStatus();
  }, []);

  return (
    <aside className="w-64 bg-white shadow-lg p-4 overflow-y-auto max-h-[calc(100vh-2rem)] rounded-xl border border-gray-100">
      <h2 className="text-xl font-bold mb-4 text-gray-800">Businessplan</h2>
      <ul className="space-y-1">
        {kapitel.map((k) => {
          const isActive = location.pathname.includes(k.key);
          const isDone = status[k.key] === "done";

          return (
            <li key={k.key}>
              <Link
                to={`/businessplan/start/${k.key}`}
                className={`flex items-center justify-between w-full px-3 py-2 rounded-lg font-semibold transition ${
                  isActive
                    ? "bg-[#84C7AE]/10 text-[#84C7AE]"
                    : "text-gray-800 hover:bg-gray-100"
                }`}
              >
                <span className="flex items-center gap-2">
                  {isDone && (
                    <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                  )}
                  {k.title}
                </span>
              </Link>

              {/* Immer sichtbare Unterpunkte (nicht klickbar) */}
              <ul className="ml-6 mt-1 space-y-1 text-sm text-gray-500">
                {k.unterpunkte.map((u, j) => (
                  <li key={j} className="pl-2">• {u}</li>
                ))}
              </ul>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
