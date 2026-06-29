-- Keep the manual Jessica review loop on the minimum Data API privileges.
-- Apply after 006_jessica_review_loop.sql.

revoke all on public.jessica_review_cycles, public.fitness_exercise_targets from authenticated;
grant select, insert, update, delete
on public.jessica_review_cycles, public.fitness_exercise_targets
to authenticated;

