// src/routes/AcademyIndex.tsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

type Phase = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  order_index: number | null;
};

export default function AcademyIndex() {
  const [phases, setPhases] = useState<Phase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('phases')
        .select('id,title,slug,description,order_index')
        .order('order_index', { ascending: true });
      setPhases(data ?? []);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Gründer-Akademie</h1>
          <p className="text-sm opacity-70">Wähle deine Phase – jede Phase enthält 5 Module.</p>
        </div>
      </header>

      {loading ? (
        <div className="panel">Lade…</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {phases.map((p) => (
            <Link
              key={p.id}
              to={`/app/academy/${p.slug}`}
              className="card hover:translate-y-[1px] transition"
            >
              <div className="text-2xl">📚</div>
              <div className="mt-2 font-medium">{p.title}</div>
              {p.description && (
                <div className="text-sm opacity-70 mt-1 line-clamp-2">{p.description}</div>
              )}
            </Link>
          ))}

          {!phases.length && <div className="panel">Noch keine Phasen angelegt.</div>}
        </div>
      )}
    </div>
  );
}
