import { Link } from "react-router-dom";

export default function DashboardPage() {
  const tiles = [
    {
      title: "Businessplan Generator",
      description: "Plane dein Vorhaben Schritt für Schritt und exportiere es als PDF.",
      to: "/businessplan",
      emoji: "📘",
    },
    {
      title: "Video-Kurse",
      description: "Lerne alles zur Gründung in kurzen, praxisnahen Videos.",
      to: "/videos",
      emoji: "🎥",
    },
    {
      title: "Workbooks",
      description: "Arbeite interaktiv mit unseren digitalen Arbeitsblättern.",
      to: "/workbooks",
      emoji: "📂",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center text-gray-800">
          Willkommen zurück bei Flowmio 👋
        </h1>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {tiles.map((tile) => (
            <Link
              to={tile.to}
              key={tile.title}
              className="bg-white rounded-2xl shadow-md hover:shadow-lg transition p-6 flex flex-col justify-between"
            >
              <div>
                <div className="text-4xl mb-4">{tile.emoji}</div>
                <h2 className="text-xl font-semibold text-gray-800">{tile.title}</h2>
                <p className="text-gray-600 mt-2 text-sm">{tile.description}</p>
              </div>
              <div className="mt-4 text-right text-sm text-[#84C7AE] font-semibold">
                Jetzt starten →
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
