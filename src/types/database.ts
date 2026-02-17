export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "founder" | "admin";

export type SignalSourceType = "rss" | "sam_gov" | "scrape" | "ai_search";

export type SignalCategory =
  | "grant"
  | "rfp"
  | "board_minutes"
  | "news"
  | "competitor"
  | "policy";

export type DataSourceType = "rss" | "api" | "scrape" | "ai_search";

export type PipelineRunStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  company_name: string | null;
  role: UserRole;
  onboarding_completed: boolean;
  created_at: string;
}

export interface SignalProfile {
  id: string;
  user_id: string;
  keywords: string[];
  target_regions: string[];
  district_types: string[];
  district_size_range: string | null;
  problem_areas: string[];
  solution_categories: string[];
  funding_sources: string[];
  competitor_names: string[];
  bellwether_districts: string[];
  profile_embedding: number[] | null;
  created_at: string;
  updated_at: string;
}

export interface Signal {
  id: string;
  source_type: SignalSourceType;
  source_url: string | null;
  title: string;
  raw_content: string | null;
  published_at: string | null;
  region: string | null;
  signal_category: SignalCategory | null;
  content_embedding: number[] | null;
  metadata: Json;
  created_at: string;
}

export interface SignalMatch {
  id: string;
  signal_id: string;
  user_id: string;
  relevance_score: number | null;
  why_it_matters: string | null;
  action_suggestion: string | null;
  is_read: boolean;
  is_bookmarked: boolean;
  created_at: string;
}

export interface SignalMatchWithSignal extends SignalMatch {
  signal: Signal;
}

export interface Digest {
  id: string;
  user_id: string;
  period_start: string;
  period_end: string;
  summary_markdown: string | null;
  signal_match_ids: string[];
  created_at: string;
}

export interface DataSource {
  id: string;
  name: string;
  source_type: DataSourceType;
  config: Json;
  is_active: boolean;
  last_scanned_at: string | null;
  scan_frequency_hours: number;
  created_at: string;
}

export interface PipelineRun {
  id: string;
  data_source_id: string | null;
  status: PipelineRunStatus;
  signals_found: number;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

// Supabase Database type definition - using looser types for insert/update
// to avoid "never" type issues with the Supabase client
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & { id: string; email: string };
        Update: Partial<Profile>;
      };
      signal_profiles: {
        Row: SignalProfile;
        Insert: Partial<SignalProfile> & { user_id: string };
        Update: Partial<SignalProfile>;
      };
      signals: {
        Row: Signal;
        Insert: Partial<Signal> & { source_type: string; title: string };
        Update: Partial<Signal>;
      };
      signal_matches: {
        Row: SignalMatch;
        Insert: Partial<SignalMatch> & { signal_id: string; user_id: string };
        Update: Partial<SignalMatch>;
      };
      digests: {
        Row: Digest;
        Insert: Partial<Digest> & { user_id: string; period_start: string; period_end: string };
        Update: Partial<Digest>;
      };
      data_sources: {
        Row: DataSource;
        Insert: Partial<DataSource> & { name: string; source_type: string };
        Update: Partial<DataSource>;
      };
      pipeline_runs: {
        Row: PipelineRun;
        Insert: Partial<PipelineRun>;
        Update: Partial<PipelineRun>;
      };
    };
  };
}
