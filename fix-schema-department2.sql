-- We need to drop the foreign key first
ALTER TABLE public.notices DROP CONSTRAINT notices_department_id_fkey;
ALTER TABLE public.notices ALTER COLUMN department_id TYPE TEXT USING department_id::TEXT;
