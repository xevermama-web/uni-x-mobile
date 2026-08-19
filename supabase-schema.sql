-- ==============================================================================
-- Uni-X Database Schema for Supabase
-- Run this script in the Supabase SQL Editor to set up the tables and policies.
-- ==============================================================================

-- 1. Custom Types
CREATE TYPE user_role AS ENUM ('student', 'faculty', 'admin');

-- 2. Extensions (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- TABLES
-- ==============================================================================

-- PROFILES (Extends auth.users)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    role user_role DEFAULT 'student',
    full_name TEXT NOT NULL,
    email TEXT,
    avatar_url TEXT,
    academic_id TEXT UNIQUE, -- e.g. Student ID or Employee ID
    department_id UUID,
    department TEXT,
    batch TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- DEPARTMENTS
CREATE TABLE public.departments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    head_of_department_id UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add department FK constraint to profiles
ALTER TABLE public.profiles ADD CONSTRAINT fk_department FOREIGN KEY (department_id) REFERENCES public.departments(id);

-- COURSES
CREATE TABLE public.courses (
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
CREATE TABLE public.enrollments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    semester TEXT NOT NULL,
    grade NUMERIC(4,2), -- e.g., 3.8
    enrolled_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, course_id, semester)
);

-- ATTENDANCE
CREATE TABLE public.attendance (
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
CREATE TABLE public.assignments (
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
CREATE TABLE public.submissions (
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
CREATE TABLE public.notices (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    author_id UUID REFERENCES public.profiles(id),
    target_role user_role, -- NULL means all roles
    department_id UUID REFERENCES public.departments(id), -- NULL means global
    is_pinned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- STUDY GROUPS
CREATE TABLE public.study_groups (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    course_id UUID REFERENCES public.courses(id),
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- STUDY GROUP MEMBERS
CREATE TABLE public.group_members (
    group_id UUID REFERENCES public.study_groups(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (group_id, user_id)
);

-- MESSAGES (Real-time Chat)
CREATE TABLE public.messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    group_id UUID REFERENCES public.study_groups(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- COURSE MATERIALS
CREATE TABLE public.materials (
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

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;

-- Profiles: Anyone can read profiles, but users can only update their own.
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Notices: Everyone can read notices
CREATE POLICY "Notices are viewable by everyone" ON public.notices FOR SELECT USING (true);
-- Only Admins and Faculty can create notices
CREATE POLICY "Faculty and Admin can create notices" ON public.notices FOR INSERT 
WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'faculty'))
);

-- Enrollments: Students see their own, Faculty see their course enrollments
CREATE POLICY "Students can see their enrollments" ON public.enrollments FOR SELECT 
USING (auth.uid() = student_id OR EXISTS (
    SELECT 1 FROM public.courses c WHERE c.id = course_id AND c.instructor_id = auth.uid()
));

-- ==============================================================================
-- TRIGGERS
-- ==============================================================================

-- Automatically create a profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, academic_id, department, batch, email)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', COALESCE((new.raw_user_meta_data->>'role')::user_role, 'student'), new.raw_user_meta_data->>'academic_id', new.raw_user_meta_data->>'department', new.raw_user_meta_data->>'batch', new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Enable Supabase Realtime for Messages and Notices
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE notices;
-- 1. Create Faculties Table
CREATE TABLE IF NOT EXISTS public.faculties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  password text NOT NULL,
  department text,
  role text DEFAULT 'Faculty',
  status text DEFAULT 'Active',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- 2. Create Moderators Table
CREATE TABLE IF NOT EXISTS public.moderators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  password text NOT NULL,
  role text DEFAULT 'Moderator',
  status text DEFAULT 'Active',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- 3. Enable RLS
ALTER TABLE public.faculties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderators ENABLE ROW LEVEL SECURITY;

-- 4. Policies for Faculties
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Allow public all operations on faculties" ON public.faculties;
    DROP POLICY IF EXISTS "Allow public read access" ON public.faculties;
    DROP POLICY IF EXISTS "Allow public insert access" ON public.faculties;
    DROP POLICY IF EXISTS "Allow public update access" ON public.faculties;
    DROP POLICY IF EXISTS "Allow public delete access" ON public.faculties;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE POLICY "Allow public all operations on faculties" 
ON public.faculties FOR ALL USING (true) WITH CHECK (true);

-- 5. Policies for Moderators
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Allow public all operations on moderators" ON public.moderators;
    DROP POLICY IF EXISTS "Allow public read access" ON public.moderators;
    DROP POLICY IF EXISTS "Allow public insert access" ON public.moderators;
    DROP POLICY IF EXISTS "Allow public update access" ON public.moderators;
    DROP POLICY IF EXISTS "Allow public delete access" ON public.moderators;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE POLICY "Allow public all operations on moderators" 
ON public.moderators FOR ALL USING (true) WITH CHECK (true);

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
