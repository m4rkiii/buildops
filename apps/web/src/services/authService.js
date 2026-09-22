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
 */
export async function signUpWithUsername({ username, email, password, role = 'contractor', full_name, phone_number }) {
  if (!username || username.trim().length < 3) {
    throw new Error('Username must be at least 3 characters long.');
  }

  // Verify username availability
  const check = await checkUsernameAvailability(username);
  if (!check.available) {
    throw new Error(check.error || 'Username is already taken.');
  }

  const redirectUrl = `${window.location.origin}/#auth-callback`;

  if (isSupabaseConfigured) {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          username: username.trim().toLowerCase(),
          full_name: full_name || username.trim(),
          role,
          phone_number: phone_number || null
        },
        emailRedirectTo: redirectUrl
      }
    });

    if (error) throw error;

    const isUnverified = !data.user?.email_confirmed_at;
    return {
      user: data.user,
      session: data.session,
      isUnverified,
      message: isUnverified ? 'Please check your email inbox to verify your account before logging in.' : 'Account created successfully!'
    };
  }

  // Local API Fallback
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://buildops-api-33fl.onrender.com';
  const res = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: username.trim().toLowerCase(),
      email: email.trim(),
      password,
      role,
      full_name: full_name || username.trim(),
      phone_number
    })
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Registration failed');
  return { user: data.user, token: data.token, isUnverified: false };
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
      throw new Error(`No registered account found matching username '${cleanId}'. Please check your spelling or register.`);
    }
    loginEmail = resolved;
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
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://buildops-api-33fl.onrender.com';
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: loginEmail, password })
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Login failed');
  return { user: data.user, token: data.token };
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
