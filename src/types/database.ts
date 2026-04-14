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
  | "policy"
  | "district_lookalike"
  | "icp_finder";

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

export type RematchJobStatus = "running" | "completed" | "failed";

/** One row per “Scan again” job; see profile_rematch_runs table. */
export interface ProfileRematchRun {
  id: string;
  user_id: string;
  status: RematchJobStatus;
  error_message: string | null;
  /** Processed candidate count during run; final total when completed. */
  signals_considered: number | null;
  /** Total vector matches for this run (set when processing starts). */
  candidates_total: number | null;
  inserted: number | null;
  updated: number | null;
  started_at: string;
  finished_at: string | null;
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
  rematch_status: RematchJobStatus | null;
  rematch_started_at: string | null;
  rematch_finished_at: string | null;
  rematch_error: string | null;
  rematch_signals_considered: number | null;
  rematch_candidates_total: number | null;
  rematch_inserted: number | null;
  rematch_updated: number | null;
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

export interface LeaDirectory {
  lea_id: string;
  state: string;
  name: string;
}

export interface SignalDistrict {
  id: string;
  signal_id: string;
  lea_id: string;
  extracted_text: string | null;
  match_score: number | null;
}

export interface SignalDistrictExpanded extends SignalDistrict {
  district_name: string;
  district_state: string;
  district_label: string;
}

export interface SignalWithDistricts extends Signal {
  signal_districts: SignalDistrictExpanded[];
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

export type PipelineType = "rss" | "ai_search" | "sam_gov";

export interface PipelineRun {
  id: string;
  data_source_id: string | null;
  parent_run_id: string | null;
  pipeline_type: PipelineType | null;
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
      profile_rematch_runs: {
        Row: ProfileRematchRun;
        Insert: Partial<ProfileRematchRun> & { user_id: string };
        Update: Partial<ProfileRematchRun>;
      };
      lea_directory: {
        Row: LeaDirectory;
        Insert: LeaDirectory;
        Update: Partial<LeaDirectory>;
      };
      signal_districts: {
        Row: SignalDistrict;
        Insert: Partial<SignalDistrict> & { signal_id: string; lea_id: string };
        Update: Partial<SignalDistrict>;
      };
    };
  };
}
