import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  email: string;
  role: 'student' | 'individual' | 'moderator' | 'admin';
  trust_level: number;
  created_at: string;
  updated_at: string;
};

export type Announcement = {
  id: string;
  title: string;
  description: string;
  type: 'housing' | 'roommate' | 'job' | 'service';
  price?: number;
  status: 'draft' | 'pending_review' | 'approved' | 'rejected' | 'archived';
  owner_id: string;
  created_at: string;
  updated_at: string;
};
