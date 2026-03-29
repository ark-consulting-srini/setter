-- ============================================
-- Setter App — Seed Data for Roma
-- Run this AFTER signing up as Roma in the app
-- ============================================

-- Get Roma's user ID (first user in the system)
DO $$
DECLARE
  roma_id uuid;
BEGIN
  SELECT id INTO roma_id FROM public.users LIMIT 1;

  IF roma_id IS NULL THEN
    RAISE EXCEPTION 'No user found. Sign up in the app first, then run this seed.';
  END IF;

  -- Update Roma's profile
  UPDATE public.users SET
    full_name = 'Roma Kandala',
    grade_level = 9,
    sport = 'volleyball',
    position = 'setter',
    college_target = 'Stanford or UCLA'
  WHERE id = roma_id;

  -- ============================================
  -- GOALS
  -- ============================================
  INSERT INTO public.goals (user_id, title, description, goal_type, status, target_date, progress_pct) VALUES
    (roma_id, 'Get recruited for college volleyball', 'Build recruiting profile, attend showcases, reach out to coaches at target schools', 'athletic', 'active', '2029-06-01', 10),
    (roma_id, 'Maintain 3.8+ GPA', 'Strong academics keep all college doors open — AP classes count more', 'academic', 'active', '2029-06-01', 25),
    (roma_id, 'Complete AP World History with an A', 'Unit 2 exam coming up — focus on Networks of Exchange', 'academic', 'active', '2026-06-15', 40),
    (roma_id, 'Build a community service portfolio', 'Volunteer at local food bank and organize a youth volleyball clinic', 'personal', 'active', '2027-01-01', 15),
    (roma_id, 'Make varsity volleyball', 'Train hard this off-season, improve serve receive and setting consistency', 'athletic', 'active', '2026-09-01', 30);

  -- ============================================
  -- TASKS — mix of completed, pending, and upcoming
  -- ============================================

  -- Completed tasks (last 7 days)
  INSERT INTO public.tasks (user_id, title, category, priority, status, due_date, completed_at) VALUES
    (roma_id, 'Read AP World History Ch. 12', 'school', 'high', 'completed', CURRENT_DATE - 1, NOW() - INTERVAL '1 day'),
    (roma_id, 'Finish math problem set #14', 'school', 'medium', 'completed', CURRENT_DATE - 1, NOW() - INTERVAL '1 day'),
    (roma_id, 'Practice setting drills — 30 min', 'athletic', 'high', 'completed', CURRENT_DATE - 2, NOW() - INTERVAL '2 days'),
    (roma_id, 'Write English essay rough draft', 'school', 'high', 'completed', CURRENT_DATE - 3, NOW() - INTERVAL '3 days'),
    (roma_id, 'Watch film on opponent serve patterns', 'athletic', 'medium', 'completed', CURRENT_DATE - 3, NOW() - INTERVAL '3 days'),
    (roma_id, 'Update volleyball highlight reel', 'college_prep', 'medium', 'completed', CURRENT_DATE - 4, NOW() - INTERVAL '4 days'),
    (roma_id, 'Organize study group for bio test', 'school', 'medium', 'completed', CURRENT_DATE - 5, NOW() - INTERVAL '5 days'),
    (roma_id, 'Volunteer at food bank — 2 hours', 'extracurricular', 'low', 'completed', CURRENT_DATE - 6, NOW() - INTERVAL '6 days');

  -- Pending tasks (today and upcoming)
  INSERT INTO public.tasks (user_id, title, category, priority, status, due_date) VALUES
    (roma_id, 'Study for AP World Unit 2 exam', 'school', 'high', 'pending', CURRENT_DATE),
    (roma_id, 'Practice jump serve — 20 reps', 'athletic', 'high', 'pending', CURRENT_DATE),
    (roma_id, 'Review college list with Dad', 'college_prep', 'medium', 'pending', CURRENT_DATE),
    (roma_id, 'Finish bio lab report', 'school', 'high', 'pending', CURRENT_DATE + 1),
    (roma_id, 'Email Coach Martinez about summer camp', 'athletic', 'medium', 'pending', CURRENT_DATE + 2),
    (roma_id, 'Research 3 colleges with D1 volleyball', 'college_prep', 'medium', 'pending', CURRENT_DATE + 3),
    (roma_id, 'Read chapters 13-14 for history', 'school', 'medium', 'pending', CURRENT_DATE + 4),
    (roma_id, 'Plan youth volleyball clinic logistics', 'extracurricular', 'low', 'pending', CURRENT_DATE + 7),
    (roma_id, 'Journal about season goals', 'personal', 'low', 'pending', CURRENT_DATE + 2),
    (roma_id, 'SAT vocab review — 30 words', 'college_prep', 'medium', 'pending', CURRENT_DATE + 5);

  -- ============================================
  -- JOURNAL ENTRIES
  -- ============================================
  INSERT INTO public.journal_entries (user_id, content, mood, prompt_used, is_private, created_at) VALUES
    (roma_id,
     'Today was a good day. We scrimmaged in practice and I felt really locked in on my sets. Coach said my decision-making is getting faster — I''m reading the block before the ball even gets to me. That felt amazing to hear. Also got my English essay draft done which was hanging over me all week. Feeling like I''m in a groove right now.',
     'great',
     'What''s one thing you crushed today — on the court or off?',
     false,
     NOW() - INTERVAL '1 day'),

    (roma_id,
     'AP World is kicking my butt. The Mongol Empire stuff is interesting but there''s SO much to memorize. I made flashcards for all the trade routes and I''m going to quiz myself before bed. On the bright side, volleyball open gym was fun — I worked with the middles on quick sets and we''re starting to click. Wish I had more hours in the day.',
     'okay',
     'What''s something that challenged you this week, and how did you handle it?',
     false,
     NOW() - INTERVAL '3 days'),

    (roma_id,
     'Thinking about what kind of college experience I want. Stanford would be incredible but it''s a reach. UCLA feels more realistic and they have an amazing volleyball program. Dad says to aim high and have backups. I think he''s right. I need to start building my recruiting profile this summer. Made a list of 5 coaches to email. Feeling nervous but excited.',
     'good',
     'What''s one goal you''re working toward right now? How does it feel?',
     false,
     NOW() - INTERVAL '5 days'),

    (roma_id,
     'Had a rough practice today. My sets were off, nothing was connecting. Coach pulled me aside and said even the best setters have bad days — it''s about how you respond tomorrow. I know she''s right but it''s hard not to be frustrated. Went home and watched some setting technique videos. Tomorrow I''ll be better. Writing this out actually helps me let it go.',
     'tough',
     'Write about a time you bounced back from something tough. What helped?',
     false,
     NOW() - INTERVAL '8 days'),

    (roma_id,
     'Three things I''m grateful for today: 1) My teammate Sarah who always hypes me up even when I''m not feeling it. She''s the best. 2) Dad making my favorite dinner after a long day. 3) Getting a 92 on my bio test — all that studying actually paid off. Sometimes I forget to appreciate the little things when I''m stressed about the big stuff.',
     'good',
     'What are three things you''re grateful for today? Be specific.',
     false,
     NOW() - INTERVAL '12 days');

  -- ============================================
  -- ACHIEVEMENTS
  -- ============================================
  INSERT INTO public.achievements (user_id, title, description, source, category, is_portfolio_visible, achieved_at) VALUES
    (roma_id, 'First Reflection', 'Wrote your first journal entry', 'auto', 'personal', false, CURRENT_DATE - 12),
    (roma_id, 'Journaling Habit', 'Wrote 5 journal entries', 'auto', 'personal', false, CURRENT_DATE - 1),
    (roma_id, 'Goal Setter', 'Set your first goal', 'auto', 'personal', false, CURRENT_DATE - 10),
    (roma_id, 'Productive Day', 'Completed 3 tasks in a single day', 'auto', 'streak', false, CURRENT_DATE - 1),
    (roma_id, 'JV Volleyball — Starting Setter', 'Named starting setter for the JV team', 'manual', 'athletic', true, CURRENT_DATE - 30),
    (roma_id, 'Honor Roll — Fall Semester', 'Achieved 3.85 GPA in first semester of 9th grade', 'manual', 'academic', true, CURRENT_DATE - 60),
    (roma_id, 'AP World History — Chapter Award', 'Highest score on Unit 1 exam in class', 'manual', 'academic', true, CURRENT_DATE - 45),
    (roma_id, 'Food Bank Volunteer — 10 Hours', 'Completed 10 hours of community service at local food bank', 'manual', 'community', true, CURRENT_DATE - 20),
    (roma_id, 'Youth Volleyball Clinic Organizer', 'Co-organized a volleyball clinic for elementary school kids', 'manual', 'leadership', true, CURRENT_DATE - 15);

END $$;
