-- Optional low-risk demo seed data for Vinson's Personal Dashboard.
-- Replace VINSON_AUTH_USER_UUID with Vinson's real Supabase Auth user UUID before running.
-- Do not include service role keys, passwords, raw Mika transcripts, private metaphysics data,
-- immigration records, or medical diagnosis content in seed data.

insert into public.dashboard_allowed_users (user_id, email)
values ('VINSON_AUTH_USER_UUID', 'your-login-email@example.com')
on conflict (user_id) do update set email = excluded.email;

insert into public.english_focus_cards (
  user_id,
  current_focus,
  cefr,
  tags,
  review_sentences
) values (
  'VINSON_AUTH_USER_UUID',
  'Say one complete chain before expanding: problem -> because -> if -> future action.',
  'B1 stable',
  array['because', 'if', 'I will', 'I would', 'I may need to'],
  array[
    'If the restaurant is closed, I will change the plan.',
    'If the restaurant was closed, I would change the plan.',
    'It matters because the feeling is different when I am on a date.',
    'If there is a delay, I may need to prepare more options.',
    'Next time, I will check in advance.'
  ]
);

insert into public.english_problem_tracker (
  user_id,
  problem,
  status,
  latest_evidence,
  improvement_condition
) values
(
  'VINSON_AUTH_USER_UUID',
  'Answer stops after the main idea',
  'Active',
  'Demo: main idea appears first, but the full chain still needs deliberate practice.',
  'Main answers include problem, reason, consequence, and next action without prompting.'
),
(
  'VINSON_AUTH_USER_UUID',
  'Cause-and-effect linking',
  'Improving',
  'Demo: because, if, and so are useful but still need cleaner grammar.',
  'Use because, if, and so in one short answer.'
),
(
  'VINSON_AUTH_USER_UUID',
  'Future action forms',
  'Active',
  'Demo: remember base verb after will.',
  'Use base verb after will: I will check, we will do it.'
);

insert into public.english_sessions (
  user_id,
  session_date,
  topic,
  cefr,
  main_bottleneck,
  improvement,
  next_focus
) values
(
  'VINSON_AUTH_USER_UUID',
  current_date,
  'Full answer chain',
  'B1 stable',
  'Answer can stop after the main idea.',
  'Produced practical solutions in demo practice.',
  'Say problem, reason, if-condition, and future action in one pass.'
),
(
  'VINSON_AUTH_USER_UUID',
  current_date - 1,
  'Recovery phrase use',
  'B1 stable',
  'Needs a repair phrase before waiting for help.',
  'Used Let me say that another way independently.',
  'Use one recovery phrase before Mika gives help.'
);

insert into public.fitness_daily_entries (
  user_id,
  entry_date,
  bodyweight_kg,
  training_status,
  training_content,
  protein,
  carbs_food,
  sleep_hours,
  energy_score,
  notes
) values
(
  'VINSON_AUTH_USER_UUID',
  current_date,
  58.3,
  'rest',
  '',
  'eggs, milk, chicken',
  'rice and banana',
  6.5,
  3,
  'Demo recovery day.'
),
(
  'VINSON_AUTH_USER_UUID',
  current_date - 1,
  58.2,
  'trained',
  'Plan A demo session',
  'chicken and milk',
  'rice two bowls',
  7.0,
  4,
  'Demo trained day.'
);

insert into public.fitness_plan_targets (
  user_id,
  title,
  status,
  detail,
  sort_order
) values
(
  'VINSON_AUTH_USER_UUID',
  'Plan A',
  'Upper body',
  'Keep push-ups controlled and improve biceps third set by 1-2 reps when recovery is good.',
  10
),
(
  'VINSON_AUTH_USER_UUID',
  'Plan B',
  'Lower + core',
  'Keep squat and hinge baseline; control leg raise lowering before adding reps.',
  20
),
(
  'VINSON_AUTH_USER_UUID',
  'Nutrition',
  'Gain phase',
  'Training day: protein plus one carb serving after workout or at the next meal.',
  30
);
