export interface User {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  credits: number;
  plan: "free" | "starter" | "pro" | "business";
  stripe_customer_id: string | null;
  created_at: string;
}

export interface Video {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  type: "faceless" | "avatar";
  status: "draft" | "processing" | "completed" | "failed";
  video_url: string | null;
  thumbnail_url: string | null;
  duration: number | null;
  script: string | null;
  created_at: string;
  updated_at: string;
  scheduled_at: string | null;
  published_at: string | null;
}

export interface Idea {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: string | null;
  status: "new" | "scripted" | "produced" | "archived";
  created_at: string;
}

export interface Script {
  id: string;
  user_id: string;
  idea_id: string | null;
  title: string;
  content: string;
  tone: string | null;
  duration_target: number | null;
  created_at: string;
  updated_at: string;
}
