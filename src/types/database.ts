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
      /* =========================
         PROFILES
      ========================= */
      profiles: {
        Row: {
          id: string
          username: string | null
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
          is_admin: boolean
        }
        Insert: {
          id: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
          is_admin?: boolean
        }
        Update: {
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          updated_at?: string
          is_admin?: boolean
        }
      }

      /* =========================
         SUBSCRIPTION PLANS
      ========================= */
      subscription_plans: {
        Row: {
          id: string
          name: string
          description: string | null
          price: number
          currency: string
          billing_period: "month" | "year"
          features: Json
          is_popular: boolean
          stripe_price_id: string | null
          razorpay_plan_id: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          description?: string | null
          price: number
          currency?: string
          billing_period: "month" | "year"
          features?: Json
          is_popular?: boolean
          stripe_price_id?: string | null
          razorpay_plan_id?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          description?: string | null
          price?: number
          currency?: string
          billing_period?: "month" | "year"
          features?: Json
          is_popular?: boolean
          stripe_price_id?: string | null
          razorpay_plan_id?: string | null
          is_active?: boolean
          updated_at?: string
        }
      }

      /* =========================
         SUBSCRIPTIONS
      ========================= */
      subscriptions: {
        Row: {
          id: string
          user_id: string
          status: "active" | "canceled" | "past_due" | "trialing"
          plan_id: string
          current_period_start: string | null
          current_period_end: string | null
          cancel_at_period_end: boolean
          stripe_subscription_id: string | null
          razorpay_subscription_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          status: "active" | "canceled" | "past_due" | "trialing"
          plan_id: string
          current_period_start?: string | null
          current_period_end?: string | null
          cancel_at_period_end?: boolean
          stripe_subscription_id?: string | null
          razorpay_subscription_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          status?: "active" | "canceled" | "past_due" | "trialing"
          plan_id?: string
          current_period_start?: string | null
          current_period_end?: string | null
          cancel_at_period_end?: boolean
          stripe_subscription_id?: string | null
          razorpay_subscription_id?: string | null
          updated_at?: string
        }
      }

      /* =========================
         PAYMENTS
      ========================= */
      payments: {
        Row: {
          id: string
          user_id: string
          amount: number
          currency: string
          status: "succeeded" | "failed" | "pending"
          payment_provider: "stripe" | "razorpay"
          provider_payment_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          amount: number
          currency?: string
          status: "succeeded" | "failed" | "pending"
          payment_provider: "stripe" | "razorpay"
          provider_payment_id?: string | null
          created_at?: string
        }
        Update: {
          amount?: number
          currency?: string
          status?: "succeeded" | "failed" | "pending"
          payment_provider?: "stripe" | "razorpay"
          provider_payment_id?: string | null
        }
      }

      /* =========================
         TODOS
      ========================= */
      todos: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          completed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          completed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          title?: string
          description?: string | null
          completed?: boolean
          updated_at?: string
        }
      }

      /* =========================
         CREDITS
      ========================= */
      credits: {
        Row: {
          id: string
          credits: number
          updated_at: string
        }
        Insert: {
          id: string
          credits?: number
          updated_at?: string
        }
        Update: {
          credits?: number
          updated_at?: string
        }
      }

      /* =========================
         CREDIT SETTINGS
      ========================= */
      credit_settings: {
        Row: {
          id: string
          feature_name: string
          credit_cost: number
          description: string | null
          is_per_page: boolean
          max_pages: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          feature_name: string
          credit_cost: number
          description?: string | null
          is_per_page?: boolean
          max_pages?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          credit_cost?: number
          description?: string | null
          is_per_page?: boolean
          max_pages?: number | null
          updated_at?: string
        }
      }

      /* =========================
         RUNS
      ========================= */
      runs: {
        Row: {
          id: string
          user_id: string | null
          url: string
          type: string
          status: string
          created_at: string
          result: Json | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          url: string
          type: string
          status?: string
          created_at?: string
          result?: Json | null
        }
        Update: {
          status?: string
          result?: Json | null
        }
      }

      /* =========================
         DAILY API USAGE
      ========================= */
      daily_api_usage: {
        Row: {
          ip: string
          usage_date: string
          usage_count: number
        }
        Insert: {
          ip: string
          usage_date?: string
          usage_count?: number
        }
        Update: {
          usage_count?: number
        }
      }
    }
  }
}
