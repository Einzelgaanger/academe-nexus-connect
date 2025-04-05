
-- Drop all existing tables first
DROP TABLE IF EXISTS class_instances CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS content CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS likes CASCADE;

-- Drop all sequences
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP SEQUENCE IF EXISTS ' || quote_ident(r.tablename) || '_id_seq CASCADE';
    END LOOP;
END $$;

-- Create the class_instances table
CREATE TABLE class_instances (
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
    super_admin_password VARCHAR(255) NOT NULL DEFAULT '$2b$10$XelREJVN1b/C8jZ8P2yZ6ODXZGEzyA9lX1xOlZGI.7JsUHLGOZ9sK',
    
    -- Admin
    admin_name VARCHAR(200) NOT NULL DEFAULT 'Dr. Wanjiku Kariuki',
    admin_admission VARCHAR(50) NOT NULL DEFAULT '000000',
    admin_password VARCHAR(255) NOT NULL DEFAULT '$2b$10$XelREJVN1b/C8jZ8P2yZ6ODXZGEzyA9lX1xOlZGI.7JsUHLGOZ9sK',
    
    -- Students
    students JSONB NOT NULL,
    
    -- Content
    content JSONB NOT NULL DEFAULT '[]',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure each class is unique
    UNIQUE(country, university, program, course, year, semester, group_name)
);

-- Create users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    admission_number VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(200) NOT NULL,
    email VARCHAR(200),
    phone VARCHAR(20),
    profile_picture VARCHAR(255) DEFAULT 'default-avatar.png',
    class_instance_id INTEGER NOT NULL,
    role VARCHAR(50) NOT NULL,
    points INTEGER DEFAULT 0,
    is_using_default_password BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create content table
CREATE TABLE content (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    content_type VARCHAR(50) NOT NULL,
    file_path VARCHAR(255),
    url VARCHAR(255),
    class_instance_id INTEGER NOT NULL,
    unit_name VARCHAR(200) NOT NULL,
    created_by INTEGER NOT NULL REFERENCES users(id),
    created_by_points INTEGER, -- Points earned by the creator
    deadline TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create comments table
CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    content_id INTEGER NOT NULL REFERENCES content(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create likes table
CREATE TABLE likes (
    id SERIAL PRIMARY KEY,
    content_id INTEGER NOT NULL REFERENCES content(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_like BOOLEAN NOT NULL DEFAULT TRUE, -- true for like, false for dislike
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(content_id, user_id) -- A user can only like/dislike a content once
);

-- Add constraint for content types
ALTER TABLE content
ADD CONSTRAINT content_type_check CHECK (content_type IN ('assignment', 'note', 'pastPaper'));

-- Create indexes
CREATE INDEX idx_class_instances_course ON class_instances(course);
CREATE INDEX idx_class_instances_year ON class_instances(year);
CREATE INDEX idx_class_instances_semester ON class_instances(semester);
CREATE INDEX idx_class_instances_group_name ON class_instances(group_name);
CREATE INDEX idx_users_admission_number ON users(admission_number);
CREATE INDEX idx_users_class_instance_id ON users(class_instance_id);
CREATE INDEX idx_content_class_instance_id ON content(class_instance_id);
CREATE INDEX idx_content_unit_name ON content(unit_name);
CREATE INDEX idx_content_created_by ON content(created_by);
CREATE INDEX idx_comments_content_id ON comments(content_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_likes_content_id ON likes(content_id);
CREATE INDEX idx_likes_user_id ON likes(user_id);

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

-- =============================================
-- STRATHMORE UNIVERSITY - STATISTICS AND DATA SCIENCE - GROUP A
-- =============================================
INSERT INTO class_instances (
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
        {"admission": "190055", "name": "Imani Wairimu", "password": "$2b$10$XelREJVN1b/C8jZ8P2yZ6ODXZGEzyA9lX1xOlZGI.7JsUHLGOZ9sK"},
        {"admission": "190061", "name": "Brenda Mkamburi", "password": "$2b$10$XelREJVN1b/C8jZ8P2yZ6ODXZGEzyA9lX1xOlZGI.7JsUHLGOZ9sK"},
        {"admission": "190070", "name": "Farija Nekesa Nasiaki", "password": "$2b$10$XelREJVN1b/C8jZ8P2yZ6ODXZGEzyA9lX1xOlZGI.7JsUHLGOZ9sK"},
        {"admission": "190141", "name": "Benjamin", "password": "$2b$10$XelREJVN1b/C8jZ8P2yZ6ODXZGEzyA9lX1xOlZGI.7JsUHLGOZ9sK"},
        {"admission": "190232", "name": "Agnes Wairimu", "password": "$2b$10$XelREJVN1b/C8jZ8P2yZ6ODXZGEzyA9lX1xOlZGI.7JsUHLGOZ9sK"},
        {"admission": "190237", "name": "Nathan Gideon", "password": "$2b$10$XelREJVN1b/C8jZ8P2yZ6ODXZGEzyA9lX1xOlZGI.7JsUHLGOZ9sK"},
        {"admission": "190239", "name": "Stacyanne Wangechi", "password": "$2b$10$XelREJVN1b/C8jZ8P2yZ6ODXZGEzyA9lX1xOlZGI.7JsUHLGOZ9sK"},
        {"admission": "190240", "name": "Ella Sakini", "password": "$2b$10$XelREJVN1b/C8jZ8P2yZ6ODXZGEzyA9lX1xOlZGI.7JsUHLGOZ9sK"},
        {"admission": "190331", "name": "Shanice", "password": "$2b$10$XelREJVN1b/C8jZ8P2yZ6ODXZGEzyA9lX1xOlZGI.7JsUHLGOZ9sK"},
        {"admission": "190345", "name": "Osman Gure", "password": "$2b$10$XelREJVN1b/C8jZ8P2yZ6ODXZGEzyA9lX1xOlZGI.7JsUHLGOZ9sK"},
        {"admission": "190359", "name": "Titus Kelyian", "password": "$2b$10$XelREJVN1b/C8jZ8P2yZ6ODXZGEzyA9lX1xOlZGI.7JsUHLGOZ9sK"},
        {"admission": "190361", "name": "Leanne Wangari", "password": "$2b$10$XelREJVN1b/C8jZ8P2yZ6ODXZGEzyA9lX1xOlZGI.7JsUHLGOZ9sK"},
        {"admission": "190363", "name": "Kimberly Muthoni", "password": "$2b$10$XelREJVN1b/C8jZ8P2yZ6ODXZGEzyA9lX1xOlZGI.7JsUHLGOZ9sK"},
        {"admission": "190456", "name": "Elaine Gesare", "password": "$2b$10$XelREJVN1b/C8jZ8P2yZ6ODXZGEzyA9lX1xOlZGI.7JsUHLGOZ9sK"},
        {"admission": "191261", "name": "Elizabeth Wangui", "password": "$2b$10$XelREJVN1b/C8jZ8P2yZ6ODXZGEzyA9lX1xOlZGI.7JsUHLGOZ9sK"},
        {"admission": "191976", "name": "Psalms Kinyele", "password": "$2b$10$XelREJVN1b/C8jZ8P2yZ6ODXZGEzyA9lX1xOlZGI.7JsUHLGOZ9sK"},
        {"admission": "192102", "name": "Hunja", "password": "$2b$10$XelREJVN1b/C8jZ8P2yZ6ODXZGEzyA9lX1xOlZGI.7JsUHLGOZ9sK"},
        {"admission": "170428", "name": "Edna Erick", "password": "$2b$10$XelREJVN1b/C8jZ8P2yZ6ODXZGEzyA9lX1xOlZGI.7JsUHLGOZ9sK"},
        {"admission": "170638", "name": "Shimwa Vunabandi", "password": "$2b$10$XelREJVN1b/C8jZ8P2yZ6ODXZGEzyA9lX1xOlZGI.7JsUHLGOZ9sK"},
        {"admission": "179533", "name": "Melisa Wambui", "password": "$2b$10$XelREJVN1b/C8jZ8P2yZ6ODXZGEzyA9lX1xOlZGI.7JsUHLGOZ9sK"},
        {"admission": "190048", "name": "Kerry Odoya", "password": "$2b$10$XelREJVN1b/C8jZ8P2yZ6ODXZGEzyA9lX1xOlZGI.7JsUHLGOZ9sK"},
        {"admission": "190235", "name": "Jacinta Waitherero", "password": "$2b$10$XelREJVN1b/C8jZ8P2yZ6ODXZGEzyA9lX1xOlZGI.7JsUHLGOZ9sK"},
        {"admission": "193503", "name": "Sophia Komeiyian", "password": "$2b$10$XelREJVN1b/C8jZ8P2yZ6ODXZGEzyA9lX1xOlZGI.7JsUHLGOZ9sK"},
        {"admission": "191896", "name": "Jayden Nathan", "password": "$2b$10$XelREJVN1b/C8jZ8P2yZ6ODXZGEzyA9lX1xOlZGI.7JsUHLGOZ9sK"},
        {"admission": "191977", "name": "Wendpouire Nafissa", "password": "$2b$10$XelREJVN1b/C8jZ8P2yZ6ODXZGEzyA9lX1xOlZGI.7JsUHLGOZ9sK"},
        {"admission": "192080", "name": "Shyaka Shaun", "password": "$2b$10$XelREJVN1b/C8jZ8P2yZ6ODXZGEzyA9lX1xOlZGI.7JsUHLGOZ9sK"},
        {"admission": "192471", "name": "Lewis Muchiri", "password": "$2b$10$XelREJVN1b/C8jZ8P2yZ6ODXZGEzyA9lX1xOlZGI.7JsUHLGOZ9sK"},
        {"admission": "192719", "name": "Sayyeda Zahra Husseinali", "password": "$2b$10$XelREJVN1b/C8jZ8P2yZ6ODXZGEzyA9lX1xOlZGI.7JsUHLGOZ9sK"},
        {"admission": "193097", "name": "Martha", "password": "$2b$10$XelREJVN1b/C8jZ8P2yZ6ODXZGEzyA9lX1xOlZGI.7JsUHLGOZ9sK"}
    ]'
);

-- =============================================
-- STRATHMORE UNIVERSITY - STATISTICS AND DATA SCIENCE - GROUP B
-- =============================================
INSERT INTO class_instances (
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
        {"admission": "189778", "name": "Wenwah Hawala", "password": "$2b$10$XelREJVN1b/C8jZ8P2yZ6ODXZGEzyA9lX1xOlZGI.7JsUHLGOZ9sK"},
        {"admission": "190037", "name": "Angela Nyawira", "password": "$2b$10$XelREJVN1b/C8jZ8P2yZ6ODXZGEzyA9lX1xOlZGI.7JsUHLGOZ9sK"},
        {"admission": "190069", "name": "Janice Muthoki", "password": "$2b$10$XelREJVN1b/C8jZ8P2yZ6ODXZGEzyA9lX1xOlZGI.7JsUHLGOZ9sK"},
        {"admission": "190093", "name": "Paul Ngugi", "password": "$2b$10$XelREJVN1b/C8jZ8P2yZ6ODXZGEzyA9lX1xOlZGI.7JsUHLGOZ9sK"},
        {"admission": "190095", "name": "Floyd Leone Milla", "password": "$2b$10$XelREJVN1b/C8jZ8P2yZ6ODXZGEzyA9lX1xOlZGI.7JsUHLGOZ9sK"},
        {"admission": "190117", "name": "Jury Makori", "password": "$2b$10$XelREJVN1b/C8jZ8P2yZ6ODXZGEzyA9lX1xOlZGI.7JsUHLGOZ9sK"},
        {"admission": "190325", "name": "Samuel Libuko", "password": "$2b$10$XelREJVN1b/C8jZ8P2yZ6ODXZGEzyA9lX1xOlZGI.7JsUHLGOZ9sK"},
        {"admission": "190362", "name": "Cynthia Musangi", "password": "$2b$10$XelREJVN1b/C8jZ8P2yZ6ODXZGEzyA9lX1xOlZGI.7JsUHLGOZ9sK"},
        {"admission": "190457", "name": "Brianna Mwende", "password": "$2b$10$XelREJVN1b/C8jZ8P2yZ6ODXZGEzyA9lX1xOlZGI.7JsUHLGOZ9sK"},
        {"admission": "190862", "name": "Aron", "password": "$2b$10$XelREJVN1b/C8jZ8P2yZ6ODXZGEzyA9lX1xOlZGI.7JsUHLGOZ9sK"},
        {"admission": "191878", "name": "Khadija Mustafa", "password": "$2b$10$XelREJVN1b/C8jZ8P2yZ6ODXZGEzyA9lX1xOlZGI.7JsUHLGOZ9sK"},
        {"admission": "191948", "name": "Justus Erick", "password": "$2b$10$XelREJVN1b/C8jZ8P2yZ6ODXZGEzyA9lX1xOlZGI.7JsUHLGOZ9sK"},
        {"admission": "191956", "name": "Jane Waithira", "password": "$2b$10$XelREJVN1b/C8jZ8P2yZ6ODXZGEzyA9lX1xOlZGI.7JsUHLGOZ9sK"},
        {"admission": "177341", "name": "Sumaya Ismail", "password": "$2b$10$XelREJVN1b/C8jZ8P2yZ6ODXZGEzyA9lX1xOlZGI.7JsUHLGOZ9sK"},
        {"admission": "182121", "name": "Cyril Wafula", "password": "$2b$10$XelREJVN1b/C8jZ8P2yZ6ODXZGEzyA9lX1xOlZGI.7JsUHLGOZ9sK"},
        {"admission": "182608", "name": "Faith Jaher", "password": "$2b$10$XelREJVN1b/C8jZ8P2yZ6ODXZGEzyA9lX1xOlZGI.7JsUHLGOZ9sK"},
        {"admission": "183923", "name": "Alfred Mwaengo", "password": "$2b$10$XelREJVN1b/C8jZ8P2yZ6ODXZGEzyA9lX1xOlZGI.7JsUHLGOZ9sK"},
        {"admission": "188454", "name": "Mukisa Ramogi", "password": "$2b$10$XelREJVN1b/C8jZ8P2yZ6ODXZGEzyA9lX1xOlZGI.7JsUHLGOZ9sK"},
        {"admission": "189040", "name": "Irene Vaati", "password": "$2b$10$XelREJVN1b/C8jZ8P2yZ6ODXZGEzyA9lX1xOlZGI.7JsUHLGOZ9sK"},
        {"admission": "189305", "name": "Brandon Mecker", "password": "$2b$10$XelREJVN1b/C8jZ8P2yZ6ODXZGEzyA9lX1xOlZGI.7JsUHLGOZ9sK"},
        {"admission": "189457", "name": "Mary Mukami", "password": "$2b$10$XelREJVN1b/C8jZ8P2yZ6ODXZGEzyA9lX1xOlZGI.7JsUHLGOZ9sK"},
        {"admission": "190236", "name": "Griffins D. Ambundo", "password": "$2b$10$XelREJVN1b/C8jZ8P2yZ6ODXZGEzyA9lX1xOlZGI.7JsUHLGOZ9sK"},
        {"admission": "190848", "name": "Tristar Gathigia", "password": "$2b$10$XelREJVN1b/C8jZ8P2yZ6ODXZGEzyA9lX1xOlZGI.7JsUHLGOZ9sK"},
        {"admission": "191894", "name": "Patrick", "password": "$2b$10$XelREJVN1b/C8jZ8P2yZ6ODXZGEzyA9lX1xOlZGI.7JsUHLGOZ9sK"},
        {"admission": "192127", "name": "Ruphas Minyalwa", "password": "$2b$10$XelREJVN1b/C8jZ8P2yZ6ODXZGEzyA9lX1xOlZGI.7JsUHLGOZ9sK"},
        {"admission": "192869", "name": "Ian Paul", "password": "$2b$10$XelREJVN1b/C8jZ8P2yZ6ODXZGEzyA9lX1xOlZGI.7JsUHLGOZ9sK"},
        {"admission": "192973", "name": "Ngnintedem Demanou", "password": "$2b$10$XelREJVN1b/C8jZ8P2yZ6ODXZGEzyA9lX1xOlZGI.7JsUHLGOZ9sK"},
        {"admission": "191262", "name": "Natasha Wangare", "password": "$2b$10$XelREJVN1b/C8jZ8P2yZ6ODXZGEzyA9lX1xOlZGI.7JsUHLGOZ9sK"},
        {"admission": "193631", "name": "Joy Watiri", "password": "$2b$10$XelREJVN1b/C8jZ8P2yZ6ODXZGEzyA9lX1xOlZGI.7JsUHLGOZ9sK"}
    ]'
);

-- Insert users for Group A
INSERT INTO users (admission_number, password_hash, full_name, class_instance_id, role)
SELECT 
    student->>'admission' AS admission_number,
    student->>'password' AS password_hash,
    student->>'name' AS full_name,
    (SELECT id FROM class_instances WHERE group_name = 'A') AS class_instance_id,
    'student' AS role
FROM jsonb_array_elements(
    (SELECT students FROM class_instances WHERE group_name = 'A')
) AS student;

-- Insert users for Group B
INSERT INTO users (admission_number, password_hash, full_name, class_instance_id, role)
SELECT 
    student->>'admission' AS admission_number,
    student->>'password' AS password_hash,
    student->>'name' AS full_name,
    (SELECT id FROM class_instances WHERE group_name = 'B') AS class_instance_id,
    'student' AS role
FROM jsonb_array_elements(
    (SELECT students FROM class_instances WHERE group_name = 'B')
) AS student;

-- Insert admin users
INSERT INTO users (admission_number, password_hash, full_name, class_instance_id, role)
VALUES 
-- Super Admin (can access both groups)
('000000', '$2b$10$XelREJVN1b/C8jZ8P2yZ6ODXZGEzyA9lX1xOlZGI.7JsUHLGOZ9sK', 'Super Admin', 
 (SELECT id FROM class_instances WHERE group_name = 'A'), 'super_admin'),

-- Admin for Group A
('000001', '$2b$10$XelREJVN1b/C8jZ8P2yZ6ODXZGEzyA9lX1xOlZGI.7JsUHLGOZ9sK', 'Lecturer Group A', 
 (SELECT id FROM class_instances WHERE group_name = 'A'), 'admin'),

-- Admin for Group B
('000002', '$2b$10$XelREJVN1b/C8jZ8P2yZ6ODXZGEzyA9lX1xOlZGI.7JsUHLGOZ9sK', 'Lecturer Group B', 
 (SELECT id FROM class_instances WHERE group_name = 'B'), 'admin');
