
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
  created_at: string;
  updated_at: string;
}

export interface Student {
  admission: string;
  name: string;
  password?: string;
}

export interface User {
  id: number;
  admission_number: string;
  full_name: string;
  email?: string;
  phone?: string;
  profile_picture?: string;
  class_instance_id: number;
  role: 'student' | 'admin' | 'super_admin';
  points: number;
  is_using_default_password: boolean;
  created_at: string;
  updated_at: string;
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
  user?: User;
  comments_count?: number;
  likes_count?: number;
  dislikes_count?: number;
  liked_by_user?: boolean;
  disliked_by_user?: boolean;
}

export interface Comment {
  id: number;
  content_id: number;
  user_id: number;
  text: string;
  created_at: string;
  user?: User;
}

export interface Like {
  id: number;
  content_id: number;
  user_id: number;
  is_like: boolean;
  created_at: string;
}

export interface Announcement {
  id: number;
  class_instance_id: number;
  message: string;
  image_path?: string;
  video_path?: string;
  created_by: number;
  created_at: string;
  updated_at: string;
  user?: User;
}

export interface AuthContextType {
  user: User | null;
  classInstance: ClassInstance | null;
  loading: boolean;
  login: (admissionNumber: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  updateUserPoints: (points: number) => void;
}
