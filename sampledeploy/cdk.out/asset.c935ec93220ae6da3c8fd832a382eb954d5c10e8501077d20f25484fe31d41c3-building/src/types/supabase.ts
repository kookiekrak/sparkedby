export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      ai_cache: {
        Row: {
          created_at: string
          id: string
          input_hash: string
          input_text: string
          output_text: string
          use_context: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          input_hash: string
          input_text: string
          output_text: string
          use_context?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          input_hash?: string
          input_text?: string
          output_text?: string
          use_context?: string | null
        }
        Relationships: []
      }
      containers: {
        Row: {
          chunk_id: number
          completed_at: string | null
          created_at: string
          error_message: string | null
          id: string
          metadata: Json | null
          started_at: string | null
          state: Database["public"]["Enums"]["container_state"]
          transcript_fragment: string | null
          updated_at: string
          visit_id: string
        }
        Insert: {
          chunk_id: number
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          started_at?: string | null
          state?: Database["public"]["Enums"]["container_state"]
          transcript_fragment?: string | null
          updated_at?: string
          visit_id: string
        }
        Update: {
          chunk_id?: number
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          started_at?: string | null
          state?: Database["public"]["Enums"]["container_state"]
          transcript_fragment?: string | null
          updated_at?: string
          visit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "containers_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          content: string
          created_at: string
          id: string
          metadata: Json | null
          template_id: string | null
          type: Database["public"]["Enums"]["note_type"]
          updated_at: string
          user_facing: boolean
          version_id: number
          visit_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          metadata?: Json | null
          template_id?: string | null
          type: Database["public"]["Enums"]["note_type"]
          updated_at?: string
          user_facing?: boolean
          version_id?: number
          visit_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          template_id?: string | null
          type?: Database["public"]["Enums"]["note_type"]
          updated_at?: string
          user_facing?: boolean
          version_id?: number
          visit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_profiles: {
        Row: {
          ai_context: string | null
          contact_information: Json | null
          created_at: string
          email: string | null
          id: string
          medical_record_number: string | null
          name: string
          notes: string | null
          phone: string | null
          pronoun: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_context?: string | null
          contact_information?: Json | null
          created_at?: string
          email?: string | null
          id?: string
          medical_record_number?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          pronoun?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_context?: string | null
          contact_information?: Json | null
          created_at?: string
          email?: string | null
          id?: string
          medical_record_number?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          pronoun?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      template_library: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          owner_id: string | null
          prompt: string
          published: boolean | null
          sample_output: string | null
          specialty: string | null
          tags: string[] | null
          type: Database["public"]["Enums"]["template_type"]
          updated_at: string
          version_id: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          owner_id?: string | null
          prompt: string
          published?: boolean | null
          sample_output?: string | null
          specialty?: string | null
          tags?: string[] | null
          type?: Database["public"]["Enums"]["template_type"]
          updated_at?: string
          version_id?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          owner_id?: string | null
          prompt?: string
          published?: boolean | null
          sample_output?: string | null
          specialty?: string | null
          tags?: string[] | null
          type?: Database["public"]["Enums"]["template_type"]
          updated_at?: string
          version_id?: number
        }
        Relationships: []
      }
      transcripts: {
        Row: {
          created_at: string
          full_text: string
          id: string
          metadata: Json | null
          updated_at: string
          visit_id: string
        }
        Insert: {
          created_at?: string
          full_text: string
          id?: string
          metadata?: Json | null
          updated_at?: string
          visit_id: string
        }
        Update: {
          created_at?: string
          full_text?: string
          id?: string
          metadata?: Json | null
          updated_at?: string
          visit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transcripts_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: true
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          address: string | null
          created_at: string
          id: string
          memory: Json | null
          name: string | null
          note_preferences: Json | null
          organization: string | null
          phone: string | null
          specialty: string | null
          title: string | null
          updated_at: string
          user_flags: Json | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          id: string
          memory?: Json | null
          name?: string | null
          note_preferences?: Json | null
          organization?: string | null
          phone?: string | null
          specialty?: string | null
          title?: string | null
          updated_at?: string
          user_flags?: Json | null
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          memory?: Json | null
          name?: string | null
          note_preferences?: Json | null
          organization?: string | null
          phone?: string | null
          specialty?: string | null
          title?: string | null
          updated_at?: string
          user_flags?: Json | null
        }
        Relationships: []
      }
      user_templates: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          prompt: string
          sample_output: string | null
          specialty: string | null
          tags: string[] | null
          type: Database["public"]["Enums"]["template_type"]
          updated_at: string | null
          user_id: string
          version_id: number
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          prompt: string
          sample_output?: string | null
          specialty?: string | null
          tags?: string[] | null
          type: Database["public"]["Enums"]["template_type"]
          updated_at?: string | null
          user_id: string
          version_id?: number
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          prompt?: string
          sample_output?: string | null
          specialty?: string | null
          tags?: string[] | null
          type?: Database["public"]["Enums"]["template_type"]
          updated_at?: string | null
          user_id?: string
          version_id?: number
        }
        Relationships: []
      }
      visits: {
        Row: {
          created_at: string
          ended_at: string | null
          id: string
          metadata: Json | null
          name: string | null
          patient_id: string | null
          started_at: string
          state: Database["public"]["Enums"]["visit_state"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          ended_at?: string | null
          id?: string
          metadata?: Json | null
          name?: string | null
          patient_id?: string | null
          started_at?: string
          state?: Database["public"]["Enums"]["visit_state"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          ended_at?: string | null
          id?: string
          metadata?: Json | null
          name?: string | null
          patient_id?: string | null
          started_at?: string
          state?: Database["public"]["Enums"]["visit_state"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visits_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      search_patients: {
        Args: {
          search_term: string
          user_id_param: string
        }
        Returns: {
          id: string
          name: string
          medical_record_number: string
        }[]
      }
    }
    Enums: {
      container_state: "pending" | "processing" | "completed" | "error"
      note_type: "soap" | "template" | "ai_context"
      template_type: "note" | "document"
      visit_state: "new" | "recording" | "paused" | "processing" | "ready"
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

