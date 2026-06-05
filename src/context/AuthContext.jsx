import { createContext, useContext, useEffect, useState } from 'react';
import { buildProfileFromClaims, hasPermission as profileHasPermission, PERMISSIONS } from '../auth/permissions';
import { supabase, hasSupabaseConfig } from '../config/supabase';
import { api } from '../services/api';

const AuthContext = createContext({});

const demoProfile = buildProfileFromClaims({
  sub: 'demo-admin',
  email: 'demo-admin@local',
  aud: 'demo',
  app_metadata: {
    rbac_role: 'admin',
    permissions: Object.values(PERMISSIONS),
  },
  user_metadata: {
    full_name: 'Demo Administrator',
  },
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(hasSupabaseConfig ? null : demoProfile);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(hasSupabaseConfig ? null : demoProfile);
  const [loading, setLoading] = useState(hasSupabaseConfig);

  useEffect(() => {
    if (!hasSupabaseConfig || !supabase) {
      setUser(demoProfile);
      setProfile(demoProfile);
      setLoading(false);
      return undefined;
    }

    let isMounted = true;

    const hydrateSession = async (nextSession) => {
      if (!isMounted) {
        return;
      }

      setSession(nextSession);
      setUser(nextSession?.user || null);

      if (!nextSession?.user) {
        setProfile(null);
        setLoading(false);
        return;
      }

      try {
        const res = await api.get('/users/me');
        if (!isMounted) {
          return;
        }
        setProfile(res.data);
      } catch (error) {
        if (!isMounted) {
          return;
        }
        console.error('Error hydrating auth profile:', error);
        setProfile(buildProfileFromClaims(nextSession.user));
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    supabase.auth.getSession().then(({ data: { session: activeSession } }) => {
      hydrateSession(activeSession);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setLoading(true);
      hydrateSession(nextSession);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email, password) => {
    if (!hasSupabaseConfig || !supabase) {
      setUser(demoProfile);
      setProfile(demoProfile);
      return { data: { user: demoProfile, session: null }, error: null };
    }

    return supabase.auth.signInWithPassword({ email, password });
  };

  const signOut = async () => {
    if (!hasSupabaseConfig || !supabase) {
      setUser(null);
      setSession(null);
      setProfile(null);
      return { error: null };
    }

    return supabase.auth.signOut();
  };

  const role = profile?.role || 'viewer';
  const permissions = profile?.permissions || [];
  const displayName =
    profile?.display_name ||
    user?.user_metadata?.full_name ||
    user?.email ||
    'User';

  const can = (permission) => profileHasPermission(profile, permission);
  const canAny = (permissionList = []) => permissionList.some((permission) => can(permission));

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        role,
        permissions,
        displayName,
        signIn,
        signOut,
        loading,
        can,
        canAny,
        isDemoMode: !hasSupabaseConfig,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
