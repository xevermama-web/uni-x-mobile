-- Create course_materials table
CREATE TABLE IF NOT EXISTS public.course_materials (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    title text NOT NULL,
    description text,
    department text NOT NULL,
    semester text DEFAULT 'Spring 2026',
    course text NOT NULL,
    file_path text NOT NULL,
    file_type text,
    file_size bigint,
    uploaded_by text,
    group_id text,
    file_data text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.course_materials ENABLE ROW LEVEL SECURITY;

-- Allow all operations for simplicity in this project (authorization is handled in the app logic)
CREATE POLICY "Enable read access for all users" ON public.course_materials FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON public.course_materials FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON public.course_materials FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON public.course_materials FOR DELETE USING (true);

-- Storage bucket creation (if not already existing)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('materials', 'materials', true) ON CONFLICT DO NOTHING;

-- Storage policies for the 'materials' bucket
-- CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING ( bucket_id = 'materials' );
-- CREATE POLICY "Allow Uploads" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'materials' );
-- CREATE POLICY "Allow Deletes" ON storage.objects FOR DELETE USING ( bucket_id = 'materials' );
