export interface Post {
  id: string;
  created_at: string;
  topic: string;
  title: string | null;
  body_copy: string | null;
  hashtags: string[] | null;
  image_prompt: string | null;
  image_url: string | null;
  status: 'draft' | 'published';
  feedback_score: number | null;
  project?: 'IWP' | 'IWA';
  user_id?: string;
  platform?: string;
  template_used?: string;
  generation_time_ms?: number;
  word_count?: number;
  ai_model?: string;
  prompt_length?: number;
  is_favorite?: boolean;
  published_at?: string;
  copied_count?: number;
}

export interface GenerateRequest {
  topic: string;
  project: 'IWP' | 'IWA';
  imageUrl?: string;
}

export interface GenerateResponse {
  success: boolean;
  data?: Post;
  error?: string;
}

export interface AbacusTextResponse {
  title: string;
  body_copy: string;
  hashtags: string[];
  image_prompt: string;
}

export interface AbacusImageResponse {
  image_url: string;
  image_base64?: string;
}

export type PreviewMode = 'feed' | 'story' | 'linkedin';

export type Project = 'IWP' | 'IWA';

export interface Template {
  name: string;
  prompt: string;
}

export interface Templates {
  [key: string]: Template;
}
