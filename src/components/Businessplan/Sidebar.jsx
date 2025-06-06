import { Link, useLocation } from "react-router-dom";
import { useState } from "react";

const kapitel = [

  
  {
    title: "Deckblatt",
    key: "kapitel1",
    unterpunkte: ["Allgemeine Infos", "Kontakt", "Logo"],
  },
  {
    title: "Marktanalyse",
    key: "kapitel2",
    unterpunkte: ["Zielgruppe", "Wettbewerb", "Trends"],
  },
];

export default function Sidebar() {
  const location = useLocation();
  const [open, setOpen] = useState(null);

  return (
    <aside className="w-64 bg-white shadow-lg p-4">
  <h2 className="text-xl font-bold mb-4">Kapitel</h2>
  <ul className="space-y-3">
    {kapitel.map((k) => {
      const isActive = location.pathname.includes(k.key);

      return (
        <li key={k.key}>
          <button
            onClick={() => setOpen(open === k.key ? null : k.key)}
            className={`w-full text-left px-3 py-2 rounded-xl font-semibold transition ${
              isActive
                ? "bg-[#84C7AE]/10 text-[#84C7AE]"
                : "text-gray-800 hover:bg-gray-100"
            }`}
          >
            {k.title}
          </button>

          {open === k.key && (
            <ul className="ml-3 mt-2 space-y-1 text-sm">
              {k.unterpunkte.map((u, j) => (
                <li key={j}>
                  <Link
                    to={`/businessplan/start/${k.key}`}
                    className={`block px-2 py-1 rounded ${
                      isActive
                        ? "text-[#84C7AE] font-semibold"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    • {u}
                  </Link>
                </li>
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
