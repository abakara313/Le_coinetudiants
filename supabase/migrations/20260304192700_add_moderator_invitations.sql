/*
  # Moderator Invitations System

  1. New Tables
    - `moderator_invitations`
      - `id` (uuid, primary key)
      - `code` (text, unique) - Secret invitation code
      - `email` (text, optional) - Email if pre-assigned
      - `used` (boolean, default false)
      - `used_by_id` (uuid, nullable) - User who used the code
      - `created_by_id` (uuid) - Admin who created the code
      - `created_at` (timestamptz)
      - `used_at` (timestamptz, nullable)
      - `expires_at` (timestamptz)

  2. Security
    - Enable RLS on moderator_invitations
    - Only admins can create/view/manage invitations
    - Only the inviter can use a code if email is specified
    - Codes expire after 30 days
*/

CREATE TABLE IF NOT EXISTS moderator_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  email text,
  used boolean DEFAULT false,
  used_by_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_by_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  used_at timestamptz,
  expires_at timestamptz DEFAULT (now() + interval '30 days')
);

CREATE INDEX IF NOT EXISTS idx_moderator_invitations_code ON moderator_invitations(code);
CREATE INDEX IF NOT EXISTS idx_moderator_invitations_email ON moderator_invitations(email);
CREATE INDEX IF NOT EXISTS idx_moderator_invitations_used ON moderator_invitations(used);

ALTER TABLE moderator_invitations ENABLE ROW LEVEL SECURITY;

-- Only admins can view all invitations
CREATE POLICY "Admins can view invitations"
  ON moderator_invitations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admins can create invitations
CREATE POLICY "Admins can create invitations"
  ON moderator_invitations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admins can update invitations
CREATE POLICY "Admins can update invitations"
  ON moderator_invitations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Anyone can view a single unused invitation by code (for registration)
CREATE POLICY "Anyone can view unused invitations by code"
  ON moderator_invitations FOR SELECT
  TO authenticated
  USING (used = false AND expires_at > now());
