import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

type AuthState = {
  user: User | null;
  isAdmin: boolean;
  isLoading: boolean;
};

const AuthContext = createContext<AuthState>({
  user: null,
  isAdmin: false,
  isLoading: true,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAdmin: false,
    isLoading: true,
  });

  useEffect(() => {
    let mounted = true;

    async function checkAuth(currentUser: User | null) {
      if (!currentUser) {
        if (mounted) setState({ user: null, isAdmin: false, isLoading: false });
        return;
      }

      try {
        const { data, error } = await supabase
          .from('admin_users')
          .select('id')
          .eq('user_id', currentUser.id)
          .maybeSingle();

        if (mounted) {
          setState({
            user: currentUser,
            isAdmin: !!data && !error,
            isLoading: false,
          });
        }
      } catch (err) {
        if (mounted) {
          setState({ user: currentUser, isAdmin: false, isLoading: false });
        }
      }
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      checkAuth(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      checkAuth(session?.user ?? null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
};
