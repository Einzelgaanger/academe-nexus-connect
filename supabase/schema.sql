
-- Create storage schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS storage;

-- Create required tables for storage if they don't exist
CREATE TABLE IF NOT EXISTS storage.buckets (
  id text PRIMARY KEY,
  name text NOT NULL,
  owner uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  public boolean DEFAULT false,
  avif_autodetection boolean DEFAULT false,
  file_size_limit integer,
  allowed_mime_types text[]
);

CREATE TABLE IF NOT EXISTS storage.objects (
  id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  bucket_id text,
  name text,
  owner uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_accessed_at timestamptz DEFAULT now(),
  metadata jsonb,
  path_tokens text[] GENERATED ALWAYS AS (string_to_array(name, '/')) STORED,
  FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id)
);

-- Create storage policies table if it doesn't exist
CREATE TABLE IF NOT EXISTS storage.policies (
  id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  name text NOT NULL,
  bucket_id text,
  definition jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id)
);

-- Drop sequences if they exist to avoid conflicts
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP SEQUENCE IF EXISTS ' || quote_ident(r.tablename) || '_id_seq CASCADE';
    END LOOP;
END $$;

-- Create the class_instances table
CREATE TABLE IF NOT EXISTS public.class_instances (
    id SERIAL PRIMARY KEY,
    -- Class identification
    country VARCHAR(100) NOT NULL DEFAULT 'Kenya',
    university VARCHAR(200) NOT NULL DEFAULT 'Strathmore University',
    program VARCHAR(200) NOT NULL DEFAULT 'Bachelor of Science',
    course VARCHAR(200) NOT NULL,
    year INTEGER NOT NULL,
    semester VARCHAR(50) NOT NULL,
    group_name VARCHAR(50) NOT NULL,
    
    -- Units
    units TEXT[] NOT NULL,
    
    -- Super Admin
    super_admin_name VARCHAR(200) NOT NULL DEFAULT 'Prof. Adebayo Ojo',
    super_admin_admission VARCHAR(50) NOT NULL DEFAULT '000000',
    
    -- Admin
    admin_name VARCHAR(200) NOT NULL DEFAULT 'Dr. Wanjiku Kariuki',
    admin_admission VARCHAR(50) NOT NULL DEFAULT '000001',
    
    -- Students
    students JSONB NOT NULL,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure each class is unique
    UNIQUE(country, university, program, course, year, semester, group_name)
);

-- Create the announcements table for super admin messages
CREATE TABLE IF NOT EXISTS public.announcements (
    id SERIAL PRIMARY KEY,
    class_instance_id INTEGER NOT NULL REFERENCES public.class_instances(id),
    message TEXT NOT NULL,
    image_path TEXT,
    video_path TEXT,
    created_by INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
    id SERIAL PRIMARY KEY,
    admission_number VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(200) NOT NULL,
    email VARCHAR(200),
    phone VARCHAR(20),
    profile_picture VARCHAR(255) DEFAULT 'default-avatar.png',
    class_instance_id INTEGER NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('student', 'admin', 'super_admin')),
    points INTEGER DEFAULT 0,
    is_using_default_password BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (class_instance_id) REFERENCES public.class_instances(id)
);

-- Create content table
CREATE TABLE IF NOT EXISTS public.content (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    content_type VARCHAR(50) NOT NULL,
    file_path VARCHAR(255),
    url VARCHAR(255),
    class_instance_id INTEGER NOT NULL,
    unit_name VARCHAR(200) NOT NULL,
    created_by INTEGER NOT NULL,
    created_by_points INTEGER DEFAULT 0,
    deadline TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (class_instance_id) REFERENCES public.class_instances(id),
    FOREIGN KEY (created_by) REFERENCES public.users(id)
);

-- Create comments table
CREATE TABLE IF NOT EXISTS public.comments (
    id SERIAL PRIMARY KEY,
    content_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (content_id) REFERENCES public.content(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES public.users(id)
);

-- Create likes table
CREATE TABLE IF NOT EXISTS public.likes (
    id SERIAL PRIMARY KEY,
    content_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    is_like BOOLEAN NOT NULL DEFAULT TRUE, -- true for like, false for dislike
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(content_id, user_id), -- A user can only like/dislike a content once
    FOREIGN KEY (content_id) REFERENCES public.content(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES public.users(id)
);

-- Add constraint for content types
ALTER TABLE public.content
ADD CONSTRAINT content_type_check CHECK (content_type IN ('assignment', 'note', 'pastPaper'));

-- Create storage bucket for content files
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES ('content-files', 'Content Files', true, false, 50000000, '{image/png,image/jpeg,image/jpg,application/pdf,application/zip,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document}')
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for profile pictures
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES ('profile-pictures', 'Profile Pictures', true, false, 5000000, '{image/png,image/jpeg,image/jpg}')
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for announcement media
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES ('announcement-media', 'Announcement Media', true, false, 50000000, '{image/png,image/jpeg,image/jpg,video/mp4,video/quicktime,video/webm}')
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for content-files bucket
CREATE POLICY "Public Read Access for content-files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'content-files');

CREATE POLICY "Authenticated Upload Access for content-files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'content-files');

-- Create storage policies for profile-pictures bucket
CREATE POLICY "Public Read Access for profile-pictures"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'profile-pictures');

CREATE POLICY "Authenticated Upload Access for profile-pictures"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'profile-pictures');

-- Create storage policies for announcement-media bucket
CREATE POLICY "Public Read Access for announcement-media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'announcement-media');

CREATE POLICY "Authenticated Upload Access for announcement-media"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'announcement-media');

-- Create indexes
CREATE INDEX idx_class_instances_course ON public.class_instances(course);
CREATE INDEX idx_class_instances_year ON public.class_instances(year);
CREATE INDEX idx_class_instances_semester ON public.class_instances(semester);
CREATE INDEX idx_class_instances_group_name ON public.class_instances(group_name);
CREATE INDEX idx_users_admission_number ON public.users(admission_number);
CREATE INDEX idx_users_class_instance_id ON public.users(class_instance_id);
CREATE INDEX idx_content_class_instance_id ON public.content(class_instance_id);
CREATE INDEX idx_content_unit_name ON public.content(unit_name);
CREATE INDEX idx_content_created_by ON public.content(created_by);
CREATE INDEX idx_comments_content_id ON public.comments(content_id);
CREATE INDEX idx_comments_user_id ON public.comments(user_id);
CREATE INDEX idx_likes_content_id ON public.likes(content_id);
CREATE INDEX idx_likes_user_id ON public.likes(user_id);
CREATE INDEX idx_announcements_class_instance_id ON public.announcements(class_instance_id);

-- Insert data for Group A
INSERT INTO public.class_instances (
    course, year, semester, group_name,
    units,
    students
) VALUES (
    'Statistics and Data Science',
    2,
    '1',
    'A',
    ARRAY[
        'Integral Calculus',
        'Real Analysis',
        'Probability Theory',
        'Algorithms and Data Structures',
        'Information Security, Governance and the Cloud',
        'Principles of Ethics'
    ],
    '[
        {"admission": "167020", "name": "Priscillah Gathoni", "password": "$2b$10$XelREJVN1b/C8jZ8P2yZ6ODXZGEzyA9lX1xOlZGI.7JsUHLGOZ9sK"},
        {"admission": "170757", "name": "Ethan Joseph", "password": "$2b$10$XelREJVN1b/C8jZ8P2yZ6ODXZGEzyA9lX1xOlZGI.7JsUHLGOZ9sK"},
        {"admission": "171423", "name": "Neeza Musemakweli", "password": "$2b$10$XelREJVN1b/C8jZ8P2yZ6ODXZGEzyA9lX1xOlZGI.7JsUHLGOZ9sK"},
        {"admission": "171820", "name": "Ainembabazi Ruth", "password": "$2b$10$XelREJVN1b/C8jZ8P2yZ6ODXZGEzyA9lX1xOlZGI.7JsUHLGOZ9sK"},
        {"admission": "172064", "name": "Natasha Nyanginda", "password": "$2b$10$XelREJVN1b/C8jZ8P2yZ6ODXZGEzyA9lX1xOlZGI.7JsUHLGOZ9sK"},
        {"admission": "172089", "name": "Nelly Mwende", "password": "$2b$10$XelREJVN1b/C8jZ8P2yZ6ODXZGEzyA9lX1xOlZGI.7JsUHLGOZ9sK"},
        {"admission": "173461", "name": "Joyrose Njahira", "password": "$2b$10$XelREJVN1b/C8jZ8P2yZ6ODXZGEzyA9lX1xOlZGI.7JsUHLGOZ9sK"},
        {"admission": "176587", "name": "Caredge Osir", "password": "$2b$10$XelREJVN1b/C8jZ8P2yZ6ODXZGEzyA9lX1xOlZGI.7JsUHLGOZ9sK"},
        {"admission": "179181", "name": "Shedrin Wambui", "password": "$2b$10$XelREJVN1b/C8jZ8P2yZ6ODXZGEzyA9lX1xOlZGI.7JsUHLGOZ9sK"},
        {"admission": "181140", "name": "Whitney Waithera", "password": "$2b$10$XelREJVN1b/C8jZ8P2yZ6ODXZGEzyA9lX1xOlZGI.7JsUHLGOZ9sK"},
        {"admission": "184288", "name": "Calvin Odete", "password": "$2b$10$XelREJVN1b/C8jZ8P2yZ6ODXZGEzyA9lX1xOlZGI.7JsUHLGOZ9sK"},
        {"admission": "187692", "name": "Ruth Jerop", "password": "$2b$10$XelREJVN1b/C8jZ8P2yZ6ODXZGEzyA9lX1xOlZGI.7JsUHLGOZ9sK"},
        {"admission": "189522", "name": "Collins", "password": "$2b$10$XelREJVN1b/C8jZ8P2yZ6ODXZGEzyA9lX1xOlZGI.7JsUHLGOZ9sK"},
        {"admission": "189613", "name": "Chelsie Nyangau", "password": "$2b$10$XelREJVN1b/C8jZ8P2yZ6ODXZGEzyA9lX1xOlZGI.7JsUHLGOZ9sK"},
        {"admission": "189825", "name": "Samuel Chuchu", "password": "$2b$10$XelREJVN1b/C8jZ8P2yZ6ODXZGEzyA9lX1xOlZGI.7JsUHLGOZ9sK"},
        {"admission": "190038", "name": "Darryl Kariuki", "password": "$2b$10$XelREJVN1b/C8jZ8P2yZ6ODXZGEzyA9lX1xOlZGI.7JsUHLGOZ9sK"},
        {"admission": "190039", "name": "Nathan Shisia Kipkoske", "password": "$2b$10$XelREJVN1b/C8jZ8P2yZ6ODXZGEzyA9lX1xOlZGI.7JsUHLGOZ9sK"},
        {"admission": "190046", "name": "Tyrone Seremani", "password": "$2b$10$XelREJVN1b/C8jZ8P2yZ6ODXZGEzyA9lX1xOlZGI.7JsUHLGOZ9sK"},
        {"admission": "190054", "name": "Gloria Mwihaki", "password": "$2b$10$XelREJVN1b/C8jZ8P2yZ6ODXZGEzyA9lX1xOlZGI.7JsUHLGOZ9sK"},
        {"admission": "190055", "name": "Imani Wairimu", "password": "$2b$10$XelREJVN1b/C8jZ8P2yZ6ODXZGEzyA9lX1xOlZGI.7JsUHLGOZ9sK"}
    ]'
) ON CONFLICT DO NOTHING;

-- Insert data for Group B
INSERT INTO public.class_instances (
    course, year, semester, group_name,
    units,
    students
) VALUES (
    'Statistics and Data Science',
    2,
    '1',
    'B',
    ARRAY[
        'Integral Calculus',
        'Real Analysis',
        'Probability Theory',
        'Algorithms and Data Structures',
        'Information Security, Governance and the Cloud',
        'Principles of Ethics'
    ],
    '[
        {"admission": "163336", "name": "Samsam Abdul Nassir", "password": "$2b$10$XelREJVN1b/C8jZ8P2yZ6ODXZGEzyA9lX1xOlZGI.7JsUHLGOZ9sK"},
        {"admission": "170743", "name": "Alvin Lemayian", "password": "$2b$10$XelREJVN1b/C8jZ8P2yZ6ODXZGEzyA9lX1xOlZGI.7JsUHLGOZ9sK"},
        {"admission": "171723", "name": "Angel", "password": "$2b$10$XelREJVN1b/C8jZ8P2yZ6ODXZGEzyA9lX1xOlZGI.7JsUHLGOZ9sK"},
        {"admission": "176584", "name": "Esther Rabera", "password": "$2b$10$XelREJVN1b/C8jZ8P2yZ6ODXZGEzyA9lX1xOlZGI.7JsUHLGOZ9sK"},
        {"admission": "176834", "name": "Lina Moraa", "password": "$2b$10$XelREJVN1b/C8jZ8P2yZ6ODXZGEzyA9lX1xOlZGI.7JsUHLGOZ9sK"},
        {"admission": "178916", "name": "Elvis Macharia", "password": "$2b$10$XelREJVN1b/C8jZ8P2yZ6ODXZGEzyA9lX1xOlZGI.7JsUHLGOZ9sK"},
        {"admission": "179087", "name": "Andres Ngotho", "password": "$2b$10$XelREJVN1b/C8jZ8P2yZ6ODXZGEzyA9lX1xOlZGI.7JsUHLGOZ9sK"},
        {"admission": "179514", "name": "Wendy Wanjiru", "password": "$2b$10$XelREJVN1b/C8jZ8P2yZ6ODXZGEzyA9lX1xOlZGI.7JsUHLGOZ9sK"},
        {"admission": "180657", "name": "Kiptoo", "password": "$2b$10$XelREJVN1b/C8jZ8P2yZ6ODXZGEzyA9lX1xOlZGI.7JsUHLGOZ9sK"},
        {"admission": "180963", "name": "Alfred Mulinge", "password": "$2b$10$XelREJVN1b/C8jZ8P2yZ6ODXZGEzyA9lX1xOlZGI.7JsUHLGOZ9sK"},
        {"admission": "181038", "name": "Sylvia Waithira", "password": "$2b$10$XelREJVN1b/C8jZ8P2yZ6ODXZGEzyA9lX1xOlZGI.7JsUHLGOZ9sK"},
        {"admission": "184087", "name": "Victoria Mutheu", "password": "$2b$10$XelREJVN1b/C8jZ8P2yZ6ODXZGEzyA9lX1xOlZGI.7JsUHLGOZ9sK"},
        {"admission": "186768", "name": "Effie Nelima", "password": "$2b$10$XelREJVN1b/C8jZ8P2yZ6ODXZGEzyA9lX1xOlZGI.7JsUHLGOZ9sK"},
        {"admission": "187500", "name": "Edwin Karanu", "password": "$2b$10$XelREJVN1b/C8jZ8P2yZ6ODXZGEzyA9lX1xOlZGI.7JsUHLGOZ9sK"},
        {"admission": "188145", "name": "Kristina Nasieku", "password": "$2b$10$XelREJVN1b/C8jZ8P2yZ6ODXZGEzyA9lX1xOlZGI.7JsUHLGOZ9sK"},
        {"admission": "189104", "name": "Francis Mburu", "password": "$2b$10$XelREJVN1b/C8jZ8P2yZ6ODXZGEzyA9lX1xOlZGI.7JsUHLGOZ9sK"},
        {"admission": "189228", "name": "Griffin Che", "password": "$2b$10$XelREJVN1b/C8jZ8P2yZ6ODXZGEzyA9lX1xOlZGI.7JsUHLGOZ9sK"},
        {"admission": "189229", "name": "Justin Gitari", "password": "$2b$10$XelREJVN1b/C8jZ8P2yZ6ODXZGEzyA9lX1xOlZGI.7JsUHLGOZ9sK"},
        {"admission": "189612", "name": "Ian Muchai", "password": "$2b$10$XelREJVN1b/C8jZ8P2yZ6ODXZGEzyA9lX1xOlZGI.7JsUHLGOZ9sK"},
        {"admission": "189778", "name": "Wenwah Hawala", "password": "$2b$10$XelREJVN1b/C8jZ8P2yZ6ODXZGEzyA9lX1xOlZGI.7JsUHLGOZ9sK"}
    ]'
) ON CONFLICT DO NOTHING;

-- Insert users for Group A
INSERT INTO users (admission_number, password_hash, full_name, class_instance_id, role)
SELECT 
    student->>'admission' AS admission_number,
    student->>'password' AS password_hash,
    student->>'name' AS full_name,
    (SELECT id FROM class_instances WHERE group_name = 'A' AND course = 'Statistics and Data Science' LIMIT 1) AS class_instance_id,
    'student' AS role
FROM jsonb_array_elements(
    (SELECT students FROM class_instances WHERE group_name = 'A' AND course = 'Statistics and Data Science' LIMIT 1)
) AS student
ON CONFLICT (admission_number) DO NOTHING;

-- Insert users for Group B
INSERT INTO users (admission_number, password_hash, full_name, class_instance_id, role)
SELECT 
    student->>'admission' AS admission_number,
    student->>'password' AS password_hash,
    student->>'name' AS full_name,
    (SELECT id FROM class_instances WHERE group_name = 'B' AND course = 'Statistics and Data Science' LIMIT 1) AS class_instance_id,
    'student' AS role
FROM jsonb_array_elements(
    (SELECT students FROM class_instances WHERE group_name = 'B' AND course = 'Statistics and Data Science' LIMIT 1)
) AS student
ON CONFLICT (admission_number) DO NOTHING;

-- Insert admin users
INSERT INTO users (admission_number, password_hash, full_name, class_instance_id, role)
VALUES 
-- Super Admin for Group A
('000000', '$2b$10$XelREJVN1b/C8jZ8P2yZ6ODXZGEzyA9lX1xOlZGI.7JsUHLGOZ9sK', 'Super Admin A', 
 (SELECT id FROM class_instances WHERE group_name = 'A' AND course = 'Statistics and Data Science' LIMIT 1), 'super_admin'),

-- Admin for Group A
('000001', '$2b$10$XelREJVN1b/C8jZ8P2yZ6ODXZGEzyA9lX1xOlZGI.7JsUHLGOZ9sK', 'Admin A', 
 (SELECT id FROM class_instances WHERE group_name = 'A' AND course = 'Statistics and Data Science' LIMIT 1), 'admin')
ON CONFLICT (admission_number) DO NOTHING;

-- Initial announcements
INSERT INTO public.announcements (class_instance_id, message, created_by)
SELECT 
    id AS class_instance_id,
    'Welcome to the Stratizens platform! This is where you will access all your course materials and engage with your classmates.' AS message,
    (SELECT id FROM users WHERE role = 'super_admin' AND class_instance_id = class_instances.id LIMIT 1) AS created_by
FROM class_instances
WHERE NOT EXISTS (SELECT 1 FROM announcements WHERE announcements.class_instance_id = class_instances.id);

-- Enable Row Level Security on all tables
ALTER TABLE public.class_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Grant permissions to authenticated users
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Grant storage permissions
GRANT ALL ON ALL TABLES IN SCHEMA storage TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA storage TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA storage TO anon, authenticated;
