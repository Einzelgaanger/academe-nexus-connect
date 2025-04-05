export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      class_instances: {
        Row: {
          admin_admission: string
          admin_name: string
          admin_password: string
          content: Json
          country: string
          course: string
          created_at: string | null
          group_name: string
          id: number
          program: string
          semester: string
          students: Json
          super_admin_admission: string
          super_admin_name: string
          super_admin_password: string
          units: string[]
          university: string
          updated_at: string | null
          year: number
        }
        Insert: {
          admin_admission?: string
          admin_name?: string
          admin_password?: string
          content?: Json
          country?: string
          course: string
          created_at?: string | null
          group_name: string
          id?: number
          program?: string
          semester: string
          students: Json
          super_admin_admission?: string
          super_admin_name?: string
          super_admin_password?: string
          units: string[]
          university?: string
          updated_at?: string | null
          year: number
        }
        Update: {
          admin_admission?: string
          admin_name?: string
          admin_password?: string
          content?: Json
          country?: string
          course?: string
          created_at?: string | null
          group_name?: string
          id?: number
          program?: string
          semester?: string
          students?: Json
          super_admin_admission?: string
          super_admin_name?: string
          super_admin_password?: string
          units?: string[]
          university?: string
          updated_at?: string | null
          year?: number
        }
        Relationships: []
      }
      content: {
        Row: {
          class_instance_id: number
          content_type: string
          created_at: string | null
          created_by: number
          deadline: string | null
          description: string | null
          file_path: string | null
          id: number
          title: string
          unit_name: string
          updated_at: string | null
          url: string | null
        }
        Insert: {
          class_instance_id: number
          content_type: string
          created_at?: string | null
          created_by: number
          deadline?: string | null
          description?: string | null
          file_path?: string | null
          id?: number
          title: string
          unit_name: string
          updated_at?: string | null
          url?: string | null
        }
        Update: {
          class_instance_id?: number
          content_type?: string
          created_at?: string | null
          created_by?: number
          deadline?: string | null
          description?: string | null
          file_path?: string | null
          id?: number
          title?: string
          unit_name?: string
          updated_at?: string | null
          url?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          admission_number: string
          class_instance_id: number
          created_at: string | null
          email: string | null
          full_name: string
          id: number
          is_using_default_password: boolean | null
          password_hash: string
          phone: string | null
          points: number | null
          profile_picture: string | null
          role: string
          updated_at: string | null
        }
        Insert: {
          admission_number: string
          class_instance_id: number
          created_at?: string | null
          email?: string | null
          full_name: string
          id?: number
          is_using_default_password?: boolean | null
          password_hash: string
          phone?: string | null
          points?: number | null
          profile_picture?: string | null
          role: string
          updated_at?: string | null
        }
        Update: {
          admission_number?: string
          class_instance_id?: number
          created_at?: string | null
          email?: string | null
          full_name?: string
          id?: number
          is_using_default_password?: boolean | null
          password_hash?: string
          phone?: string | null
          points?: number | null
          profile_picture?: string | null
          role?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
