// src/hooks/useCurrentUser.js
import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";

export function useCurrentUser() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    setLoading(true);

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    setUser(user);

    if (user) {
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (!profileError) {
        setProfile(profileData);
      } else {
        setProfile(null);
      }
    } else {
      setProfile(null);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      fetchUser();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchUser]);

  return { user, profile, loading, refreshUser: fetchUser };
}
