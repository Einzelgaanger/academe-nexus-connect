
-- Create storage bucket for content files
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES ('content-files', 'Content Files', true, false, 50000000, '{image/png,image/jpeg,image/jpg,application/pdf,application/zip,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document}')
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to content files
INSERT INTO storage.policies (name, definition, bucket_id)
VALUES (
  'Public Read Access',
  '(bucket_id = ''content-files''::text)',
  'content-files'
) ON CONFLICT (name, bucket_id) DO NOTHING;

-- Allow authenticated users to upload files
INSERT INTO storage.policies (name, definition, bucket_id)
VALUES (
  'Authenticated Upload Access',
  '(bucket_id = ''content-files''::text AND auth.role() = ''authenticated'')',
  'content-files'
) ON CONFLICT (name, bucket_id) DO NOTHING;
