export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          plan: Database["public"]["Enums"]["plan_type"];
          credits_balance: number;
          stripe_customer_id: string | null;
          onboarding_completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          plan?: Database["public"]["Enums"]["plan_type"];
          credits_balance?: number;
          stripe_customer_id?: string | null;
          onboarding_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          plan?: Database["public"]["Enums"]["plan_type"];
          credits_balance?: number;
          stripe_customer_id?: string | null;
          onboarding_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          stripe_subscription_id: string;
          stripe_price_id: string;
          plan: Database["public"]["Enums"]["plan_type"];
          status: string;
          current_period_start: string;
          current_period_end: string;
          cancel_at_period_end: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          stripe_subscription_id: string;
          stripe_price_id: string;
          plan: Database["public"]["Enums"]["plan_type"];
          status?: string;
          current_period_start: string;
          current_period_end: string;
          cancel_at_period_end?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          stripe_subscription_id?: string;
          stripe_price_id?: string;
          plan?: Database["public"]["Enums"]["plan_type"];
          status?: string;
          current_period_start?: string;
          current_period_end?: string;
          cancel_at_period_end?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      credits_transactions: {
        Row: {
          id: string;
          user_id: string;
          amount: number;
          type: Database["public"]["Enums"]["credit_type"];
          description: string | null;
          reference_id: string | null;
          balance_after: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          amount: number;
          type: Database["public"]["Enums"]["credit_type"];
          description?: string | null;
          reference_id?: string | null;
          balance_after: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          amount?: number;
          type?: Database["public"]["Enums"]["credit_type"];
          description?: string | null;
          reference_id?: string | null;
          balance_after?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "credits_transactions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      videos: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          type: Database["public"]["Enums"]["video_type"];
          status: Database["public"]["Enums"]["video_status"];
          script_id: string | null;
          video_url: string | null;
          thumbnail_url: string | null;
          duration: number | null;
          credits_used: number;
          metadata: Json;
          error_message: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          type: Database["public"]["Enums"]["video_type"];
          status?: Database["public"]["Enums"]["video_status"];
          script_id?: string | null;
          video_url?: string | null;
          thumbnail_url?: string | null;
          duration?: number | null;
          credits_used?: number;
          metadata?: Json;
          error_message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          type?: Database["public"]["Enums"]["video_type"];
          status?: Database["public"]["Enums"]["video_status"];
          script_id?: string | null;
          video_url?: string | null;
          thumbnail_url?: string | null;
          duration?: number | null;
          credits_used?: number;
          metadata?: Json;
          error_message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "videos_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "videos_script_id_fkey";
            columns: ["script_id"];
            isOneToOne: false;
            referencedRelation: "scripts";
            referencedColumns: ["id"];
          },
        ];
      };
      scripts: {
        Row: {
          id: string;
          user_id: string;
          idea_id: string | null;
          title: string;
          content: string;
          tone: string | null;
          duration_target: number | null;
          word_count: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          idea_id?: string | null;
          title: string;
          content?: string;
          tone?: string | null;
          duration_target?: number | null;
          word_count?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          idea_id?: string | null;
          title?: string;
          content?: string;
          tone?: string | null;
          duration_target?: number | null;
          word_count?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "scripts_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "scripts_idea_id_fkey";
            columns: ["idea_id"];
            isOneToOne: false;
            referencedRelation: "ideas";
            referencedColumns: ["id"];
          },
        ];
      };
      ideas: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          category: string | null;
          status: Database["public"]["Enums"]["idea_status"];
          source: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          category?: string | null;
          status?: Database["public"]["Enums"]["idea_status"];
          source?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          category?: string | null;
          status?: Database["public"]["Enums"]["idea_status"];
          source?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ideas_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      avatars: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          did_avatar_id: string | null;
          thumbnail_url: string | null;
          is_default: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          did_avatar_id?: string | null;
          thumbnail_url?: string | null;
          is_default?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          did_avatar_id?: string | null;
          thumbnail_url?: string | null;
          is_default?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "avatars_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      voice_profiles: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          provider: string;
          provider_voice_id: string;
          language: string;
          sample_url: string | null;
          is_default: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          provider?: string;
          provider_voice_id: string;
          language?: string;
          sample_url?: string | null;
          is_default?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          provider?: string;
          provider_voice_id?: string;
          language?: string;
          sample_url?: string | null;
          is_default?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "voice_profiles_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      scheduled_posts: {
        Row: {
          id: string;
          user_id: string;
          video_id: string;
          platform: Database["public"]["Enums"]["platform_type"];
          connected_account_id: string | null;
          scheduled_at: string;
          published_at: string | null;
          status: Database["public"]["Enums"]["post_status"];
          platform_post_id: string | null;
          error_message: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          video_id: string;
          platform: Database["public"]["Enums"]["platform_type"];
          connected_account_id?: string | null;
          scheduled_at: string;
          published_at?: string | null;
          status?: Database["public"]["Enums"]["post_status"];
          platform_post_id?: string | null;
          error_message?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          video_id?: string;
          platform?: Database["public"]["Enums"]["platform_type"];
          connected_account_id?: string | null;
          scheduled_at?: string;
          published_at?: string | null;
          status?: Database["public"]["Enums"]["post_status"];
          platform_post_id?: string | null;
          error_message?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "scheduled_posts_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "scheduled_posts_video_id_fkey";
            columns: ["video_id"];
            isOneToOne: false;
            referencedRelation: "videos";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "scheduled_posts_connected_account_id_fkey";
            columns: ["connected_account_id"];
            isOneToOne: false;
            referencedRelation: "connected_accounts";
            referencedColumns: ["id"];
          },
        ];
      };
      connected_accounts: {
        Row: {
          id: string;
          user_id: string;
          platform: Database["public"]["Enums"]["platform_type"];
          platform_user_id: string;
          platform_username: string | null;
          access_token: string;
          refresh_token: string | null;
          token_expires_at: string | null;
          scopes: string[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          platform: Database["public"]["Enums"]["platform_type"];
          platform_user_id: string;
          platform_username?: string | null;
          access_token: string;
          refresh_token?: string | null;
          token_expires_at?: string | null;
          scopes?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          platform?: Database["public"]["Enums"]["platform_type"];
          platform_user_id?: string;
          platform_username?: string | null;
          access_token?: string;
          refresh_token?: string | null;
          token_expires_at?: string | null;
          scopes?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "connected_accounts_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      analytics_snapshots: {
        Row: {
          id: string;
          user_id: string;
          video_id: string;
          platform: Database["public"]["Enums"]["platform_type"];
          views: number;
          likes: number;
          comments: number;
          shares: number;
          watch_time_seconds: number;
          snapshot_date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          video_id: string;
          platform: Database["public"]["Enums"]["platform_type"];
          views?: number;
          likes?: number;
          comments?: number;
          shares?: number;
          watch_time_seconds?: number;
          snapshot_date?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          video_id?: string;
          platform?: Database["public"]["Enums"]["platform_type"];
          views?: number;
          likes?: number;
          comments?: number;
          shares?: number;
          watch_time_seconds?: number;
          snapshot_date?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "analytics_snapshots_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "analytics_snapshots_video_id_fkey";
            columns: ["video_id"];
            isOneToOne: false;
            referencedRelation: "videos";
            referencedColumns: ["id"];
          },
        ];
      };
      autopilot_profiles: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          niche: string;
          tone: string;
          video_type: Database["public"]["Enums"]["video_type"];
          target_platforms: Database["public"]["Enums"]["platform_type"][];
          posting_frequency: string;
          voice_profile_id: string | null;
          avatar_id: string | null;
          is_active: boolean;
          requires_approval: boolean;
          max_credits_per_run: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          niche: string;
          tone?: string;
          video_type?: Database["public"]["Enums"]["video_type"];
          target_platforms?: Database["public"]["Enums"]["platform_type"][];
          posting_frequency?: string;
          voice_profile_id?: string | null;
          avatar_id?: string | null;
          is_active?: boolean;
          requires_approval?: boolean;
          max_credits_per_run?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          niche?: string;
          tone?: string;
          video_type?: Database["public"]["Enums"]["video_type"];
          target_platforms?: Database["public"]["Enums"]["platform_type"][];
          posting_frequency?: string;
          voice_profile_id?: string | null;
          avatar_id?: string | null;
          is_active?: boolean;
          requires_approval?: boolean;
          max_credits_per_run?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "autopilot_profiles_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "autopilot_profiles_voice_profile_id_fkey";
            columns: ["voice_profile_id"];
            isOneToOne: false;
            referencedRelation: "voice_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "autopilot_profiles_avatar_id_fkey";
            columns: ["avatar_id"];
            isOneToOne: false;
            referencedRelation: "avatars";
            referencedColumns: ["id"];
          },
        ];
      };
      autopilot_runs: {
        Row: {
          id: string;
          user_id: string;
          profile_id: string;
          status: Database["public"]["Enums"]["autopilot_status"];
          idea_id: string | null;
          script_id: string | null;
          video_id: string | null;
          credits_used: number;
          error_message: string | null;
          started_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          profile_id: string;
          status?: Database["public"]["Enums"]["autopilot_status"];
          idea_id?: string | null;
          script_id?: string | null;
          video_id?: string | null;
          credits_used?: number;
          error_message?: string | null;
          started_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          profile_id?: string;
          status?: Database["public"]["Enums"]["autopilot_status"];
          idea_id?: string | null;
          script_id?: string | null;
          video_id?: string | null;
          credits_used?: number;
          error_message?: string | null;
          started_at?: string;
          completed_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "autopilot_runs_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "autopilot_runs_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "autopilot_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "autopilot_runs_idea_id_fkey";
            columns: ["idea_id"];
            isOneToOne: false;
            referencedRelation: "ideas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "autopilot_runs_script_id_fkey";
            columns: ["script_id"];
            isOneToOne: false;
            referencedRelation: "scripts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "autopilot_runs_video_id_fkey";
            columns: ["video_id"];
            isOneToOne: false;
            referencedRelation: "videos";
            referencedColumns: ["id"];
          },
        ];
      };
      autopilot_approvals: {
        Row: {
          id: string;
          user_id: string;
          run_id: string;
          stage: string;
          content: Json;
          status: Database["public"]["Enums"]["approval_status"];
          feedback: string | null;
          decided_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          run_id: string;
          stage: string;
          content?: Json;
          status?: Database["public"]["Enums"]["approval_status"];
          feedback?: string | null;
          decided_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          run_id?: string;
          stage?: string;
          content?: Json;
          status?: Database["public"]["Enums"]["approval_status"];
          feedback?: string | null;
          decided_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "autopilot_approvals_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "autopilot_approvals_run_id_fkey";
            columns: ["run_id"];
            isOneToOne: false;
            referencedRelation: "autopilot_runs";
            referencedColumns: ["id"];
          },
        ];
      };
      email_logs: {
        Row: {
          id: string;
          user_id: string;
          type: Database["public"]["Enums"]["email_type"];
          subject: string;
          resend_id: string | null;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: Database["public"]["Enums"]["email_type"];
          subject: string;
          resend_id?: string | null;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: Database["public"]["Enums"]["email_type"];
          subject?: string;
          resend_id?: string | null;
          status?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "email_logs_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      email_preferences: {
        Row: {
          id: string;
          user_id: string;
          video_ready: boolean;
          credits_low: boolean;
          subscription_change: boolean;
          weekly_digest: boolean;
          autopilot_approval: boolean;
          marketing: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          video_ready?: boolean;
          credits_low?: boolean;
          subscription_change?: boolean;
          weekly_digest?: boolean;
          autopilot_approval?: boolean;
          marketing?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          video_ready?: boolean;
          credits_low?: boolean;
          subscription_change?: boolean;
          weekly_digest?: boolean;
          autopilot_approval?: boolean;
          marketing?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "email_preferences_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      plan_type: "free" | "starter" | "pro" | "business";
      video_status:
        | "draft"
        | "scripting"
        | "generating"
        | "processing"
        | "completed"
        | "failed";
      video_type: "faceless" | "avatar";
      idea_status: "new" | "scripted" | "produced" | "archived";
      credit_type: "purchase" | "usage" | "bonus" | "refund" | "subscription";
      post_status:
        | "scheduled"
        | "publishing"
        | "published"
        | "failed"
        | "cancelled";
      platform_type:
        | "youtube"
        | "tiktok"
        | "instagram"
        | "twitter"
        | "linkedin";
      autopilot_status: "running" | "paused" | "completed" | "failed";
      approval_status: "pending" | "approved" | "rejected";
      email_type:
        | "welcome"
        | "video_ready"
        | "credits_low"
        | "subscription_change"
        | "weekly_digest"
        | "autopilot_approval";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type PublicSchema = Database[Extract<keyof Database, "public">];

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
      Row: infer R;
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

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
    : never;
