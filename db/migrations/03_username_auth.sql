-- BuildOps Sentinel: Username Authentication & Public Users Table Synchronization Migration
-- File: db/migrations/03_username_auth.sql

-- 1. Enable CITEXT Extension for Case-Insensitive Username & Email Matching
CREATE EXTENSION IF NOT EXISTS citext;

-- 2. Create or Update public.users table (synchronized with Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username CITEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure case-insensitive constraint & regex format check (3-30 chars, alphanumeric + underscores/hyphens)
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS check_username_format;
ALTER TABLE public.users ADD CONSTRAINT check_username_format CHECK (username ~* '^[a-zA-Z0-9_-]{3,30}$');

-- Index for fast username lookup
CREATE INDEX IF NOT EXISTS idx_users_username_lower ON public.users (LOWER(username));

-- 3. Enable Row Level Security (RLS) on public.users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Allow public read access to usernames for sign-in resolution & availability checking
DROP POLICY IF EXISTS users_public_select ON public.users;
CREATE POLICY users_public_select ON public.users
    FOR SELECT
    USING (true);

-- Allow authenticated users to update their own profile
DROP POLICY IF EXISTS users_update_own_profile ON public.users;
CREATE POLICY users_update_own_profile ON public.users
    FOR UPDATE
    USING (auth.uid() = id);

-- 4. Trigger Function: handle_new_user()
-- Automatically populates public.users whenever a user registers via Email+Password or Google OAuth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_username TEXT;
  v_base_username TEXT;
  v_counter INTEGER := 1;
BEGIN
  -- Extract username passed in raw_user_meta_data during signUp
  v_username := NEW.raw_user_meta_data->>'username';
  
  -- Fallback for OAuth (Google Auth) or missing username: generate default unique username
  IF v_username IS NULL OR TRIM(v_username) = '' THEN
    IF NEW.raw_user_meta_data->>'full_name' IS NOT NULL THEN
      v_base_username := LOWER(REGEXP_REPLACE(NEW.raw_user_meta_data->>'full_name', '[^a-zA-Z0-9]', '', 'g'));
    ELSIF NEW.email IS NOT NULL THEN
      v_base_username := LOWER(SPLIT_PART(NEW.email, '@', 1));
    ELSE
      v_base_username := 'user_' || SUBSTRING(NEW.id::text, 1, 8);
    END IF;

    v_username := v_base_username;
    
    -- Guarantee uniqueness for fallback username
    WHILE EXISTS (SELECT 1 FROM public.users WHERE LOWER(username) = LOWER(v_username)) LOOP
      v_username := v_base_username || v_counter;
      v_counter := v_counter + 1;
    END LOOP;
  END IF;

  INSERT INTO public.users (id, username, email, created_at)
  VALUES (NEW.id, LOWER(TRIM(v_username)), NEW.email, COALESCE(NEW.created_at, NOW()))
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    username = COALESCE(public.users.username, EXCLUDED.username);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-attach trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. RPC Function: get_email_for_username(p_username TEXT)
-- Resolves a submitted username to its registered email address for Supabase Auth signInWithPassword
CREATE OR REPLACE FUNCTION public.get_email_for_username(p_username TEXT)
RETURNS TEXT AS $$
DECLARE
  v_email TEXT;
BEGIN
  SELECT email INTO v_email
  FROM public.users
  WHERE LOWER(username) = LOWER(TRIM(p_username))
  LIMIT 1;

  RETURN v_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. RPC Function: check_username_available(p_username TEXT)
-- Helper function to check username availability before submission
CREATE OR REPLACE FUNCTION public.check_username_available(p_username TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM public.users WHERE LOWER(username) = LOWER(TRIM(p_username))
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
