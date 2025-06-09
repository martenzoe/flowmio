import { Link } from "react-router-dom";

export default function BusinessplanIntro() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#e6f5f1] to-[#fdfdfd] py-10 px-6">
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-2xl p-10">
        <h1 className="text-3xl font-bold text-gray-800 mb-4 text-center">
          Dein Businessplan – einfach und strukturiert
        </h1>
        <p className="text-gray-600 text-center max-w-2xl mx-auto mb-10">
          In diesem interaktiven Generator wirst du Schritt für Schritt durch alle wichtigen Abschnitte deines Businessplans geführt. Du kannst deine Angaben zwischenspeichern, jederzeit zurückkehren und am Ende alles als PDF exportieren.
        </p>

        {/* Video-Platzhalter */}
        <div className="w-full aspect-video bg-gray-100 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center text-gray-400 mb-10">
          <span>📽️ Video-Anleitung folgt in Kürze</span>
        </div>

        <div className="text-center">
          <Link
            to="/businessplan/start"
            className="inline-block bg-[#84C7AE] hover:bg-[#6db49b] text-white font-semibold py-3 px-8 rounded-xl transition text-lg"
          >
            Los geht’s
          </Link>
        </div>
      </div>
    </div>
  );
}
