// src/routes/ModulesIndex.tsx
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

type ModuleRow = { id: string; title: string; slug: string; description?: string | null }
type ProgressRow = { module_id: string | null; completed: boolean | null }
type StatusFilter = 'all' | 'open' | 'done'

export default function ModulesIndex() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [modules, setModules] = useState<ModuleRow[]>([])
  const [progress, setProgress] = useState<Record<string, boolean>>({})
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')

  useEffect(() => {
    let alive = true
    ;(async () => {
      setLoading(true)
      const [{ data: mods }, { data: prog }] = await Promise.all([
        supabase.from('modules').select('id,title,slug,description').order('title', { ascending: true }),
        supabase.from('user_module_progress').select('module_id,completed'),
      ])
      if (!alive) return

      setModules(mods ?? [])
      const map: Record<string, boolean> = {}
      ;(prog as ProgressRow[] | null)?.forEach((p) => {
        if (p.module_id) map[p.module_id] = !!p.completed
      })
      setProgress(map)
      setLoading(false)
    })()
    return () => { alive = false }
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return modules.filter((m) => {
      const matchesSearch =
        !q || m.title.toLowerCase().includes(q) || (m.description ?? '').toLowerCase().includes(q)
      const isDone = !!progress[m.id]
      const matchesStatus = status === 'all' ? true : status === 'done' ? isDone : !isDone
      return matchesSearch && matchesStatus
    })
  }, [modules, progress, query, status])

  const done = useMemo(() => Object.values(progress).filter(Boolean).length, [progress])
  const total = modules.length
  const percent = total ? Math.round((done / total) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Kopf */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-xl font-semibold">Alle Module</h1>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm opacity-70">{done} von {total} abgeschlossen</span>
            <div className="h-2 w-40 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full bg-slate-900" style={{ width: `${percent}%` }} />
            </div>
            <span className="text-sm opacity-70">{percent}%</span>
          </div>
        </div>

        {/* Suche & Filter */}
        <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center">
          <div className="flex-1">
            <div className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-1.5">
              <span className="opacity-60">🔎</span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full outline-none bg-transparent text-sm"
                placeholder="Module suchen…"
              />
            </div>
          </div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as StatusFilter)}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            <option value="all">Alle</option>
            <option value="open">Offen</option>
            <option value="done">Abgeschlossen</option>
          </select>
        </div>
      </div>

      {/* Liste */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          : filtered.map((m) => {
              const isDone = !!progress[m.id]
              return (
                <div key={m.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">{isDone ? '✅' : '📺'}</div>
                    <div className="flex-1">
                      <div className="font-medium">{m.title}</div>
                      {m.description ? (
                        <p className="text-sm opacity-80 mt-1 line-clamp-3">{m.description}</p>
                      ) : null}
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <span className={`text-xs rounded-full px-2 py-1 border ${
                      isDone ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                             : 'border-slate-300 bg-slate-50 text-slate-700'
                    }`}>
                      {isDone ? 'Abgeschlossen' : 'Offen'}
                    </span>
                    <button
                      onClick={() => navigate(`/app/modules/${m.slug}`)}
                      className="rounded-xl border border-slate-300 px-3 py-1.5 hover:bg-slate-50 text-sm"
                    >
                      Öffnen
                    </button>
                  </div>
                </div>
              )
            })}
      </div>

      {!loading && filtered.length === 0 && (
        <div className="text-sm opacity-70 text-center py-10">Keine Module gefunden.</div>
      )}
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm animate-pulse">
      <div className="h-4 w-1/2 bg-slate-200 rounded" />
      <div className="mt-3 h-3 w-full bg-slate-100 rounded" />
      <div className="mt-2 h-3 w-5/6 bg-slate-100 rounded" />
      <div className="mt-2 h-3 w-2/3 bg-slate-100 rounded" />
      <div className="mt-4 h-8 w-24 bg-slate-100 rounded" />
    </div>
  )
}
