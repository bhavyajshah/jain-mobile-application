/*
  # Add Admin Features with Fixed Schema

  1. New Tables
    - `profiles`
      - Stores user profile information including role
    - `gathas`
      - Stores Jain verses/teachings
    - `student_gathas`
      - Tracks student progress with gathas
    - `attendance_requests`
      - Manages attendance request workflow
    - `daily_schedules`
      - Stores daily schedules and announcements

  2. Security
    - Enable RLS on all tables
    - Add appropriate policies for admin and student access
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  full_name text,
  avatar_url text,
  role text NOT NULL DEFAULT 'student' CHECK (role IN ('admin', 'student')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create gathas table
CREATE TABLE IF NOT EXISTS gathas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  difficulty_level text CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create student_gathas table
CREATE TABLE IF NOT EXISTS student_gathas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES profiles(id),
  gatha_id uuid REFERENCES gathas(id),
  completed_at timestamptz DEFAULT now(),
  UNIQUE(student_id, gatha_id)
);

-- Create attendance_requests table
CREATE TABLE IF NOT EXISTS attendance_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES profiles(id),
  date timestamptz NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_id uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create daily_schedules table
CREATE TABLE IF NOT EXISTS daily_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  title text NOT NULL,
  description text,
  start_time time,
  end_time time,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE gathas ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_gathas ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_schedules ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Policies for gathas
CREATE POLICY "Gathas are viewable by everyone"
  ON gathas FOR SELECT
  USING (true);

CREATE POLICY "Only admins can manage gathas"
  ON gathas FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Policies for student_gathas
CREATE POLICY "Students can view their own gathas"
  ON student_gathas FOR SELECT
  USING (
    auth.uid() = student_id OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Students can mark their own gathas"
  ON student_gathas FOR INSERT
  WITH CHECK (auth.uid() = student_id);

-- Policies for attendance_requests
CREATE POLICY "Students can view their own requests"
  ON attendance_requests FOR SELECT
  USING (
    student_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Students can create attendance requests"
  ON attendance_requests FOR INSERT
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Only admins can update request status"
  ON attendance_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Policies for daily_schedules
CREATE POLICY "Schedules are viewable by everyone"
  ON daily_schedules FOR SELECT
  USING (true);

CREATE POLICY "Only admins can manage schedules"
  ON daily_schedules FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Insert some sample gathas
INSERT INTO gathas (title, content, difficulty_level) VALUES
  ('Namokar Mantra', 'Namo Arihantanam...', 'beginner'),
  ('Bhaktamar Stotra', 'First verse...', 'intermediate'),
  ('Samayik Sutra', 'Complete sutra...', 'advanced');

-- Insert sample schedules
INSERT INTO daily_schedules (date, title, description, start_time, end_time)
VALUES
  (CURRENT_DATE, 'Morning Prayer', 'Daily morning prayer session', '06:00', '07:00'),
  (CURRENT_DATE, 'Gatha Learning', 'Learn new gathas', '10:00', '11:00'),
  (CURRENT_DATE, 'Evening Meditation', 'Group meditation session', '18:00', '19:00');