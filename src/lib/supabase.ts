import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

export interface Profile {
  id:               string;
  email:            string;
  role:             'student' | 'individual' | 'moderator' | 'admin';
  phone:            string | null;
  trust_level:      number;
  account_status:   'active' | 'suspended' | 'pending';
  student_declared: boolean;
  created_at:       string;
  updated_at:       string;
}

export interface Announcement {
  donation_urgent: boolean;
  donation_goal: number;
  id:              string;
  title:           string;
  description:     string;
  // housing = logement, roommate = colocation, job = job étudiant,
  // service = service, donation = don d'objets entre étudiants
  type:            'housing' | 'roommate' | 'job' | 'service' | 'donation';
  price:           number | null;   // toujours null pour donation
  status:          'draft' | 'pending_review' | 'approved' | 'rejected' | 'archived';
  rejected_reason: string | null;
  views:           number;
  owner_id:        string;
  images:          string[];
  location:        string | null;
  contact_email:   string | null;
  contact_phone:   string | null;
  // Logement
  address:         string | null;
  surface:         number | null;
  rooms:           number | null;
  bedrooms:        number | null;
  floor:           number | null;
  total_floors:    number | null;
  furnished:       boolean;
  available_from:  string | null;
  deposit:         number | null;
  charges:         number | null;
  property_type:   'apartment' | 'house' | 'studio' | 'room' | 'other' | null;
  amenities:       string[];
  // Don d'objets
  donation_category:  string | null;  // clothes, books, furniture, food, electronics, other
  donation_condition: 'new' | 'good' | 'used' | null;
  donation_pickup:    boolean;
  donation_delivery:  boolean;
  created_at:      string;
  updated_at:      string;
}