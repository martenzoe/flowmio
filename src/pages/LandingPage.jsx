import { Link } from "react-router-dom";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-800">
      {/* Header */}
      <header className="bg-[#84C7AE] text-white p-6">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Flowmio</h1>
          <nav className="space-x-4">
            <Link to="/login" className="hover:underline">Login</Link>
            <Link to="/register" className="hover:underline">Registrieren</Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-6 bg-gray-50 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Dein smarter Begleiter für die Unternehmensgründung
          </h2>
          <p className="text-lg mb-8">
            Mit Flowmio lernst du alles, was du brauchst – mit Videos, Workbooks und dem interaktiven Businessplan-Generator.
          </p>
          <Link
            to="/register"
            className="bg-[#84C7AE] hover:bg-[#6db49b] text-white font-semibold py-3 px-6 rounded-xl transition"
          >
            Jetzt starten
          </Link>
        </div>
      </section>

      {/* Feature Section */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8 text-center">
          <Feature icon="🎥" title="Video-Kurse" text="Lerne praxisnah von Expert:innen – jederzeit abrufbar." />
          <Feature icon="📘" title="Workbook" text="Strukturiere deinen Weg mit geführten Arbeitsheften." />
          <Feature icon="🧠" title="Businessplan Generator" text="Plane smart – mit KI-Hilfe und PDF-Export." />
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-100 text-center text-sm py-6">
        © {new Date().getFullYear()} Flowmio · <Link to="/faq" className="underline">FAQ</Link> · <Link to="/kontakt" className="underline">Kontakt</Link>
      </footer>
    </div>
  );
}

function Feature({ icon, title, text }) {
  return (
    <div className="p-6 bg-gray-50 rounded-xl shadow-sm hover:shadow-md transition">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600">{text}</p>
    </div>
  );
}
