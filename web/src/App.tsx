import { Outlet, NavLink, Link } from 'react-router-dom'
import RequireAuth from './components/RequireAuth'
import { supabase } from './lib/supabase'   // <- war '../lib/supabase' (falsch)

export default function App() {
  async function logout() {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <RequireAuth>
      <div className="min-h-screen">
        <header className="border-b bg-white">
          <nav className="mx-auto max-w-6xl flex items-center justify-between p-4">
            <Link to="/app" className="font-semibold">Flowmio</Link>
            <div className="space-x-4">
              <NavLink
                to="/"
                className={({ isActive }) =>
                  'text-sm ' + (isActive ? 'text-blue-600 font-medium' : 'text-gray-500')
                }
              >
                Landing
              </NavLink>
              <button onClick={logout} className="text-sm text-gray-500 hover:text-gray-700">
                Logout
              </button>
            </div>
          </nav>
        </header>
        <main className="mx-auto max-w-6xl p-6">
          <Outlet />
        </main>
      </div>
    </RequireAuth>
  )
}
