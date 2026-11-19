-- RLS / column permissions for essay practice and spaced flashcards.
alter table public.essay_submissions enable row level security;
revoke all on table public.essay_submissions from public, anon, authenticated;
grant select on table public.essay_submissions to authenticated;
grant insert (user_id, exam_id, prompt, text_content, line_count)
  on public.essay_submissions to authenticated;
grant update (prompt, text_content, line_count)
  on public.essay_submissions to authenticated;

drop policy if exists "User manages own essays" on public.essay_submissions;
drop policy if exists "Users can read own essays" on public.essay_submissions;
drop policy if exists "Users can create own essays" on public.essay_submissions;
drop policy if exists "Users can update own essay drafts" on public.essay_submissions;
create policy "Users can read own essays"
  on public.essay_submissions for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Users can create own essays"
  on public.essay_submissions for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "Users can update own essay drafts"
  on public.essay_submissions for update to authenticated
  using ((select auth.uid()) = user_id and status = 'rascunho')
  with check ((select auth.uid()) = user_id and status = 'rascunho');

alter table public.flashcards enable row level security;
revoke all on table public.flashcards from public, anon, authenticated;
grant select on table public.flashcards to authenticated;
drop policy if exists "Authenticated read published flashcards" on public.flashcards;
drop policy if exists "Authenticated can read published flashcards" on public.flashcards;
create policy "Authenticated can read published flashcards"
  on public.flashcards for select to authenticated
  using (is_published = true);

alter table public.flashcard_reviews enable row level security;
revoke all on table public.flashcard_reviews from public, anon, authenticated;
grant select, insert on table public.flashcard_reviews to authenticated;
drop policy if exists "User manages own flashcard reviews" on public.flashcard_reviews;
drop policy if exists "Users can read own flashcard reviews" on public.flashcard_reviews;
drop policy if exists "Users can create own flashcard reviews" on public.flashcard_reviews;
create policy "Users can read own flashcard reviews"
  on public.flashcard_reviews for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Users can create own flashcard reviews"
  on public.flashcard_reviews for insert to authenticated
  with check ((select auth.uid()) = user_id);

alter table public.ai_tutor_usage
  add column if not exists request_type text not null default 'tutor'
  check (request_type = any (array['tutor'::text, 'essay'::text]));

alter table public.ai_tutor_usage enable row level security;
revoke all on table public.ai_tutor_usage from public, anon, authenticated;
drop policy if exists "No direct access to tutor usage" on public.ai_tutor_usage;
create policy "No direct access to tutor usage"
  on public.ai_tutor_usage for all to anon, authenticated
  using (false) with check (false);

create unique index if not exists flashcards_one_starter_card_per_topic_idx
  on public.flashcards(topic_id);
