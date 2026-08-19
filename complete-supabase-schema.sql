-- ==============================================================================
-- Uni-X Complete Database Schema for Supabase
-- Copy and run this ENTIRE script in the Supabase SQL Editor.
-- It includes schema creation, tables, RLS fixes, triggers, and permissions.
-- ==============================================================================

-- 0. Fix Permissions for schema public
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL ROUTINES IN SCHEMA public TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO postgres, anon, authenticated, service_role;

-- 1. Custom Types
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('student', 'faculty', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- TABLES
-- ==============================================================================

-- PROFILES (Extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    role user_role DEFAULT 'student',
    full_name TEXT NOT NULL,
    email TEXT,
    avatar_url TEXT,
    academic_id TEXT UNIQUE,
    department_id UUID,
    department TEXT,
    batch TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- DEPARTMENTS
CREATE TABLE IF NOT EXISTS public.departments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    head_of_department_id UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add department FK constraint to profiles if it doesn't exist
DO $$ BEGIN
  ALTER TABLE public.profiles ADD CONSTRAINT fk_department FOREIGN KEY (department_id) REFERENCES public.departments(id);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- COURSES
CREATE TABLE IF NOT EXISTS public.courses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    course_code TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT,
    credits INTEGER NOT NULL DEFAULT 3,
    department_id UUID REFERENCES public.departments(id),
    instructor_id UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ENROLLMENTS
CREATE TABLE IF NOT EXISTS public.enrollments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    semester TEXT NOT NULL,
    grade NUMERIC(4,2),
    enrolled_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, course_id, semester)
);

-- ATTENDANCE
CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT CHECK (status IN ('present', 'absent', 'late')),
    recorded_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(course_id, student_id, date)
);

-- ASSIGNMENTS
CREATE TABLE IF NOT EXISTS public.assignments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    due_date TIMESTAMPTZ NOT NULL,
    max_score INTEGER DEFAULT 100,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SUBMISSIONS
CREATE TABLE IF NOT EXISTS public.submissions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    assignment_id UUID REFERENCES public.assignments(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    score INTEGER,
    feedback TEXT,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(assignment_id, student_id)
);

-- NOTICES
CREATE TABLE IF NOT EXISTS public.notices (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    author_id UUID REFERENCES public.profiles(id),
    target_role user_role,
    department_id UUID REFERENCES public.departments(id),
    is_pinned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- STUDY GROUPS
CREATE TABLE IF NOT EXISTS public.study_groups (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    course_id UUID REFERENCES public.courses(id),
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- STUDY GROUP MEMBERS
CREATE TABLE IF NOT EXISTS public.group_members (
    group_id UUID REFERENCES public.study_groups(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (group_id, user_id)
);

-- MESSAGES (Real-time Chat)
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    group_id UUID REFERENCES public.study_groups(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- COURSE MATERIALS
CREATE TABLE IF NOT EXISTS public.materials (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    file_url TEXT NOT NULL,
    uploaded_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 1. Create a secure function to check admin status without triggering infinite recursion
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- This bypasses RLS, preventing the recursion loop
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$;

-- 2. Drop existing policies to prevent conflicts
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;

DROP POLICY IF EXISTS "Departments are viewable by everyone" ON public.departments;
DROP POLICY IF EXISTS "Courses are viewable by everyone" ON public.courses;
DROP POLICY IF EXISTS "Notices are viewable by everyone" ON public.notices;
DROP POLICY IF EXISTS "Faculty and Admin can create notices" ON public.notices;
DROP POLICY IF EXISTS "Students can see their enrollments" ON public.enrollments;

-- 3. Profiles Policies
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can insert profiles" ON public.profiles FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins can delete profiles" ON public.profiles FOR DELETE USING (public.is_admin());

-- 4. Departments Policies
CREATE POLICY "Departments are viewable by everyone" ON public.departments FOR SELECT USING (true);
CREATE POLICY "Admins can manage departments" ON public.departments FOR ALL USING (public.is_admin());

-- 5. Courses Policies
CREATE POLICY "Courses are viewable by everyone" ON public.courses FOR SELECT USING (true);
CREATE POLICY "Admins can manage courses" ON public.courses FOR ALL USING (public.is_admin());

-- 6. Notices Policies
CREATE POLICY "Notices are viewable by everyone" ON public.notices FOR SELECT USING (true);
CREATE POLICY "Faculty and Admin can create notices" ON public.notices FOR INSERT WITH CHECK (
    public.is_admin() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'faculty')
);

-- 7. Enrollments Policies
CREATE POLICY "Students can see their enrollments" ON public.enrollments FOR SELECT USING (auth.uid() = student_id OR EXISTS (
    SELECT 1 FROM public.courses c WHERE c.id = course_id AND c.instructor_id = auth.uid()
));

-- 8. Messages & Groups Policies (Permissive read/insert + Authorized delete for Admin, Moderator, Faculty)
CREATE POLICY "Groups viewable by everyone" ON public.study_groups FOR SELECT USING (true);
CREATE POLICY "Groups insertable by auth" ON public.study_groups FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE OR REPLACE FUNCTION public.can_manage_groups()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  u_role TEXT;
BEGIN
  SELECT role INTO u_role FROM public.profiles WHERE id = auth.uid();
  IF u_role IN ('admin', 'moderator', 'faculty') THEN
    RETURN TRUE;
  END IF;

  IF EXISTS (SELECT 1 FROM public.faculties WHERE user_id = auth.uid() OR email = auth.jwt()->>'email') THEN
    RETURN TRUE;
  END IF;

  IF EXISTS (SELECT 1 FROM public.moderators WHERE user_id = auth.uid() OR email = auth.jwt()->>'email') THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$;

DROP POLICY IF EXISTS "Groups deletable by admin moderator faculty" ON public.study_groups;
CREATE POLICY "Groups deletable by admin moderator faculty" ON public.study_groups
  FOR DELETE USING (public.can_manage_groups() OR EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator', 'faculty')
  ));

DROP POLICY IF EXISTS "Groups updatable by admin moderator faculty" ON public.study_groups;
CREATE POLICY "Groups updatable by admin moderator faculty" ON public.study_groups
  FOR UPDATE USING (public.can_manage_groups() OR EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator', 'faculty')
  ));

CREATE POLICY "Group members viewable by everyone" ON public.group_members FOR SELECT USING (true);
CREATE POLICY "Group members insertable by auth" ON public.group_members FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Group members deletable by auth" ON public.group_members;
CREATE POLICY "Group members deletable by auth" ON public.group_members FOR DELETE USING (true);

CREATE POLICY "Messages viewable by everyone" ON public.messages FOR SELECT USING (true);
CREATE POLICY "Messages insertable by auth" ON public.messages FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Messages deletable by auth" ON public.messages;
CREATE POLICY "Messages deletable by auth" ON public.messages FOR DELETE USING (true);


-- ==============================================================================
-- TRIGGERS
-- ==============================================================================

-- Automatically create a profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, academic_id, department, batch, email)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    COALESCE((new.raw_user_meta_data->>'role')::user_role, 'student'), 
    new.raw_user_meta_data->>'academic_id', 
    new.raw_user_meta_data->>'department', 
    new.raw_user_meta_data->>'batch', 
    new.email
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists to avoid errors on re-run
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Enable Supabase Realtime for Messages and Notices
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime FOR TABLE messages, notices, profiles;

