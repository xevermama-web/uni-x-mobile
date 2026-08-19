-- ==============================================================================
-- Uni-X Complete & Safe Database Schema
-- Copy and run this ENTIRE script in the Supabase SQL Editor.
-- ==============================================================================

-- 1. Fix Permissions for schema public (Resolves "permission denied for schema public")
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL ROUTINES IN SCHEMA public TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO postgres, anon, authenticated, service_role;

-- 2. Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 3. Create core tables with correct structures aligning with React hooks

-- DEPARTMENTS (uses text ID)
CREATE TABLE IF NOT EXISTS public.departments (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    head_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PROFILES (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    role TEXT DEFAULT 'student',
    full_name TEXT NOT NULL,
    email TEXT,
    avatar_url TEXT,
    academic_id TEXT UNIQUE,
    department TEXT,
    batch TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- COURSES
CREATE TABLE IF NOT EXISTS public.courses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    course_code TEXT UNIQUE,
    title TEXT,
    description TEXT,
    department_id TEXT,
    credits INTEGER DEFAULT 3,
    instructor_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ROUTINES
CREATE TABLE IF NOT EXISTS public.routines (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    department_id TEXT,
    batch TEXT,
    day_of_week TEXT,
    start_time TEXT,
    end_time TEXT,
    course TEXT,
    faculty_name TEXT,
    room TEXT,
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- NOTICES
CREATE TABLE IF NOT EXISTS public.notices (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT DEFAULT 'text',
    department_id TEXT DEFAULT 'ALL',
    tag TEXT DEFAULT 'INFO',
    tag_color TEXT DEFAULT 'bg-blue-100 text-blue-800',
    expires_at TIMESTAMPTZ,
    author_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);


-- 4. Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;

-- 5. Drop ALL old policies to avoid conflicts
DO $$ 
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE schemaname = 'public' 
          AND tablename IN ('profiles', 'departments', 'courses', 'routines', 'notices')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
    END LOOP;
END $$;

-- 6. Recreate simple, robust policies

-- Profiles
CREATE POLICY "Public profiles read" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
-- Allow admins and moderators to manage profiles using JWT claims to avoid infinite recursion
CREATE POLICY "Admins manage profiles" ON public.profiles FOR ALL 
USING ( (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'moderator') )
WITH CHECK ( (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'moderator') );
-- Allow the user trigger to insert
CREATE POLICY "Insert profiles" ON public.profiles FOR INSERT WITH CHECK (true);

-- Departments
CREATE POLICY "Public departments read" ON public.departments FOR SELECT USING (true);
CREATE POLICY "Admins manage departments" ON public.departments FOR ALL 
USING ( (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'moderator') );

-- Courses
CREATE POLICY "Public courses read" ON public.courses FOR SELECT USING (true);
CREATE POLICY "Admins manage courses" ON public.courses FOR ALL 
USING ( (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'moderator') );

-- Routines
CREATE POLICY "Public routines read" ON public.routines FOR SELECT USING (true);
CREATE POLICY "Admins manage routines" ON public.routines FOR ALL 
USING ( (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'moderator') );

-- Notices
CREATE POLICY "Public notices read" ON public.notices FOR SELECT USING (true);
CREATE POLICY "Admins manage notices" ON public.notices FOR ALL 
USING ( (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'moderator', 'faculty') );


-- 7. Trigger to automatically create a profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, academic_id, department, batch, email)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    COALESCE(new.raw_user_meta_data->>'role', 'student'), 
    new.raw_user_meta_data->>'academic_id',
    new.raw_user_meta_data->>'department',
    new.raw_user_meta_data->>'batch',
    new.email
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    academic_id = EXCLUDED.academic_id,
    department = EXCLUDED.department,
    batch = EXCLUDED.batch,
    email = EXCLUDED.email;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-attach trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

