import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

const AuthContext = createContext(null);
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('buildops_token') || null);
  const [loading, setLoading] = useState(true);
  const [isEmailUnverified, setIsEmailUnverified] = useState(false);
  const [authProvider, setAuthProvider] = useState(isSupabaseConfigured ? 'supabase' : 'local');

  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      if (isSupabaseConfigured) {
        try {
          const { data: { session: currentSession }, error } = await supabase.auth.getSession();
          if (error) throw error;

          if (currentSession && mounted) {
            setSession(currentSession);
            setToken(currentSession.access_token);
            
            const supabaseUser = currentSession.user;
            const formattedUser = {
              user_id: supabaseUser.id,
              email: supabaseUser.email,
              full_name: supabaseUser.user_metadata?.full_name || supabaseUser.email.split('@')[0],
              role: supabaseUser.user_metadata?.role || 'contractor',
              phone_number: supabaseUser.user_metadata?.phone_number || null,
              email_confirmed_at: supabaseUser.email_confirmed_at
            };
            setUser(formattedUser);
            setIsEmailUnverified(!supabaseUser.email_confirmed_at);
          }
        } catch (err) {
          console.warn('[Supabase Auth Warning] Error fetching session:', err.message);
        }
      }

      // Local API Token check if no active Supabase session
      if (!session && token && mounted) {
        try {
          const res = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setUser(data.user);
            setAuthProvider('local');
          } else {
            logout();
          }
        } catch {
          // If offline/error keep stored session gracefully
        }
      }

      if (mounted) setLoading(false);
    }

    initAuth();

    // ⚡ Real-Time Auth State Listener via Supabase
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (!mounted) return;

      console.info(`[Supabase Auth Event] ${event}`);
      setSession(currentSession);

      if (currentSession) {
        const supabaseUser = currentSession.user;
        const formattedUser = {
          user_id: supabaseUser.id,
          email: supabaseUser.email,
          full_name: supabaseUser.user_metadata?.full_name || supabaseUser.email.split('@')[0],
          role: supabaseUser.user_metadata?.role || 'contractor',
          phone_number: supabaseUser.user_metadata?.phone_number || null,
          email_confirmed_at: supabaseUser.email_confirmed_at
        };
        setUser(formattedUser);
        setToken(currentSession.access_token);
        setIsEmailUnverified(!supabaseUser.email_confirmed_at);
        setAuthProvider('supabase');
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setSession(null);
        setToken(null);
        setIsEmailUnverified(false);
        localStorage.removeItem('buildops_token');
        localStorage.removeItem('buildops_supabase_auth');
      }

      setLoading(false);
    });

    return () => {
      mounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  // Supabase Email Sign-Up Flow
  const signUpWithEmail = async (email, password, metadata = {}) => {
    if (isSupabaseConfigured) {
      const redirectUrl = `${window.location.origin}/#auth-callback`;
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
          emailRedirectTo: redirectUrl
        }
      });

      if (error) throw error;

      const isUnverified = !data.user?.email_confirmed_at;
      if (data.user) {
        setUser({
          user_id: data.user.id,
          email: data.user.email,
          full_name: metadata.full_name || email.split('@')[0],
          role: metadata.role || 'contractor',
          phone_number: metadata.phone_number || null,
          email_confirmed_at: data.user.email_confirmed_at
        });
        setIsEmailUnverified(isUnverified);
      }

      return { user: data.user, session: data.session, isUnverified };
    }

    // Fallback to Express Local API Registration
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, ...metadata })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');

    localStorage.setItem('buildops_token', data.token);
    setToken(data.token);
    setUser(data.user);
    setAuthProvider('local');
    setIsEmailUnverified(false);
    return { user: data.user, token: data.token, isUnverified: false };
  };

  // Supabase Email & Password Sign-In
  const signInWithPassword = async (email, password) => {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        // Fallback to local express API if Supabase login fails or user exists locally
        try {
          return await loginLocalApi(email, password);
        } catch {
          throw error;
        }
      }

      const supabaseUser = data.user;
      const formattedUser = {
        user_id: supabaseUser.id,
        email: supabaseUser.email,
        full_name: supabaseUser.user_metadata?.full_name || supabaseUser.email.split('@')[0],
        role: supabaseUser.user_metadata?.role || 'contractor',
        phone_number: supabaseUser.user_metadata?.phone_number || null,
        email_confirmed_at: supabaseUser.email_confirmed_at
      };

      setUser(formattedUser);
      setSession(data.session);
      setToken(data.session.access_token);
      setIsEmailUnverified(!supabaseUser.email_confirmed_at);
      setAuthProvider('supabase');
      return formattedUser;
    }

    return await loginLocalApi(email, password);
  };

  // Helper for Express Local API Login
  const loginLocalApi = async (email, password) => {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');

    localStorage.setItem('buildops_token', data.token);
    setToken(data.token);
    setUser(data.user);
    setAuthProvider('local');
    setIsEmailUnverified(false);
    return data.user;
  };

  // Sign Out
  const signOut = async () => {
    if (isSupabaseConfigured) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('[Supabase SignOut Warning]:', err.message);
      }
    }
    localStorage.removeItem('buildops_token');
    localStorage.removeItem('buildops_supabase_auth');
    setUser(null);
    setSession(null);
    setToken(null);
    setIsEmailUnverified(false);
  };

  // Resend Email Confirmation
  const resendVerificationEmail = async (email) => {
    if (!isSupabaseConfigured) return;
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/#auth-callback`
      }
    });
    if (error) throw error;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        token,
        loading,
        isEmailUnverified,
        authProvider,
        isSupabaseConfigured,
        signUpWithEmail,
        signInWithPassword,
        signOut,
        login: signInWithPassword,
        register: (data) => signUpWithEmail(data.email, data.password, data),
        logout: signOut,
        resendVerificationEmail,
        isAuthenticated: !!user
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
