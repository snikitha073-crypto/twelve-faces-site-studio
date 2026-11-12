-- Avatars are stored inline as a preset key or a small downscaled image (no public file bucket).
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_avatar_url_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_avatar_url_check CHECK (
  avatar_url IS NULL
  OR (avatar_url ~ '^preset:[a-z0-9-]{1,40}$')
  OR (avatar_url LIKE 'data:image/%' AND char_length(avatar_url) <= 150000)
);
DROP POLICY IF EXISTS "Avatar images are public" ON storage.objects;
DROP POLICY IF EXISTS "Users upload own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users delete own avatar" ON storage.objects;
