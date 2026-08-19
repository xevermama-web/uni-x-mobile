ALTER TABLE public.notices ALTER COLUMN department_id TYPE TEXT USING department_id::TEXT;
ALTER TABLE public.notices RENAME COLUMN department_id TO department;
