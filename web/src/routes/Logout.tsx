// src/routes/Logout.tsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function Logout() {
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        await supabase.auth.signOut();
      } finally {
        navigate('/auth', { replace: true });
      }
    })();
  }, [navigate]);

  return (
    <div className="min-h-screen grid place-items-center p-6">
      <div className="opacity-70 text-sm">Logge aus…</div>
    </div>
  );
}
