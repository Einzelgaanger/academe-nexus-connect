
export interface User {
  id: number;
  admission_number: string;
  password_hash: string;
  full_name: string;
  email?: string;
  phone?: string;
  profile_picture: string;
  class_instance_id: number;
  role: 'student' | 'admin' | 'super_admin';
  points: number;
  is_using_default_password: boolean;
  created_at: string;
  updated_at: string;
}

export interface ClassInstance {
  id: number;
  country: string;
  university: string;
  program: string;
  course: string;
  year: number;
  semester: string;
  group_name: string;
  units: string[];
  super_admin_name: string;
  super_admin_admission: string;
  admin_name: string;
  admin_admission: string;
  students: Student[];
  content: Content[];
  created_at: string;
  updated_at: string;
}

export interface Student {
  admission: string;
  name: string;
  password: string;
}

export interface Content {
  id: number;
  title: string;
  description: string;
  content_type: 'assignment' | 'note' | 'pastPaper';
  file_path?: string;
  url?: string;
  class_instance_id: number;
  unit_name: string;
  created_by: number;
  created_by_points?: number;
  deadline?: string;
  created_at: string;
  updated_at: string;
  comments?: Comment[];
  likes?: Like[];
  comments_count?: number;
  creator_name?: string;
}

export interface Comment {
  id: number;
  content_id: number;
  user_id: number;
  text: string;
  created_at: string;
  user_name?: string;
}

export interface Like {
  id: number;
  content_id: number;
  user_id: number;
  is_like: boolean; // true for like, false for dislike
  created_at: string;
}

export interface AcademicSelection {
  program: string;
  course: string;
  year: number;
  semester: string;
  group: string;
}

export interface NavItem {
  title: string;
  href: string;
  icon?: React.ReactNode;
}

export interface RankInfo {
  title: string;
  minPoints: number;
  icon: string;
  color: string;
}
