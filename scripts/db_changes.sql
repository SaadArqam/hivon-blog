-- Add reply support to comments
ALTER TABLE public.comments 
ADD COLUMN IF NOT EXISTS reply_to_id uuid 
REFERENCES public.comments(id) ON DELETE CASCADE;

-- Add likes table
CREATE TABLE IF NOT EXISTS public.likes (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(post_id, user_id)
);

ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Anyone can view likes"
  ON public.likes FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Logged in users can like"
  ON public.likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can unlike"
  ON public.likes FOR DELETE
  USING (auth.uid() = user_id);
