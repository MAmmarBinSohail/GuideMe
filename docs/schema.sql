-- ============================================================
-- GuideMe Database Schema
-- Version: 2.0.0
-- Description: Complete database schema for GuideMe
-- A Smart Online Counseling & Mentorship Marketplace
-- Built by: M.Usman Hassan (BSEF22M010)
--           M.Ammar Bin Sohail (BSEF22M056)
-- Supervised by: Dr. Mufassra Naz, PUCIT
-- ============================================================

-- ============================================================
-- SECTION 1: CORE TABLES
-- ============================================================

-- Profiles table (extends Supabase Auth users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  email TEXT,
  role TEXT CHECK (role IN ('mentee', 'mentor', 'admin')) DEFAULT 'mentee',
  profile_picture_url TEXT,
  phone TEXT,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Anyone can view mentor profiles"
  ON profiles FOR SELECT
  USING (true);

-- ============================================================

-- Mentor Profiles table
CREATE TABLE mentor_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  bio TEXT,
  category TEXT CHECK (category IN (
    'academic', 'career', 'business', 'technology',
    'health', 'personal', 'creative', 'finance',
    'legal', 'leadership', 'language', 'engineering'
  )),
  expertise_areas TEXT[],
  years_of_experience INTEGER,
  session_language TEXT DEFAULT 'english',
  initial_session_price NUMERIC DEFAULT 0,
  followup_session_price NUMERIC DEFAULT 0,
  is_free_first_session BOOLEAN DEFAULT false,
  overage_price_per_minute NUMERIC DEFAULT 0,
  average_rating NUMERIC DEFAULT 0,
  portfolio_url TEXT,
  is_available BOOLEAN DEFAULT true,
  is_hibernating BOOLEAN DEFAULT false,
  hibernate_until DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE mentor_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view mentor profiles"
  ON mentor_profiles FOR SELECT
  USING (true);

CREATE POLICY "Mentors can update own profile"
  ON mentor_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Mentors can insert own profile"
  ON mentor_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================

-- Mentor Education table
CREATE TABLE mentor_education (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mentor_id UUID REFERENCES mentor_profiles(id) ON DELETE CASCADE NOT NULL,
  degree TEXT NOT NULL,
  field_of_study TEXT,
  institution TEXT NOT NULL,
  start_year INTEGER,
  end_year INTEGER,
  is_current BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE mentor_education ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view mentor education"
  ON mentor_education FOR SELECT USING (true);

CREATE POLICY "Mentors can insert own education"
  ON mentor_education FOR INSERT
  WITH CHECK (
    auth.uid() = (SELECT user_id FROM mentor_profiles WHERE id = mentor_id)
  );

CREATE POLICY "Mentors can update own education"
  ON mentor_education FOR UPDATE
  USING (
    auth.uid() = (SELECT user_id FROM mentor_profiles WHERE id = mentor_id)
  );

CREATE POLICY "Mentors can delete own education"
  ON mentor_education FOR DELETE
  USING (
    auth.uid() = (SELECT user_id FROM mentor_profiles WHERE id = mentor_id)
  );

CREATE INDEX idx_mentor_education_mentor ON mentor_education(mentor_id);

-- ============================================================

-- Mentor Experience table
CREATE TABLE mentor_experience (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mentor_id UUID REFERENCES mentor_profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  start_year INTEGER,
  end_year INTEGER,
  is_current BOOLEAN DEFAULT false,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE mentor_experience ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view mentor experience"
  ON mentor_experience FOR SELECT USING (true);

CREATE POLICY "Mentors can insert own experience"
  ON mentor_experience FOR INSERT
  WITH CHECK (
    auth.uid() = (SELECT user_id FROM mentor_profiles WHERE id = mentor_id)
  );

CREATE POLICY "Mentors can update own experience"
  ON mentor_experience FOR UPDATE
  USING (
    auth.uid() = (SELECT user_id FROM mentor_profiles WHERE id = mentor_id)
  );

CREATE POLICY "Mentors can delete own experience"
  ON mentor_experience FOR DELETE
  USING (
    auth.uid() = (SELECT user_id FROM mentor_profiles WHERE id = mentor_id)
  );

CREATE INDEX idx_mentor_experience_mentor ON mentor_experience(mentor_id);

-- ============================================================

-- Mentor Certifications table
CREATE TABLE mentor_certifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mentor_id UUID REFERENCES mentor_profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  issuing_organization TEXT NOT NULL,
  issue_year INTEGER,
  expiry_year INTEGER,
  credential_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE mentor_certifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view mentor certifications"
  ON mentor_certifications FOR SELECT USING (true);

CREATE POLICY "Mentors can insert own certifications"
  ON mentor_certifications FOR INSERT
  WITH CHECK (
    auth.uid() = (SELECT user_id FROM mentor_profiles WHERE id = mentor_id)
  );

CREATE POLICY "Mentors can update own certifications"
  ON mentor_certifications FOR UPDATE
  USING (
    auth.uid() = (SELECT user_id FROM mentor_profiles WHERE id = mentor_id)
  );

CREATE POLICY "Mentors can delete own certifications"
  ON mentor_certifications FOR DELETE
  USING (
    auth.uid() = (SELECT user_id FROM mentor_profiles WHERE id = mentor_id)
  );

CREATE INDEX idx_mentor_certifications_mentor ON mentor_certifications(mentor_id);

-- ============================================================

-- Mentor Videos table
CREATE TABLE mentor_videos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mentor_id UUID REFERENCES mentor_profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT,
  video_url TEXT NOT NULL,
  video_type TEXT NOT NULL CHECK (
    video_type IN ('youtube', 'youtube_playlist', 'drive')
  ),
  embed_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE mentor_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view mentor videos"
  ON mentor_videos FOR SELECT USING (true);

CREATE POLICY "Verified mentors can insert own videos"
  ON mentor_videos FOR INSERT
  WITH CHECK (
    auth.uid() = (
      SELECT mp.user_id FROM mentor_profiles mp
      JOIN profiles p ON p.id = mp.user_id
      WHERE mp.id = mentor_id
      AND p.is_verified = true
    )
  );

CREATE POLICY "Mentors can update own videos"
  ON mentor_videos FOR UPDATE
  USING (
    auth.uid() = (SELECT user_id FROM mentor_profiles WHERE id = mentor_id)
  );

CREATE POLICY "Mentors can delete own videos"
  ON mentor_videos FOR DELETE
  USING (
    auth.uid() = (SELECT user_id FROM mentor_profiles WHERE id = mentor_id)
  );

CREATE INDEX idx_mentor_videos_mentor ON mentor_videos(mentor_id);

-- ============================================================

-- Mentor Weekly Availability table
CREATE TABLE mentor_weekly_availability (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mentor_id UUID REFERENCES mentor_profiles(id) ON DELETE CASCADE NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

ALTER TABLE mentor_weekly_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view weekly availability"
  ON mentor_weekly_availability FOR SELECT USING (true);

CREATE POLICY "Mentors can insert own weekly availability"
  ON mentor_weekly_availability FOR INSERT
  WITH CHECK (
    auth.uid() = (SELECT user_id FROM mentor_profiles WHERE id = mentor_id)
  );

CREATE POLICY "Mentors can update own weekly availability"
  ON mentor_weekly_availability FOR UPDATE
  USING (
    auth.uid() = (SELECT user_id FROM mentor_profiles WHERE id = mentor_id)
  );

CREATE POLICY "Mentors can delete own weekly availability"
  ON mentor_weekly_availability FOR DELETE
  USING (
    auth.uid() = (SELECT user_id FROM mentor_profiles WHERE id = mentor_id)
  );

CREATE INDEX idx_mentor_weekly_availability_mentor
  ON mentor_weekly_availability(mentor_id);

CREATE INDEX idx_mentor_weekly_availability_day
  ON mentor_weekly_availability(day_of_week);

-- ============================================================

-- Bookings table
CREATE TABLE bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mentee_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  mentor_id UUID REFERENCES mentor_profiles(id) ON DELETE CASCADE NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL CHECK (
    duration_minutes >= 30 AND duration_minutes <= 180
  ),
  status TEXT DEFAULT 'pending' CHECK (
    status IN ('pending', 'confirmed', 'cancelled', 'completed')
  ),
  session_type TEXT DEFAULT 'initial' CHECK (
    session_type IN ('initial', 'followup')
  ),
  is_paid BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bookings"
  ON bookings FOR SELECT
  USING (
    auth.uid() = mentee_id OR
    auth.uid() = (SELECT user_id FROM mentor_profiles WHERE id = mentor_id)
  );

CREATE POLICY "Mentees can create bookings"
  ON bookings FOR INSERT
  WITH CHECK (auth.uid() = mentee_id);

CREATE POLICY "Users can update own bookings"
  ON bookings FOR UPDATE
  USING (
    auth.uid() = mentee_id OR
    auth.uid() = (SELECT user_id FROM mentor_profiles WHERE id = mentor_id)
  );

CREATE POLICY "Mentors can mark own bookings completed"
  ON bookings FOR UPDATE
  USING (
    auth.uid() = (SELECT user_id FROM mentor_profiles WHERE id = mentor_id)
  );

-- ============================================================

-- Meetings table
CREATE TABLE meetings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE UNIQUE NOT NULL,
  meeting_link TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (
    status IN ('active', 'completed', 'cancelled')
  ),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own meetings"
  ON meetings FOR SELECT
  USING (
    booking_id IN (
      SELECT id FROM bookings
      WHERE mentee_id = auth.uid() OR
        mentor_id IN (
          SELECT id FROM mentor_profiles WHERE user_id = auth.uid()
        )
    )
  );

CREATE POLICY "System can insert meetings"
  ON meetings FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "System can update meetings"
  ON meetings FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- ============================================================

-- Reviews table
CREATE TABLE reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE UNIQUE NOT NULL,
  mentee_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  mentor_id UUID REFERENCES mentor_profiles(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review_text TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reviews"
  ON reviews FOR SELECT USING (true);

CREATE POLICY "Mentees can insert own reviews"
  ON reviews FOR INSERT
  WITH CHECK (auth.uid() = mentee_id);

-- ============================================================

-- Payments table
CREATE TABLE payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC NOT NULL,
  platform_commission NUMERIC DEFAULT 0,
  mentor_payout NUMERIC DEFAULT 0,
  payment_status TEXT DEFAULT 'pending' CHECK (
    payment_status IN ('pending', 'completed', 'failed', 'refunded')
  ),
  payment_type TEXT DEFAULT 'session' CHECK (
    payment_type IN ('session', 'overage')
  ),
  payment_method TEXT CHECK (
    payment_method IN (
      'jazzcash', 'easypaisa', 'bank_transfer', 'wise', 'payoneer'
    )
  ),
  transaction_reference TEXT,
  transaction_id TEXT,
  note TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payments"
  ON payments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payments"
  ON payments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Mentors can insert overage payments for their mentees"
  ON payments FOR INSERT
  WITH CHECK (
    payment_type = 'overage'
    AND booking_id IN (
      SELECT id FROM bookings
      WHERE mentor_id IN (
        SELECT id FROM mentor_profiles WHERE user_id = auth.uid()
      )
    )
  );

-- ============================================================

-- Notifications table
CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN (
    'booking_confirmed', 'session_reminder', 'booking_cancelled',
    'reschedule', 'meeting_link', 'payment', 'system'
  )),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  related_booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notifications"
  ON notifications FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================

-- Notification Preferences table
CREATE TABLE notification_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  email_notifications BOOLEAN DEFAULT true,
  booking_alerts BOOLEAN DEFAULT true,
  reminder_alerts BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own preferences"
  ON notification_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON notification_preferences FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON notification_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================

-- Chatbot Sessions table
CREATE TABLE chatbot_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  phase TEXT DEFAULT 'onboarding' CHECK (phase IN ('onboarding', 'conversation')),
  onboarding_data JSONB DEFAULT '{}',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'ended')),
  started_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE chatbot_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own chatbot sessions"
  ON chatbot_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chatbot sessions"
  ON chatbot_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chatbot sessions"
  ON chatbot_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================

-- Chatbot Messages table
CREATE TABLE chatbot_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES chatbot_sessions(id) ON DELETE CASCADE NOT NULL,
  sender TEXT NOT NULL CHECK (sender IN ('user', 'bot')),
  message_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE chatbot_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own chatbot messages"
  ON chatbot_messages FOR SELECT
  USING (
    session_id IN (
      SELECT id FROM chatbot_sessions WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own chatbot messages"
  ON chatbot_messages FOR INSERT
  WITH CHECK (
    session_id IN (
      SELECT id FROM chatbot_sessions WHERE user_id = auth.uid()
    )
  );

-- ============================================================

-- Chatbot FAQs table
CREATE TABLE chatbot_faqs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  keyword TEXT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE chatbot_faqs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view FAQs"
  ON chatbot_faqs FOR SELECT USING (true);

-- ============================================================
-- SECTION 2: SQL FUNCTIONS
-- ============================================================

-- Function: Check booking overlap
CREATE OR REPLACE FUNCTION check_booking_overlap(
  p_mentor_id UUID,
  p_scheduled_at TIMESTAMPTZ,
  p_duration_minutes INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
  overlap_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO overlap_count
  FROM bookings
  WHERE mentor_id = p_mentor_id
    AND status IN ('confirmed', 'pending')
    AND (
      (p_scheduled_at >= scheduled_at
        AND p_scheduled_at < scheduled_at + (duration_minutes || ' minutes')::INTERVAL)
      OR
      (p_scheduled_at + (p_duration_minutes || ' minutes')::INTERVAL > scheduled_at
        AND p_scheduled_at + (p_duration_minutes || ' minutes')::INTERVAL
          <= scheduled_at + (duration_minutes || ' minutes')::INTERVAL)
      OR
      (p_scheduled_at <= scheduled_at
        AND p_scheduled_at + (p_duration_minutes || ' minutes')::INTERVAL
          >= scheduled_at + (duration_minutes || ' minutes')::INTERVAL)
    );

  RETURN overlap_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================

-- Function: Get available start times
CREATE OR REPLACE FUNCTION get_available_start_times(
  p_mentor_id UUID,
  p_date DATE,
  p_duration_minutes INTEGER
) RETURNS TABLE (start_time TIME) AS $$
DECLARE
  v_day_of_week INTEGER;
  block RECORD;
  slot_start TIME;
  slot_start_ts TIMESTAMPTZ;
BEGIN
  v_day_of_week := EXTRACT(DOW FROM p_date);

  FOR block IN
    SELECT mwa.start_time, mwa.end_time
    FROM mentor_weekly_availability mwa
    WHERE mwa.mentor_id = p_mentor_id
      AND mwa.day_of_week = v_day_of_week
      AND mwa.is_active = true
  LOOP
    slot_start := block.start_time;

    WHILE slot_start + (p_duration_minutes || ' minutes')::INTERVAL
      <= block.end_time LOOP
      slot_start_ts :=
        (p_date::TEXT || ' ' || slot_start::TEXT)::TIMESTAMPTZ;

      IF NOT check_booking_overlap(
        p_mentor_id, slot_start_ts, p_duration_minutes
      ) THEN
        start_time := slot_start;
        RETURN NEXT;
      END IF;

      slot_start := slot_start + INTERVAL '30 minutes';
    END LOOP;
  END LOOP;

  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================

-- Function: Check if mentee is eligible for free session
CREATE OR REPLACE FUNCTION is_eligible_for_free_session(
  p_mentee_id UUID,
  p_mentor_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  prior_bookings INTEGER;
  mentor_allows_free BOOLEAN;
BEGIN
  SELECT is_free_first_session INTO mentor_allows_free
  FROM mentor_profiles WHERE id = p_mentor_id;

  IF mentor_allows_free IS NOT TRUE THEN
    RETURN false;
  END IF;

  SELECT COUNT(*) INTO prior_bookings
  FROM bookings
  WHERE mentee_id = p_mentee_id
    AND mentor_id = p_mentor_id
    AND status IN ('confirmed', 'completed');

  RETURN prior_bookings = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================

-- Function: Auto verification check
CREATE OR REPLACE FUNCTION check_mentor_verification(
  p_mentor_id UUID
) RETURNS VOID AS $$
DECLARE
  v_user_id UUID;
  v_has_education BOOLEAN;
  v_has_bio BOOLEAN;
  v_has_avatar BOOLEAN;
  v_has_availability BOOLEAN;
  v_should_be_verified BOOLEAN;
BEGIN
  SELECT user_id INTO v_user_id
  FROM mentor_profiles WHERE id = p_mentor_id;

  SELECT EXISTS (
    SELECT 1 FROM mentor_education WHERE mentor_id = p_mentor_id
  ) INTO v_has_education;

  SELECT bio IS NOT NULL AND LENGTH(TRIM(bio)) > 0
  INTO v_has_bio
  FROM mentor_profiles WHERE id = p_mentor_id;

  SELECT profile_picture_url IS NOT NULL
    AND LENGTH(profile_picture_url) > 0
  INTO v_has_avatar
  FROM profiles WHERE id = v_user_id;

  SELECT EXISTS (
    SELECT 1 FROM mentor_weekly_availability
    WHERE mentor_id = p_mentor_id AND is_active = true
  ) INTO v_has_availability;

  v_should_be_verified :=
    v_has_education AND
    v_has_bio AND
    v_has_avatar AND
    v_has_availability;

  UPDATE profiles
  SET is_verified = v_should_be_verified
  WHERE id = v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- SECTION 3: TRIGGERS
-- ============================================================

-- Trigger: Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'mentee')
  );

  INSERT INTO notification_preferences (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================================

-- Trigger: Auto-verify mentor on education change
CREATE OR REPLACE FUNCTION trigger_check_verification_education()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM check_mentor_verification(
    COALESCE(NEW.mentor_id, OLD.mentor_id)
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_education_change
  AFTER INSERT OR UPDATE OR DELETE ON mentor_education
  FOR EACH ROW
  EXECUTE FUNCTION trigger_check_verification_education();

-- ============================================================

-- Trigger: Auto-verify mentor on bio change
CREATE OR REPLACE FUNCTION trigger_check_verification_bio()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM check_mentor_verification(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_mentor_bio_change
  AFTER UPDATE OF bio ON mentor_profiles
  FOR EACH ROW
  EXECUTE FUNCTION trigger_check_verification_bio();

-- ============================================================

-- Trigger: Auto-verify mentor on profile picture change
CREATE OR REPLACE FUNCTION trigger_check_verification_avatar()
RETURNS TRIGGER AS $$
DECLARE
  v_mentor_id UUID;
BEGIN
  SELECT id INTO v_mentor_id
  FROM mentor_profiles WHERE user_id = NEW.id;

  IF v_mentor_id IS NOT NULL THEN
    PERFORM check_mentor_verification(v_mentor_id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_profile_avatar_change
  AFTER UPDATE OF profile_picture_url ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION trigger_check_verification_avatar();

-- ============================================================

-- Trigger: Auto-verify mentor on availability change
CREATE OR REPLACE FUNCTION trigger_check_verification_availability()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM check_mentor_verification(
    COALESCE(NEW.mentor_id, OLD.mentor_id)
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_availability_change_verification
  AFTER INSERT OR UPDATE OR DELETE ON mentor_weekly_availability
  FOR EACH ROW
  EXECUTE FUNCTION trigger_check_verification_availability();

-- ============================================================

-- Trigger: Notify mentor on availability change
CREATE OR REPLACE FUNCTION notify_availability_change()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT user_id INTO v_user_id
  FROM mentor_profiles
  WHERE id = COALESCE(NEW.mentor_id, OLD.mentor_id);

  INSERT INTO notifications (user_id, type, title, message)
  VALUES (
    v_user_id,
    'system',
    'Availability Updated',
    'Your weekly availability has been updated. New bookings will follow this updated schedule.'
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_weekly_availability_change
  AFTER INSERT OR UPDATE OR DELETE ON mentor_weekly_availability
  FOR EACH ROW
  EXECUTE FUNCTION notify_availability_change();

-- ============================================================
-- SECTION 4: STORAGE
-- ============================================================

-- Storage bucket for profile pictures
-- Run in Supabase Storage dashboard:
-- Create bucket named 'avatars' with public access enabled

-- Storage RLS policies for avatars bucket:
CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Anyone can view avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================================
-- SECTION 5: INDEXES
-- ============================================================

CREATE INDEX idx_bookings_mentee ON bookings(mentee_id);
CREATE INDEX idx_bookings_mentor ON bookings(mentor_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);
CREATE INDEX idx_reviews_mentor ON reviews(mentor_id);
CREATE INDEX idx_payments_user ON payments(user_id);
CREATE INDEX idx_payments_booking ON payments(booking_id);
CREATE INDEX idx_chatbot_sessions_user ON chatbot_sessions(user_id);
CREATE INDEX idx_chatbot_messages_session ON chatbot_messages(session_id);

-- ============================================================
-- END OF SCHEMA
-- ============================================================