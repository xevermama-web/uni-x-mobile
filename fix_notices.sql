-- 1. Ensure the notices table has the correct missing columns
ALTER TABLE public.notices ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'text';
ALTER TABLE public.notices ADD COLUMN IF NOT EXISTS department_id TEXT DEFAULT 'ALL';
ALTER TABLE public.notices ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- 2. Drop any old policies that might be conflicting or causing RLS errors
DROP POLICY IF EXISTS "Faculty and Admin can create notices" ON public.notices;
DROP POLICY IF EXISTS "Faculty and Admin can update notices" ON public.notices;
DROP POLICY IF EXISTS "Faculty and Admin can delete notices" ON public.notices;
DROP POLICY IF EXISTS "Faculty, Moderator and Admin can manage notices" ON public.notices;
DROP POLICY IF EXISTS "Admins, moderators and faculty can insert notices" ON public.notices;
DROP POLICY IF EXISTS "Admins, moderators and faculty can update notices" ON public.notices;
DROP POLICY IF EXISTS "Admins, moderators and faculty can delete notices" ON public.notices;

-- 3. Create simple, definitive policies checking user_metadata role
CREATE POLICY "Anyone can view notices" 
ON public.notices FOR SELECT 
USING (true);

CREATE POLICY "Authorized roles can insert notices" 
ON public.notices FOR INSERT 
WITH CHECK (
  (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'moderator', 'faculty')
);

CREATE POLICY "Authorized roles can update notices" 
ON public.notices FOR UPDATE 
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'moderator', 'faculty')
);

CREATE POLICY "Authorized roles can delete notices" 
ON public.notices FOR DELETE 
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'moderator', 'faculty')
);

-- Enable RLS just in case it isn't
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
