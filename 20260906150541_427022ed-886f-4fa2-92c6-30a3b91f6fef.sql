CREATE TABLE public.projects (
  project_id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  genre_and_rules TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT ALL ON public.projects TO service_role;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own projects" ON public.projects FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TYPE public.bible_category AS ENUM ('character','location','lore_rule','unresolved_plot');

CREATE TABLE public.story_bible (
  entity_id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(project_id) ON DELETE CASCADE,
  category public.bible_category NOT NULL DEFAULT 'character',
  name TEXT NOT NULL,
  current_state JSONB NOT NULL DEFAULT '{}'::jsonb,
  secrets_and_history TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.story_bible TO authenticated;
GRANT ALL ON public.story_bible TO service_role;
ALTER TABLE public.story_bible ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own bible" ON public.story_bible FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.projects p WHERE p.project_id = story_bible.project_id AND p.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.projects p WHERE p.project_id = story_bible.project_id AND p.user_id = auth.uid()));

CREATE TABLE public.episodes (
  episode_id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(project_id) ON DELETE CASCADE,
  episode_number INTEGER NOT NULL DEFAULT 1,
  title TEXT NOT NULL DEFAULT 'Untitled',
  raw_text TEXT NOT NULL DEFAULT '',
  cliffhanger_state TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.episodes TO authenticated;
GRANT ALL ON public.episodes TO service_role;
ALTER TABLE public.episodes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own episodes" ON public.episodes FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.projects p WHERE p.project_id = episodes.project_id AND p.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.projects p WHERE p.project_id = episodes.project_id AND p.user_id = auth.uid()));

CREATE INDEX idx_bible_project ON public.story_bible(project_id);
CREATE INDEX idx_episodes_project ON public.episodes(project_id, episode_number);

CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;
CREATE TRIGGER story_bible_touch BEFORE UPDATE ON public.story_bible FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();