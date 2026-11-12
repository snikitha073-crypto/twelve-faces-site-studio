REVOKE ALL ON public.profiles FROM anon, authenticated;
GRANT SELECT ON public.profiles TO authenticated;
GRANT INSERT (id, display_name, username, avatar_url, show_on_leaderboard) ON public.profiles TO authenticated;
GRANT UPDATE (display_name, username, avatar_url, show_on_leaderboard) ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

REVOKE ALL ON public.debates FROM anon, authenticated;
GRANT SELECT ON public.debates TO authenticated;
GRANT INSERT (user_id, character_id, topic, topic_description, category, is_custom, position, difficulty, mode) ON public.debates TO authenticated;
GRANT ALL ON public.debates TO service_role;

REVOKE ALL ON public.admin_login_attempts FROM anon, authenticated;
GRANT ALL ON public.admin_login_attempts TO service_role;