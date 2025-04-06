
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      announcements: {
        Row: {
          id: number
          class_instance_id: number
          message: string
          image_path: string | null
          video_path: string | null
          created_by: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          class_instance_id: number
          message: string
          image_path?: string | null
          video_path?: string | null
          created_by: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          class_instance_id?: number
          message?: string
          image_path?: string | null
          video_path?: string | null
          created_by?: number
          created_at?: string
          updated_at?: string
        }
      }
      class_instances: {
        Row: {
          id: number
          country: string
          university: string
          program: string
          course: string
          year: number
          semester: string
          group_name: string
          units: string[]
          super_admin_name: string
          super_admin_admission: string
          admin_name: string
          admin_admission: string
          students: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          country?: string
          university?: string
          program?: string
          course: string
          year: number
          semester: string
          group_name: string
          units: string[]
          super_admin_name?: string
          super_admin_admission?: string
          admin_name?: string
          admin_admission?: string
          students: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          country?: string
          university?: string
          program?: string
          course?: string
          year?: number
          semester?: string
          group_name?: string
          units?: string[]
          super_admin_name?: string
          super_admin_admission?: string
          admin_name?: string
          admin_admission?: string
          students?: Json
          created_at?: string
          updated_at?: string
        }
      }
      comments: {
        Row: {
          id: number
          content_id: number
          user_id: number
          text: string
          created_at: string
        }
        Insert: {
          id?: number
          content_id: number
          user_id: number
          text: string
          created_at?: string
        }
        Update: {
          id?: number
          content_id?: number
          user_id?: number
          text?: string
          created_at?: string
        }
      }
      content: {
        Row: {
          id: number
          title: string
          description: string
          content_type: string
          file_path: string | null
          url: string | null
          class_instance_id: number
          unit_name: string
          created_by: number
          created_by_points: number | null
          deadline: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          title: string
          description: string
          content_type: string
          file_path?: string | null
          url?: string | null
          class_instance_id: number
          unit_name: string
          created_by: number
          created_by_points?: number | null
          deadline?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          title?: string
          description?: string
          content_type?: string
          file_path?: string | null
          url?: string | null
          class_instance_id?: number
          unit_name?: string
          created_by?: number
          created_by_points?: number | null
          deadline?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      likes: {
        Row: {
          id: number
          content_id: number
          user_id: number
          is_like: boolean
          created_at: string
        }
        Insert: {
          id?: number
          content_id: number
          user_id: number
          is_like?: boolean
          created_at?: string
        }
        Update: {
          id?: number
          content_id?: number
          user_id?: number
          is_like?: boolean
          created_at?: string
        }
      }
      users: {
        Row: {
          id: number
          admission_number: string
          password_hash: string
          full_name: string
          email: string | null
          phone: string | null
          profile_picture: string | null
          class_instance_id: number
          role: string
          points: number | null
          is_using_default_password: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          admission_number: string
          password_hash: string
          full_name: string
          email?: string | null
          phone?: string | null
          profile_picture?: string | null
          class_instance_id: number
          role: string
          points?: number | null
          is_using_default_password?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          admission_number?: string
          password_hash?: string
          full_name?: string
          email?: string | null
          phone?: string | null
          profile_picture?: string | null
          class_instance_id?: number
          role?: string
          points?: number | null
          is_using_default_password?: boolean | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
  storage: {
    Buckets: {
      [_ in "content-files" | "profile-pictures" | "announcement-media"]: {
        Row: {
          id: string
          name: string
          owner: string | null
          created_at: string | null
          updated_at: string | null
          public: boolean | null
          avif_autodetection: boolean | null
          file_size_limit: number | null
          allowed_mime_types: string[] | null
        }
        Insert: {
          id: string
          name: string
          owner?: string | null
          created_at?: string | null
          updated_at?: string | null
          public?: boolean | null
          avif_autodetection?: boolean | null
          file_size_limit?: number | null
          allowed_mime_types?: string[] | null
        }
        Update: {
          id?: string
          name?: string
          owner?: string | null
          created_at?: string | null
          updated_at?: string | null
          public?: boolean | null
          avif_autodetection?: boolean | null
          file_size_limit?: number | null
          allowed_mime_types?: string[] | null
        }
      }
    }
    Objects: {
      [_ in "content-files" | "profile-pictures" | "announcement-media"]: {
        Row: {
          id: string
          name: string
          bucket_id: string
          owner: string | null
          created_at: string | null
          updated_at: string | null
          last_accessed_at: string | null
          metadata: Json | null
        }
        Insert: {
          id?: string
          name: string
          bucket_id: string
          owner?: string | null
          created_at?: string | null
          updated_at?: string | null
          last_accessed_at?: string | null
          metadata?: Json | null
        }
        Update: {
          id?: string
          name?: string
          bucket_id?: string
          owner?: string | null
          created_at?: string | null
          updated_at?: string | null
          last_accessed_at?: string | null
          metadata?: Json | null
        }
      }
    }
  }
}
