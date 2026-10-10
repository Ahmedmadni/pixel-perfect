export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      car_symptoms: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      diagnostic_events: {
        Row: {
          created_at: string
          details: string
          event_date: string
          event_type: string
          id: string
          issue_id: string
          odometer: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          details?: string
          event_date?: string
          event_type?: string
          id?: string
          issue_id: string
          odometer?: number | null
          user_id?: string
        }
        Update: {
          created_at?: string
          details?: string
          event_date?: string
          event_type?: string
          id?: string
          issue_id?: string
          odometer?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "diagnostic_events_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "diagnostic_issues"
            referencedColumns: ["id"]
          },
        ]
      }
      diagnostic_issues: {
        Row: {
          attachment_url: string | null
          confirmed_cause: string | null
          created_at: string
          diagnostic_summary: string | null
          first_detected_date: string
          first_odometer: number | null
          id: string
          maintenance_record_id: string | null
          notes: string | null
          obd_codes: string[]
          operating_conditions: string | null
          part_id: string | null
          prevention_notes: string | null
          repair_actions: string | null
          resolution: string | null
          resolved_date: string | null
          resolved_odometer: number | null
          root_cause_explanation: string | null
          safe_to_drive: boolean | null
          severity: string
          status: string
          suspected_cause: string | null
          symptoms: string | null
          title: string
          updated_at: string
          user_id: string
          vehicle_id: string
          verification_result: string | null
        }
        Insert: {
          attachment_url?: string | null
          confirmed_cause?: string | null
          created_at?: string
          diagnostic_summary?: string | null
          first_detected_date?: string
          first_odometer?: number | null
          id?: string
          maintenance_record_id?: string | null
          notes?: string | null
          obd_codes?: string[]
          operating_conditions?: string | null
          part_id?: string | null
          prevention_notes?: string | null
          repair_actions?: string | null
          resolution?: string | null
          resolved_date?: string | null
          resolved_odometer?: number | null
          root_cause_explanation?: string | null
          safe_to_drive?: boolean | null
          severity?: string
          status?: string
          suspected_cause?: string | null
          symptoms?: string | null
          title: string
          updated_at?: string
          user_id?: string
          vehicle_id: string
          verification_result?: string | null
        }
        Update: {
          attachment_url?: string | null
          confirmed_cause?: string | null
          created_at?: string
          diagnostic_summary?: string | null
          first_detected_date?: string
          first_odometer?: number | null
          id?: string
          maintenance_record_id?: string | null
          notes?: string | null
          obd_codes?: string[]
          operating_conditions?: string | null
          part_id?: string | null
          prevention_notes?: string | null
          repair_actions?: string | null
          resolution?: string | null
          resolved_date?: string | null
          resolved_odometer?: number | null
          root_cause_explanation?: string | null
          safe_to_drive?: boolean | null
          severity?: string
          status?: string
          suspected_cause?: string | null
          symptoms?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          vehicle_id?: string
          verification_result?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "diagnostic_issues_maintenance_record_id_fkey"
            columns: ["maintenance_record_id"]
            isOneToOne: false
            referencedRelation: "maintenance_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diagnostic_issues_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diagnostic_issues_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      diagnostic_tests: {
        Row: {
          actual_result: string | null
          conclusion: string | null
          created_at: string
          expected_result: string | null
          id: string
          issue_id: string
          odometer: number | null
          performed_date: string
          result_status: string
          sequence_no: number
          system_area: string | null
          test_method: string | null
          test_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          actual_result?: string | null
          conclusion?: string | null
          created_at?: string
          expected_result?: string | null
          id?: string
          issue_id: string
          odometer?: number | null
          performed_date?: string
          result_status?: string
          sequence_no?: number
          system_area?: string | null
          test_method?: string | null
          test_name: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          actual_result?: string | null
          conclusion?: string | null
          created_at?: string
          expected_result?: string | null
          id?: string
          issue_id?: string
          odometer?: number | null
          performed_date?: string
          result_status?: string
          sequence_no?: number
          system_area?: string | null
          test_method?: string | null
          test_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "diagnostic_tests_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "diagnostic_issues"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_categories: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          is_active: boolean
          name_ar: string
          name_en: string | null
          sort_order: number
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          name_ar: string
          name_en?: string | null
          sort_order?: number
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          name_ar?: string
          name_en?: string | null
          sort_order?: number
        }
        Relationships: []
      }
      maintenance_items: {
        Row: {
          category_id: string | null
          created_at: string
          default_interval_km: number | null
          default_interval_months: number | null
          description: string | null
          id: string
          is_recurring: boolean
          is_system: boolean
          name_ar: string
          name_en: string | null
          sort_order: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          default_interval_km?: number | null
          default_interval_months?: number | null
          description?: string | null
          id?: string
          is_recurring?: boolean
          is_system?: boolean
          name_ar: string
          name_en?: string | null
          sort_order?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          category_id?: string | null
          created_at?: string
          default_interval_km?: number | null
          default_interval_months?: number | null
          description?: string | null
          id?: string
          is_recurring?: boolean
          is_system?: boolean
          name_ar?: string
          name_en?: string | null
          sort_order?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "maintenance_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_records: {
        Row: {
          created_at: string
          id: string
          invoice_url: string | null
          labor_cost: number
          maintenance_item_id: string
          notes: string | null
          odometer: number
          other_cost: number
          parts_cost: number
          schedule_id: string | null
          service_date: string
          technician_name: string | null
          total_cost: number | null
          updated_at: string
          user_id: string
          vehicle_id: string
          workshop_name: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          invoice_url?: string | null
          labor_cost?: number
          maintenance_item_id: string
          notes?: string | null
          odometer: number
          other_cost?: number
          parts_cost?: number
          schedule_id?: string | null
          service_date: string
          technician_name?: string | null
          total_cost?: number | null
          updated_at?: string
          user_id: string
          vehicle_id: string
          workshop_name?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          invoice_url?: string | null
          labor_cost?: number
          maintenance_item_id?: string
          notes?: string | null
          odometer?: number
          other_cost?: number
          parts_cost?: number
          schedule_id?: string | null
          service_date?: string
          technician_name?: string | null
          total_cost?: number | null
          updated_at?: string
          user_id?: string
          vehicle_id?: string
          workshop_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_records_maintenance_item_id_fkey"
            columns: ["maintenance_item_id"]
            isOneToOne: false
            referencedRelation: "maintenance_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_records_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "vehicle_maintenance_schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_records_vehicle_id_user_id_fkey"
            columns: ["vehicle_id", "user_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      obd_fault_codes: {
        Row: {
          category: string
          code: string
          created_at: string
          description: string
          updated_at: string
        }
        Insert: {
          category: string
          code: string
          created_at?: string
          description: string
          updated_at?: string
        }
        Update: {
          category?: string
          code?: string
          created_at?: string
          description?: string
          updated_at?: string
        }
        Relationships: []
      }
      odometer_readings: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          reading: number
          reading_date: string
          source: string
          user_id: string
          vehicle_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          reading: number
          reading_date?: string
          source?: string
          user_id: string
          vehicle_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          reading?: number
          reading_date?: string
          source?: string
          user_id?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "odometer_readings_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      part_installations: {
        Row: {
          created_at: string
          id: string
          install_date: string
          maintenance_record_id: string | null
          notes: string | null
          odometer: number | null
          other_cost: number
          part_id: string
          quantity: number
          receipt_url: string | null
          supplier_id: string | null
          total_cost: number | null
          unit_price: number
          user_id: string
          vehicle_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          install_date?: string
          maintenance_record_id?: string | null
          notes?: string | null
          odometer?: number | null
          other_cost?: number
          part_id: string
          quantity?: number
          receipt_url?: string | null
          supplier_id?: string | null
          total_cost?: number | null
          unit_price?: number
          user_id?: string
          vehicle_id: string
        }
        Update: {
          created_at?: string
          id?: string
          install_date?: string
          maintenance_record_id?: string | null
          notes?: string | null
          odometer?: number | null
          other_cost?: number
          part_id?: string
          quantity?: number
          receipt_url?: string | null
          supplier_id?: string | null
          total_cost?: number | null
          unit_price?: number
          user_id?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "part_installations_maintenance_record_id_fkey"
            columns: ["maintenance_record_id"]
            isOneToOne: false
            referencedRelation: "maintenance_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "part_installations_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "part_installations_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "part_installations_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      part_prices: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          observed_date: string
          part_id: string
          price: number
          purchase_url: string | null
          supplier_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          observed_date?: string
          part_id: string
          price: number
          purchase_url?: string | null
          supplier_id?: string | null
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          observed_date?: string
          part_id?: string
          price?: number
          purchase_url?: string | null
          supplier_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "part_prices_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "part_prices_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      part_vehicle_fitments: {
        Row: {
          id: string
          part_id: string
          user_id: string
          vehicle_id: string
        }
        Insert: {
          id?: string
          part_id: string
          user_id?: string
          vehicle_id: string
        }
        Update: {
          id?: string
          part_id?: string
          user_id?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "part_vehicle_fitments_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "part_vehicle_fitments_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      parts: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          is_oem: boolean
          manufacturer: string | null
          name_ar: string
          name_en: string | null
          notes: string | null
          oem_part_number: string | null
          part_number: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          is_oem?: boolean
          manufacturer?: string | null
          name_ar: string
          name_en?: string | null
          notes?: string | null
          oem_part_number?: string | null
          part_number?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          is_oem?: boolean
          manufacturer?: string | null
          name_ar?: string
          name_en?: string | null
          notes?: string | null
          oem_part_number?: string | null
          part_number?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          preferred_language: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          preferred_language?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          preferred_language?: string
          updated_at?: string
        }
        Relationships: []
      }
      suppliers: {
        Row: {
          address: string | null
          created_at: string
          id: string
          name: string
          notes: string | null
          phone: string | null
          user_id: string
          website: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          user_id?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      symptom_causes: {
        Row: {
          base_likelihood: string
          cause: string
          created_at: string
          id: string
          km_threshold: number | null
          maintenance_item_id: string | null
          steps: string | null
          symptom_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          base_likelihood?: string
          cause: string
          created_at?: string
          id?: string
          km_threshold?: number | null
          maintenance_item_id?: string | null
          steps?: string | null
          symptom_id: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          base_likelihood?: string
          cause?: string
          created_at?: string
          id?: string
          km_threshold?: number | null
          maintenance_item_id?: string | null
          steps?: string | null
          symptom_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "symptom_causes_maintenance_item_id_fkey"
            columns: ["maintenance_item_id"]
            isOneToOne: false
            referencedRelation: "maintenance_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "symptom_causes_symptom_id_fkey"
            columns: ["symptom_id"]
            isOneToOne: false
            referencedRelation: "car_symptoms"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_maintenance_schedules: {
        Row: {
          created_at: string
          id: string
          interval_km: number | null
          interval_months: number | null
          is_enabled: boolean
          last_service_date: string | null
          last_service_odometer: number | null
          maintenance_item_id: string
          next_due_date: string | null
          next_due_odometer: number | null
          notes: string | null
          updated_at: string
          user_id: string
          vehicle_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          interval_km?: number | null
          interval_months?: number | null
          is_enabled?: boolean
          last_service_date?: string | null
          last_service_odometer?: number | null
          maintenance_item_id: string
          next_due_date?: string | null
          next_due_odometer?: number | null
          notes?: string | null
          updated_at?: string
          user_id: string
          vehicle_id: string
        }
        Update: {
          created_at?: string
          id?: string
          interval_km?: number | null
          interval_months?: number | null
          is_enabled?: boolean
          last_service_date?: string | null
          last_service_odometer?: number | null
          maintenance_item_id?: string
          next_due_date?: string | null
          next_due_odometer?: number | null
          notes?: string | null
          updated_at?: string
          user_id?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_maintenance_schedules_maintenance_item_id_fkey"
            columns: ["maintenance_item_id"]
            isOneToOne: false
            referencedRelation: "maintenance_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_maintenance_schedules_vehicle_id_user_id_fkey"
            columns: ["vehicle_id", "user_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      vehicles: {
        Row: {
          color: string | null
          created_at: string
          current_odometer: number
          engine: string | null
          fuel_type: string | null
          id: string
          image_url: string | null
          is_active: boolean
          manufacturer: string | null
          model: string | null
          model_year: number | null
          name: string
          notes: string | null
          plate_number: string | null
          purchase_date: string | null
          purchase_odometer: number | null
          purchase_price: number | null
          transmission: string | null
          trim: string | null
          updated_at: string
          user_id: string
          vin: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string
          current_odometer?: number
          engine?: string | null
          fuel_type?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          manufacturer?: string | null
          model?: string | null
          model_year?: number | null
          name: string
          notes?: string | null
          plate_number?: string | null
          purchase_date?: string | null
          purchase_odometer?: number | null
          purchase_price?: number | null
          transmission?: string | null
          trim?: string | null
          updated_at?: string
          user_id: string
          vin?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string
          current_odometer?: number
          engine?: string | null
          fuel_type?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          manufacturer?: string | null
          model?: string | null
          model_year?: number | null
          name?: string
          notes?: string | null
          plate_number?: string | null
          purchase_date?: string | null
          purchase_odometer?: number | null
          purchase_price?: number | null
          transmission?: string | null
          trim?: string | null
          updated_at?: string
          user_id?: string
          vin?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      rebuild_maintenance_schedule: {
        Args: { _schedule_id: string }
        Returns: undefined
      }
      set_active_vehicle: { Args: { _vehicle_id: string }; Returns: undefined }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
