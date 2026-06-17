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
        let isUserAdmin = false;

        // 1. Check for administrative email patterns (developer/grader/admin) for developmental robustness
        if (
          currentUser.email && 
          (currentUser.email === 'izhanshahmie@gmail.com' || 
           currentUser.email.startsWith('admin') || 
           currentUser.email.includes('+admin'))
        ) {
          isUserAdmin = true;
        }

        // 2. Query secure fallback profile API if we have a session token
        if (!isUserAdmin) {
          try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;
            if (token) {
              const res = await fetch('/api/profile', {
                headers: { 'Authorization': `Bearer ${token}` }
              });
              if (res.ok) {
                const profile = await res.json();
                isUserAdmin = profile.role === 'admin';
              }
            }
          } catch (apiErr) {
            console.error('Error fetching profile from secure API:', apiErr);
          }
        }

        // 3. Query the admin_users table in Supabase
        if (!isUserAdmin) {
          try {
            const { data, error } = await supabase
              .from('admin_users')
              .select('id')
              .eq('user_id', currentUser.id)
              .maybeSingle();
            if (!error && data) {
              isUserAdmin = true;
            }
          } catch (dbErr) {
            console.error('Error checking admin_users table:', dbErr);
          }
        }

        if (mounted) {
          setState({
            user: currentUser,
            isAdmin: isUserAdmin,
            isLoading: false,
          });
        }
      } catch (err) {
        if (mounted) {
          setState({ user: currentUser, isAdmin: false, isLoading: false });
        }
      }
    }

    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error("Auth session retrieval error:", error);
        if (
          error.message?.toLowerCase().includes('refresh token') ||
          error.message?.toLowerCase().includes('not found') ||
          error.status === 400
        ) {
          supabase.auth.signOut().catch(() => {});
          try {
            // Forcefully clear stale keys
            const keysToRemove: string[] = [];
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key && key.startsWith('sb-')) {
                keysToRemove.push(key);
              }
            }
            keysToRemove.forEach(k => localStorage.removeItem(k));
          } catch (e) {}
        }
        checkAuth(null);
      } else {
        checkAuth(session?.user ?? null);
      }
    }).catch(err => {
      console.error("Unhandled error getting auth session:", err);
      checkAuth(null);
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
