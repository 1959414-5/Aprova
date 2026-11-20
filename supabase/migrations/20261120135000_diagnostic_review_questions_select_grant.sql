-- Allow authenticated users to load the review for their saved diagnostic.
-- RLS policy "Authenticated read published questions" limits visibility to published questions.
GRANT SELECT ON TABLE public.questions TO authenticated;
