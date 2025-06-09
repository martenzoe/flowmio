import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useCurrentUser } from "../hooks/useCurrentUser";

export default function Navbar() {
  const { user, profile, loading } = useCurrentUser();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setMenuOpen(false);
    window.location.href = "/login"; // Hard redirect, löscht React-Zustand
  };

  if (loading || !user) return null;

  return (
    <header className="bg-white shadow-sm p-4 flex justify-between items-center">
      <Link to="/dashboard" className="text-xl font-bold text-[#84C7AE]">
        Flowmio
      </Link>

      <nav className="flex items-center gap-6 text-sm text-gray-700">
        <Link to="/dashboard" className="hover:text-[#84C7AE]">Dashboard</Link>
        <Link to="/faq" className="hover:text-[#84C7AE]">FAQ</Link>
        <Link to="/kontakt" className="hover:text-[#84C7AE]">Hilfe</Link>

        <div className="relative">
          <button
            onClick={() => setMenuOpen((prev) => !prev)}
            className="flex items-center gap-2 focus:outline-none"
          >
            <span className="font-medium">{profile?.nickname || "Profil"}</span>
            <img
              src={profile?.avatar_url || "/avatars/cat1.png"}
              alt="avatar"
              className="w-8 h-8 rounded-full border"
            />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white border rounded shadow-md z-10">
              <Link to="/profil/edit" className="block px-4 py-2 hover:bg-gray-100">
                Profil bearbeiten
              </Link>
              <Link to="/profil/passwort" className="block px-4 py-2 hover:bg-gray-100">
                Passwort ändern
              </Link>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-500"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
