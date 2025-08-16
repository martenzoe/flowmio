import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Auth() {
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [err, setErr] = useState<string>()

  async function register(e: React.FormEvent) {
    e.preventDefault(); setErr(undefined)
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) setErr(error.message)
  }
  async function login(e: React.FormEvent) {
    e.preventDefault(); setErr(undefined)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setErr(error.message)
    else window.location.href = '/app'
  }
  async function loginGoogle() {
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + '/app' } })
  }

  return (
    <div className="min-h-screen grid place-items-center">
      <form className="w-full max-w-sm space-y-3" onSubmit={login}>
        <h1 className="text-xl font-semibold">Login / Register</h1>
        <input className="w-full border rounded px-3 py-2" placeholder="E-Mail" value={email} onChange={e=>setEmail(e.target.value)} />
        <input className="w-full border rounded px-3 py-2" placeholder="Passwort" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
        {err && <p className="text-red-600 text-sm">{err}</p>}
        <div className="flex gap-2">
          <button className="px-4 py-2 rounded bg-blue-600 text-white" type="submit">Login</button>
          <button className="px-4 py-2 rounded border" onClick={register} type="button">Register</button>
          <button className="px-4 py-2 rounded border" onClick={loginGoogle} type="button">Google</button>
        </div>
      </form>
    </div>
  )
}
