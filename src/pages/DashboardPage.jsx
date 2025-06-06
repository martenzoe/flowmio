import { Link, useNavigate } from "react-router-dom";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { supabase } from "../lib/supabaseClient";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const { user, profile } = useCurrentUser();
  const navigate = useNavigate();
  const [progress, setProgress] = useState([]);

  const tiles = [
    { type: "bp", title: "Businessplan", emoji: "📘", to: "/businessplan" },
    { type: "video", title: "Video-Kurse", emoji: "🎥", to: "/videos" },
    { type: "workbook", title: "Workbooks", emoji: "📂", to: "/workbooks" },
  ];

  useEffect(() => {
    if (user) {
      supabase
        .from("progress")
        .select("*")
        .eq("user_id", user.id)
        .then(({ data }) => {
          setProgress(data || []);
        });
    }
  }, [user]);

  const logout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const getProgress = (type) => {
    const total = progress.filter((p) => p.type === type).length;
    const completed = progress.filter(
      (p) => p.type === type && p.status === "completed"
    ).length;
    return { completed, total };
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Hallo {profile?.username || "Gründer:in"} 👋
            </h1>
            <p className="text-sm text-gray-500">
              Willkommen zurück bei Flowmio
            </p>
          </div>
          <button
            onClick={logout}
            className="bg-red-100 text-red-600 px-4 py-2 rounded-xl hover:bg-red-200 text-sm"
          >
            Logout
          </button>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {tiles.map((tile) => {
            const { completed, total } = getProgress(tile.type);
            return (
              <Link
                to={tile.to}
                key={tile.type}
                className="bg-white rounded-2xl shadow-md hover:shadow-lg transition p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="text-4xl mb-4">{tile.emoji}</div>
                  <h2 className="text-xl font-semibold text-gray-800">
                    {tile.title}
                  </h2>
                  <p className="text-gray-600 mt-2 text-sm">
                    {total > 0
                      ? `${completed}/${total} abgeschlossen`
                      : "Noch nicht gestartet"}
                  </p>
                </div>
                <div className="mt-4 text-right text-sm text-[#84C7AE] font-semibold">
                  Jetzt starten →
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
