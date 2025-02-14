/*
  # Create attendance tracking schema

  1. New Tables
    - `attendance`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `date` (timestamptz)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `attendance` table
    - Add policies for authenticated users to:
      - Insert their own attendance records
      - Read their own attendance records
*/

-- Create attendance table
CREATE TABLE IF NOT EXISTS attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  date timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can insert their own attendance"
  ON attendance
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read their own attendance"
  ON attendance
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);