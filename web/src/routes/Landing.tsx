import { Link } from 'react-router-dom'

export default function Landing() {
  return (
    <div className="min-h-screen grid place-items-center bg-gray-50">
      <div className="max-w-2xl bg-white rounded-2xl shadow p-8">
        <h1 className="text-3xl font-bold">Flowmio – Gründen, aber wie?</h1>
        <p className="mt-2 text-gray-600">Teste 7 Tage kostenlos. Danach Abo mit Token-Kontingent.</p>
        <div className="mt-6 flex gap-3">
          <Link to="/app" className="px-4 py-2 rounded-lg bg-blue-600 text-white">Launch App</Link>
          <Link to="/auth" className="px-4 py-2 rounded-lg border">Login / Register</Link>
        </div>
      </div>
    </div>
  )
}
