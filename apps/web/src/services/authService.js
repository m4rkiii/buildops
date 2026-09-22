import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

/**
 * Checks if a username is available in public.users
 */
export async function checkUsernameAvailability(username) {
  if (!username || username.trim().length < 3) {
    return { available: false, error: 'Username must be at least 3 characters long.' };
  }

  const cleanUsername = username.trim().toLowerCase();

  // Validate format regex (3-30 alphanumeric or _ -)
  if (!/^[a-zA-Z0-9_-]{3,30}$/.test(cleanUsername)) {
    return { available: false, error: 'Username can only contain letters, numbers, underscores, and hyphens (3-30 chars).' };
  }

  if (!isSupabaseConfigured) {
    return { available: true, error: null };
  }

  try {
    // Call RPC if available
    const { data: isAvailable, error: rpcErr } = await supabase.rpc('check_username_available', {
      p_username: cleanUsername
    });

    if (!rpcErr && typeof isAvailable === 'boolean') {
      return { available: isAvailable, error: isAvailable ? null : 'Username is already taken.' };
    }

    // Direct table query fallback
    const { data, error } = await supabase
      .from('users')
      .select('username')
      .ilike('username', cleanUsername)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      // ignore 0 rows
    }

    return { available: !data, error: data ? 'Username is already taken.' : null };
  } catch {
    return { available: true, error: null };
  }
}

/**
 * Resolves username to email via RPC or public.users table query
 */
export async function resolveUsernameToEmail(username) {
  const cleanUsername = username.trim().toLowerCase();

  if (!isSupabaseConfigured) {
    return null;
  }

  try {
    // 1. Try RPC function
    const { data: rpcEmail, error: rpcErr } = await supabase.rpc('get_email_for_username', {
      p_username: cleanUsername
    });

    if (!rpcErr && rpcEmail) {
      return rpcEmail;
    }

    // 2. Fallback to direct public.users SELECT query
    const { data, error } = await supabase
      .from('users')
      .select('email')
      .ilike('username', cleanUsername)
      .maybeSingle();

    if (!error && data?.email) {
      return data.email;
    }
  } catch (err) {
    console.warn('[AuthService] Username lookup warning:', err.message);
  }

  return null;
}

/**
 * Sign up with Username, Email, Password, and Metadata
 * Supports real-time database synchronization and automatic login upon creation
 */
export async function signUpWithUsername(arg1, arg2, arg3, arg4) {
  let username, email, password, role, full_name, phone_number;

  if (typeof arg1 === 'object' && arg1 !== null) {
    ({ username, email, password, role = 'contractor', full_name, phone_number } = arg1);
  } else {
    username = arg1;
    email = arg2;
    password = arg3;
    if (arg4 && typeof arg4 === 'object') {
      role = arg4.role || 'contractor';
      full_name = arg4.full_name;
      phone_number = arg4.phone_number;
    }
  }

  if (!username || username.trim().length < 3) {
    throw new Error('Username must be at least 3 characters long.');
  }

  // Verify username availability
  const check = await checkUsernameAvailability(username);
  if (!check.available) {
    throw new Error(check.error || 'Username is already taken.');
  }

  const redirectUrl = `${window.location.origin}/#auth-callback`;
  const cleanUsername = username.trim().toLowerCase();
  const cleanEmail = email.trim();

  if (isSupabaseConfigured) {
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          username: cleanUsername,
          full_name: full_name || cleanUsername,
          role: role || 'contractor',
          phone_number: phone_number || null
        },
        emailRedirectTo: redirectUrl
      }
    });

    if (error) throw error;

    let user = data.user;
    let session = data.session;

    // Attempt real-time auto-login if session was not returned immediately
    if (!session && user) {
      try {
        const loginRes = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password
        });
        if (loginRes.data?.session) {
          session = loginRes.data.session;
          user = loginRes.data.user;
        }
      } catch {
        // If email verification is strictly required by Supabase instance, session remains null until confirmed
      }
    }

    // Save directly to public.users table for real-time database synchronization
    if (user) {
      try {
        await supabase.from('users').upsert({
          id: user.id,
          username: cleanUsername,
          email: cleanEmail
        }, { onConflict: 'id' });
      } catch (dbErr) {
        console.warn('[AuthService] Real-time public.users upsert warning:', dbErr.message);
      }
    }

    const isUnverified = !user?.email_confirmed_at && !session;
    return {
      user,
      session,
      isUnverified,
      message: isUnverified ? 'Account created! Please check your email inbox to confirm your account.' : 'Account created and signed in successfully!'
    };
  }

  // Local API Fallback
  try {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://buildops-api-33fl.onrender.com';
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: cleanUsername,
        email: cleanEmail,
        password,
        role: role || 'contractor',
        full_name: full_name || cleanUsername,
        phone_number
      })
    });

    const data = await res.json();
    if (res.ok && data.user) {
      return { user: data.user, token: data.token || 'local-jwt-token', isUnverified: false };
    }
    if (!res.ok && data.error) {
      throw new Error(data.error);
    }
  } catch (err) {
    if (err.message && !err.message.includes('fetch') && !err.message.includes('Failed to fetch')) {
      throw err;
    }
  }

  // Standalone Client Fallback User
  const fallbackUser = {
    id: `usr_${Date.now()}`,
    user_id: `usr_${Date.now()}`,
    username: cleanUsername,
    email: cleanEmail,
    full_name: full_name || cleanUsername,
    role: role || 'contractor',
    phone_number: phone_number || null,
    email_confirmed_at: new Date().toISOString()
  };

  return { user: fallbackUser, token: `mock_jwt_${Date.now()}`, isUnverified: false };
}

/**
 * Sign in with Username OR Email and Password
 */
export async function signInWithUsernameOrEmail({ identifier, password }) {
  const cleanId = identifier.trim();
  const isEmail = cleanId.includes('@');

  let loginEmail = cleanId;

  if (!isEmail) {
    const resolved = await resolveUsernameToEmail(cleanId);
    if (!resolved) {
      // If offline/hybrid fallback mode and username is provided
      loginEmail = `${cleanId}@buildops.co.ke`;
    } else {
      loginEmail = resolved;
    }
  }

  if (isSupabaseConfigured) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password
    });

    if (error) {
      if (error.message?.toLowerCase().includes('email not confirmed') || (error.status === 400 && error.message?.includes('Email not confirmed'))) {
        const err = new Error('Email not confirmed. Please check your inbox and verify your email before signing in.');
        err.isEmailUnconfirmed = true;
        err.email = loginEmail;
        throw err;
      }
      if (error.message?.toLowerCase().includes('invalid login credentials')) {
        throw new Error('Invalid login credentials. Please check your username/email and password.');
      }
      throw error;
    }

    return { user: data.user, session: data.session };
  }

  // Local API Fallback
  try {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://buildops-api-33fl.onrender.com';
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: loginEmail, password })
    });

    const data = await res.json();
    if (res.ok && data.user) {
      return { user: data.user, token: data.token };
    }
    if (!res.ok && data.error) {
      throw new Error(data.error);
    }
  } catch (err) {
    if (err.message && !err.message.includes('fetch') && !err.message.includes('Failed to fetch')) {
      throw err;
    }
  }

  // Standalone Client Fallback User
  const fallbackUser = {
    id: `usr_${Date.now()}`,
    user_id: `usr_${Date.now()}`,
    username: cleanId.replace('@buildops.co.ke', ''),
    email: loginEmail,
    full_name: cleanId.split('@')[0],
    role: 'contractor',
    email_confirmed_at: new Date().toISOString()
  };

  return { user: fallbackUser, token: `mock_jwt_${Date.now()}` };
}

/**
 * Resend email confirmation link
 */
export async function resendConfirmationEmail(email) {
  if (!isSupabaseConfigured) return true;
  const redirectUrl = `${window.location.origin}/#auth-callback`;
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: email.trim(),
    options: {
      emailRedirectTo: redirectUrl
    }
  });

  if (error) throw error;
  return true;
}
