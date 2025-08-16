import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function RequireAuth({ children }: { children: React.ReactElement }) {
  const [ready, setReady] = useState(false)
  const [authed, setAuthed] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setAuthed(!!data.session); setReady(true)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setAuthed(!!session)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  if (!ready) return <div className="p-6">Loading…</div>
  if (!authed) return <div className="p-6">Bitte <a className="text-blue-600" href="/auth">einloggen</a>.</div>
  return children
}
