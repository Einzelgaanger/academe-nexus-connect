
-- Create storage bucket for content files
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES ('content-files', 'Content Files', true, false, 50000000, '{image/png,image/jpeg,image/jpg,application/pdf,application/zip,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document}')
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to content files
CREATE POLICY "Public Read Access" ON storage.objects
FOR SELECT 
USING (bucket_id = 'content-files');

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated Upload Access" ON storage.objects
FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'content-files');

-- Allow authenticated users to update their own files
CREATE POLICY "Authenticated Update Access" ON storage.objects
FOR UPDATE 
TO authenticated
USING (bucket_id = 'content-files');

-- Allow authenticated users to delete their own files
CREATE POLICY "Authenticated Delete Access" ON storage.objects
FOR DELETE 
TO authenticated
USING (bucket_id = 'content-files');
