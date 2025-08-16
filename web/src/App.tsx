import { Outlet, Link } from 'react-router-dom'
export default function App() {
  return (
    <div className="min-h-screen">
      <header className="border-b">
        <nav className="mx-auto max-w-6xl flex items-center justify-between p-4">
          <Link to="/app" className="font-semibold">Flowmio</Link>
          <div className="space-x-3">
            <Link to="/" className="text-sm text-gray-500">Landing</Link>
          </div>
        </nav>
      </header>
      <main className="mx-auto max-w-6xl p-6">
        <Outlet />
      </main>
    </div>
  )
}
