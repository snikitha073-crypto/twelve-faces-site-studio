-- Profiles: one per (anonymous) auth user. Score/league columns are server-managed only.
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL CHECK (char_length(btrim(display_name)) BETWEEN 1 AND 40),
  username text NOT NULL CHECK (username ~ '^[a-z0-9_]{3,20}$'),
  avatar_url text CHECK (avatar_url IS NULL OR char_length(avatar_url) <= 600),
  show_on_leaderboard boolean NOT NULL DEFAULT false,
  league text NOT NULL DEFAULT 'bronze' CHECK (league IN ('bronze','silver','gold')),
  points integer NOT NULL DEFAULT 0,
  debates_completed integer NOT NULL DEFAULT 0,
  avg_score numeric(5,2) NOT NULL DEFAULT 0,
  recent_avg_score numeric(5,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX profiles_username_unique ON public.profiles (lower(username));

-- Users may only write their own editable fields; league/points/stats are never client-writable.
GRANT SELECT ON public.profiles TO authenticated;
GRANT INSERT (id, display_name, username, avatar_url, show_on_leaderboard) ON public.profiles TO authenticated;
GRANT UPDATE (display_name, username, avatar_url, show_on_leaderboard) ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users create own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;
CREATE TRIGGER profiles_touch_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Debates
CREATE TABLE public.debates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  character_id text NOT NULL CHECK (character_id IN ('strategist','scientist','skeptic','futurist','ethicist','creative')),
  topic text NOT NULL CHECK (char_length(btrim(topic)) BETWEEN 3 AND 300),
  topic_description text CHECK (topic_description IS NULL OR char_length(topic_description) <= 600),
  category text CHECK (category IS NULL OR char_length(category) <= 60),
  is_custom boolean NOT NULL DEFAULT false,
  position text NOT NULL CHECK (position IN ('for','against')),
  difficulty text NOT NULL CHECK (difficulty IN ('easy','medium','hard')),
  mode text NOT NULL CHECK (mode IN ('quick','unlimited')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed')),
  messages jsonb NOT NULL DEFAULT '[]'::jsonb,
  rounds_completed integer NOT NULL DEFAULT 0,
  evaluation jsonb,
  score integer,
  points_awarded integer,
  duration_seconds integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);
CREATE INDEX debates_user_created_idx ON public.debates (user_id, created_at DESC);

-- Users may start debates for themselves; transcript, scores and status are server-written only.
GRANT SELECT ON public.debates TO authenticated;
GRANT INSERT (user_id, character_id, topic, topic_description, category, is_custom, position, difficulty, mode) ON public.debates TO authenticated;
GRANT ALL ON public.debates TO service_role;
ALTER TABLE public.debates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own debates" ON public.debates FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users start own debates" ON public.debates FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid()));

-- Presence heartbeat for the signed-in user only
CREATE OR REPLACE FUNCTION public.touch_presence()
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.profiles SET last_seen_at = now() WHERE id = auth.uid();
$$;
REVOKE ALL ON FUNCTION public.touch_presence() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.touch_presence() TO authenticated;

-- Public leaderboard: only opted-in users, only public fields
CREATE OR REPLACE FUNCTION public.get_leaderboard(_league text, _limit integer DEFAULT 50)
RETURNS TABLE (
  rank bigint,
  profile_id uuid,
  display_name text,
  username text,
  avatar_url text,
  league text,
  points integer,
  debates_completed integer,
  avg_score numeric
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    row_number() OVER (ORDER BY p.points DESC, p.avg_score DESC, p.created_at ASC) AS rank,
    p.id, p.display_name, p.username, p.avatar_url, p.league, p.points, p.debates_completed, p.avg_score
  FROM public.profiles p
  WHERE p.show_on_leaderboard = true
    AND p.league = _league
  ORDER BY p.points DESC, p.avg_score DESC, p.created_at ASC
  LIMIT LEAST(GREATEST(COALESCE(_limit, 50), 1), 100);
$$;
REVOKE ALL ON FUNCTION public.get_leaderboard(text, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_leaderboard(text, integer) TO anon, authenticated;

-- Owner login throttling (server-only)
CREATE TABLE public.admin_login_attempts (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ip text NOT NULL,
  success boolean NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX admin_login_attempts_ip_idx ON public.admin_login_attempts (ip, created_at DESC);
GRANT ALL ON public.admin_login_attempts TO service_role;
ALTER TABLE public.admin_login_attempts ENABLE ROW LEVEL SECURITY;

-- Avatar uploads: public read, each user writes only inside their own folder
CREATE POLICY "Avatar images are public" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users upload own avatar" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users update own avatar" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users delete own avatar" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
