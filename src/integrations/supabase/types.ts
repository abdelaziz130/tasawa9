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
      abandoned_carts: {
        Row: {
          cart_items: Json
          commune: string | null
          created_at: string
          customer_name: string | null
          id: string
          phone: string | null
          subtotal: number
          updated_at: string
          wilaya: string | null
        }
        Insert: {
          cart_items?: Json
          commune?: string | null
          created_at?: string
          customer_name?: string | null
          id?: string
          phone?: string | null
          subtotal?: number
          updated_at?: string
          wilaya?: string | null
        }
        Update: {
          cart_items?: Json
          commune?: string | null
          created_at?: string
          customer_name?: string | null
          id?: string
          phone?: string | null
          subtotal?: number
          updated_at?: string
          wilaya?: string | null
        }
        Relationships: []
      }
      communes_shipping: {
        Row: {
          commune_name: string
          created_at: string
          desk_fee: number
          home_fee: number
          id: string
          updated_at: string
          wilaya_code: number
        }
        Insert: {
          commune_name: string
          created_at?: string
          desk_fee?: number
          home_fee?: number
          id?: string
          updated_at?: string
          wilaya_code: number
        }
        Update: {
          commune_name?: string
          created_at?: string
          desk_fee?: number
          home_fee?: number
          id?: string
          updated_at?: string
          wilaya_code?: number
        }
        Relationships: []
      }
      coupons: {
        Row: {
          active: boolean
          code: string
          created_at: string
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: string
          min_order: number
          times_used: number
          usage_limit: number | null
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          min_order?: number
          times_used?: number
          usage_limit?: number | null
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          min_order?: number
          times_used?: number
          usage_limit?: number | null
        }
        Relationships: []
      }
      orders: {
        Row: {
          cart_items: Json
          commune: string
          created_at: string
          customer_name: string
          delivery_type: string
          id: string
          phone: string
          refusal_reason: string | null
          shipping_fee: number
          status: string
          total_price: number
          wilaya: string
        }
        Insert: {
          cart_items?: Json
          commune: string
          created_at?: string
          customer_name: string
          delivery_type?: string
          id?: string
          phone: string
          refusal_reason?: string | null
          shipping_fee?: number
          status?: string
          total_price?: number
          wilaya: string
        }
        Update: {
          cart_items?: Json
          commune?: string
          created_at?: string
          customer_name?: string
          delivery_type?: string
          id?: string
          phone?: string
          refusal_reason?: string | null
          shipping_fee?: number
          status?: string
          total_price?: number
          wilaya?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          free_shipping: boolean
          id: string
          image_url: string | null
          images: Json
          landing_content: Json | null
          landing_slug: string | null
          offer_expires_at: string | null
          old_price: number | null
          price: number
          stock: number
          tags: string[]
          title: string
          video_url: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          free_shipping?: boolean
          id?: string
          image_url?: string | null
          images?: Json
          landing_content?: Json | null
          landing_slug?: string | null
          offer_expires_at?: string | null
          old_price?: number | null
          price?: number
          stock?: number
          tags?: string[]
          title: string
          video_url?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          free_shipping?: boolean
          id?: string
          image_url?: string | null
          images?: Json
          landing_content?: Json | null
          landing_slug?: string | null
          offer_expires_at?: string | null
          old_price?: number | null
          price?: number
          stock?: number
          tags?: string[]
          title?: string
          video_url?: string | null
        }
        Relationships: []
      }
      purchase_events: {
        Row: {
          created_at: string
          first_name: string
          id: string
          product_title: string
          wilaya: string
        }
        Insert: {
          created_at?: string
          first_name: string
          id?: string
          product_title: string
          wilaya: string
        }
        Update: {
          created_at?: string
          first_name?: string
          id?: string
          product_title?: string
          wilaya?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          customer_name: string
          id: string
          photo_url: string | null
          product_id: string
          rating: number
        }
        Insert: {
          comment?: string | null
          created_at?: string
          customer_name: string
          id?: string
          photo_url?: string | null
          product_id: string
          rating?: number
        }
        Update: {
          comment?: string | null
          created_at?: string
          customer_name?: string
          id?: string
          photo_url?: string | null
          product_id?: string
          rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      store_settings: {
        Row: {
          app_icon_url: string | null
          chatbot_kb: string
          created_at: string
          default_theme: string
          id: string
          store_name: string
          updated_at: string
          whatsapp_number: string
        }
        Insert: {
          app_icon_url?: string | null
          chatbot_kb?: string
          created_at?: string
          default_theme?: string
          id?: string
          store_name?: string
          updated_at?: string
          whatsapp_number?: string
        }
        Update: {
          app_icon_url?: string | null
          chatbot_kb?: string
          created_at?: string
          default_theme?: string
          id?: string
          store_name?: string
          updated_at?: string
          whatsapp_number?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      wilayas_shipping: {
        Row: {
          created_at: string
          desk_fee: number
          home_fee: number
          id: string
          wilaya_code: number
          wilaya_name: string
        }
        Insert: {
          created_at?: string
          desk_fee?: number
          home_fee?: number
          id?: string
          wilaya_code: number
          wilaya_name: string
        }
        Update: {
          created_at?: string
          desk_fee?: number
          home_fee?: number
          id?: string
          wilaya_code?: number
          wilaya_name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      is_staff: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "sub_admin"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "sub_admin"],
    },
  },
} as const
