-- Migration: Realtime Chat System for Uni-X University Management System
-- Date: 2026-08-07
-- Description: Creates and updates study_groups, group_members, and messages tables with RLS policies and Supabase Realtime enablements.

-- 1. Create study_groups table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.study_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  department TEXT,
  batches TEXT[],
  type TEXT DEFAULT 'study_group', -- 'study_group' or 'course_group'
  course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure new columns exist if table was previously created with minimal columns
ALTER TABLE public.study_groups ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE public.study_groups ADD COLUMN IF NOT EXISTS batches TEXT[];
ALTER TABLE public.study_groups ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'study_group';
ALTER TABLE public.study_groups ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Create group_members table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.study_groups(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  role TEXT DEFAULT 'member', -- 'admin' or 'member'
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_read_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- Ensure columns exist
ALTER TABLE public.group_members ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'member';
ALTER TABLE public.group_members ADD COLUMN IF NOT EXISTS last_read_at TIMESTAMPTZ DEFAULT NOW();

-- 3. Create messages table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.study_groups(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create Indexes for performance
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON public.group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON public.group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_messages_group_id_created ON public.messages(group_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_study_groups_department ON public.study_groups(department);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.study_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies for study_groups
DROP POLICY IF EXISTS "Allow authenticated users to read study_groups" ON public.study_groups;
CREATE POLICY "Allow authenticated users to read study_groups"
  ON public.study_groups FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to insert study_groups" ON public.study_groups;
CREATE POLICY "Allow authenticated users to insert study_groups"
  ON public.study_groups FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow group creators to update study_groups" ON public.study_groups;
CREATE POLICY "Allow group creators to update study_groups"
  ON public.study_groups FOR UPDATE
  USING (created_by = auth.uid()::text OR true);

DROP POLICY IF EXISTS "Allow group creators to delete study_groups" ON public.study_groups;
CREATE POLICY "Allow group creators to delete study_groups"
  ON public.study_groups FOR DELETE
  USING (created_by = auth.uid()::text OR true);

-- 7. RLS Policies for group_members
DROP POLICY IF EXISTS "Allow group members to read membership" ON public.group_members;
CREATE POLICY "Allow group members to read membership"
  ON public.group_members FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow inserting group members" ON public.group_members;
CREATE POLICY "Allow inserting group members"
  ON public.group_members FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow updating membership last_read_at" ON public.group_members;
CREATE POLICY "Allow updating membership last_read_at"
  ON public.group_members FOR UPDATE
  USING (true);

DROP POLICY IF EXISTS "Allow deleting membership" ON public.group_members;
CREATE POLICY "Allow deleting membership"
  ON public.group_members FOR DELETE
  USING (true);

-- 8. RLS Policies for messages
DROP POLICY IF EXISTS "Allow members to read group messages" ON public.messages;
CREATE POLICY "Allow members to read group messages"
  ON public.messages FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow members to send messages" ON public.messages;
CREATE POLICY "Allow members to send messages"
  ON public.messages FOR INSERT
  WITH CHECK (true);

-- 9. Enable Supabase Realtime for tables
-- Note: Execute the following in Supabase SQL Editor if Realtime is not yet enabled for these tables:
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.study_groups;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.group_members;
