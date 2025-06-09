import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
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
  const [open, setOpen] = useState(() => {
    const path = location.pathname.split("/").pop();
    return path;
  });
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
    <aside className="w-64 bg-white shadow-lg p-4 overflow-y-auto max-h-[calc(100vh-2rem)] rounded-xl">
      <h2 className="text-xl font-bold mb-4">Kapitel</h2>
      <ul className="space-y-3">
        {kapitel.map((k) => {
          const isActive = location.pathname.includes(k.key);
          const isDone = status[k.key] === "done";

          const buttonClass = isActive
            ? "bg-[#84C7AE]/10 text-[#84C7AE]"
            : isDone
            ? "bg-gray-100 text-gray-400"
            : "text-gray-800 hover:bg-gray-100";

          return (
            <li key={k.key}>
              <Link
                to={`/businessplan/start/${k.key}`}
                className={`block w-full text-left px-3 py-2 rounded-xl font-semibold transition ${buttonClass}`}
              >
                {k.title}
              </Link>

              {open === k.key && k.unterpunkte.length > 0 && (
                <ul className="ml-3 mt-2 space-y-1 text-sm text-gray-500">
                  {k.unterpunkte.map((u, j) => (
                    <li key={j}>• {u}</li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
