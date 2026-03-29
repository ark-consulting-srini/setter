import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export { handler as GET, handler as POST }

async function handler() {
  const supabase = createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json(
      { error: 'Not authenticated. Log in first, then visit /api/seed' },
      { status: 401 }
    )
  }

  const userId = user.id
  const today = new Date().toISOString().split('T')[0]

  function daysAgo(n: number): string {
    const d = new Date()
    d.setDate(d.getDate() - n)
    return d.toISOString()
  }

  function dateDaysAgo(n: number): string {
    const d = new Date()
    d.setDate(d.getDate() - n)
    return d.toISOString().split('T')[0]
  }

  function dateDaysFromNow(n: number): string {
    const d = new Date()
    d.setDate(d.getDate() + n)
    return d.toISOString().split('T')[0]
  }

  // 1. Update user profile
  const { error: profileError } = await supabase
    .from('users')
    .update({
      full_name: 'Roma Reddy',
      grade_level: 9,
      sport: 'volleyball',
      position: 'setter',
      college_target: 'Stanford, UCLA, or UC Berkeley — interested in STEM and Law. Troy Tech magnet program, Class of 2029.',
    })
    .eq('id', userId)

  if (profileError) {
    return NextResponse.json({ error: 'Failed to update profile', details: profileError }, { status: 500 })
  }

  // 2. Insert goals
  const { error: goalsError } = await supabase.from('goals').insert([
    { user_id: userId, title: 'Get recruited for college volleyball', description: 'Build recruiting profile, attend showcases, reach out to coaches at target schools', goal_type: 'athletic', status: 'active', target_date: '2029-06-01', progress_pct: 10 },
    { user_id: userId, title: 'Maintain 3.8+ GPA', description: 'Strong academics keep all college doors open — AP classes count more', goal_type: 'academic', status: 'active', target_date: '2029-06-01', progress_pct: 25 },
    { user_id: userId, title: 'Complete AP World History with an A', description: 'Unit 2 exam coming up — focus on Networks of Exchange', goal_type: 'academic', status: 'active', target_date: '2026-06-15', progress_pct: 40 },
    { user_id: userId, title: 'Build a community service portfolio', description: 'Volunteer at local food bank and Pehlay Akshar story recordings', goal_type: 'personal', status: 'active', target_date: '2027-01-01', progress_pct: 15 },
    { user_id: userId, title: 'Make varsity volleyball', description: 'Train hard this off-season, improve serve receive and setting consistency', goal_type: 'athletic', status: 'active', target_date: '2026-09-01', progress_pct: 30 },
    { user_id: userId, title: 'Complete Siemens Robotics Coursera course', description: 'Robotics specialization by University of Colorado Boulder — supports Robotics Club at school', goal_type: 'academic', status: 'active', target_date: '2026-06-01', progress_pct: 5 },
    { user_id: userId, title: 'Prepare for AMC 10', description: 'Register and prep for AMC 10 in sophomore year — 4+ hours per week on math competition prep', goal_type: 'academic', status: 'active', target_date: '2026-11-01', progress_pct: 0 },
  ])

  // 3. Insert completed tasks
  const { error: completedTasksError } = await supabase.from('tasks').insert([
    { user_id: userId, title: 'Read AP World History Ch. 12', category: 'school', priority: 'high', status: 'completed', due_date: dateDaysAgo(1), completed_at: daysAgo(1) },
    { user_id: userId, title: 'Finish math problem set #14', category: 'school', priority: 'medium', status: 'completed', due_date: dateDaysAgo(1), completed_at: daysAgo(1) },
    { user_id: userId, title: 'Practice setting drills — 30 min', category: 'athletic', priority: 'high', status: 'completed', due_date: dateDaysAgo(2), completed_at: daysAgo(2) },
    { user_id: userId, title: 'Write English essay rough draft', category: 'school', priority: 'high', status: 'completed', due_date: dateDaysAgo(3), completed_at: daysAgo(3) },
    { user_id: userId, title: 'Watch film on opponent serve patterns', category: 'athletic', priority: 'medium', status: 'completed', due_date: dateDaysAgo(3), completed_at: daysAgo(3) },
    { user_id: userId, title: 'Complete Coursera: Intro to American Law', category: 'college_prep', priority: 'medium', status: 'completed', due_date: dateDaysAgo(4), completed_at: daysAgo(4) },
    { user_id: userId, title: 'Read Atomic Habits and make presentation', category: 'personal', priority: 'medium', status: 'completed', due_date: dateDaysAgo(5), completed_at: daysAgo(5) },
    { user_id: userId, title: 'Record 5 stories for Pehlay Akshar', category: 'extracurricular', priority: 'low', status: 'completed', due_date: dateDaysAgo(6), completed_at: daysAgo(6) },
  ])

  // 4. Insert pending tasks
  const { error: pendingTasksError } = await supabase.from('tasks').insert([
    { user_id: userId, title: 'Study for AP World Unit 2 exam', category: 'school', priority: 'high', status: 'pending', due_date: today },
    { user_id: userId, title: 'Practice jump serve — 20 reps', category: 'athletic', priority: 'high', status: 'pending', due_date: today },
    { user_id: userId, title: 'Review college list with Dad', category: 'college_prep', priority: 'medium', status: 'pending', due_date: today },
    { user_id: userId, title: 'Finish bio lab report', category: 'school', priority: 'high', status: 'pending', due_date: dateDaysFromNow(1) },
    { user_id: userId, title: 'Start Siemens Robotics Coursera — Module 1', category: 'school', priority: 'medium', status: 'pending', due_date: dateDaysFromNow(2) },
    { user_id: userId, title: 'Research 3 colleges with D1 volleyball', category: 'college_prep', priority: 'medium', status: 'pending', due_date: dateDaysFromNow(3) },
    { user_id: userId, title: 'Read chapters 13-14 for AP World History', category: 'school', priority: 'medium', status: 'pending', due_date: dateDaysFromNow(4) },
    { user_id: userId, title: 'Record 2 more stories for Pehlay Akshar', category: 'extracurricular', priority: 'low', status: 'pending', due_date: dateDaysFromNow(7) },
    { user_id: userId, title: 'Prepare for Robotics Club competition', category: 'extracurricular', priority: 'medium', status: 'pending', due_date: dateDaysFromNow(14) },
    { user_id: userId, title: 'Register for GISTO Olympiad (March 7)', category: 'college_prep', priority: 'high', status: 'pending', due_date: dateDaysFromNow(5) },
    { user_id: userId, title: 'Work on Harvard Crimson essay draft', category: 'college_prep', priority: 'medium', status: 'pending', due_date: dateDaysFromNow(10) },
  ])

  // 5. Insert journal entries
  const { error: journalError } = await supabase.from('journal_entries').insert([
    { user_id: userId, content: "Today was a good day. We scrimmaged in practice and I felt really locked in on my sets. Coach said my decision-making is getting faster — I'm reading the block before the ball even gets to me. That felt amazing to hear. Also got my English essay draft done which was hanging over me all week. Feeling like I'm in a groove right now.", mood: 'great', prompt_used: "What's one thing you crushed today — on the court or off?", is_private: false, created_at: daysAgo(1) },
    { user_id: userId, content: "AP World is kicking my butt. The Mongol Empire stuff is interesting but there's SO much to memorize. I made flashcards for all the trade routes and I'm going to quiz myself before bed. On the bright side, volleyball open gym was fun — I worked with the middles on quick sets and we're starting to click. Wish I had more hours in the day.", mood: 'okay', prompt_used: "What's something that challenged you this week, and how did you handle it?", is_private: false, created_at: daysAgo(3) },
    { user_id: userId, content: "Finished reading Atomic Habits and started making the presentation. Some real takeaways — the idea of habit stacking is something I can use. Like after I finish homework, I do 15 min of SAT vocab. After practice, I journal. Small stuff but it adds up. Also joined Robotics Club, Debate Club, and Key Club this semester. Feels like a lot but I want to go deep in at least one of these by next year.", mood: 'good', prompt_used: "What's something you're learning — in class, in volleyball, or about yourself?", is_private: false, created_at: daysAgo(5) },
    { user_id: userId, content: "Had a rough practice today. My sets were off, nothing was connecting. Coach pulled me aside and said even the best setters have bad days — it's about how you respond tomorrow. I know she's right but it's hard not to be frustrated. Went home and watched some setting technique videos. Tomorrow I'll be better. Writing this out actually helps me let it go.", mood: 'tough', prompt_used: "Write about a time you bounced back from something tough. What helped?", is_private: false, created_at: daysAgo(8) },
    { user_id: userId, content: "Three things I'm grateful for today: 1) My teammate Sarah who always hypes me up even when I'm not feeling it. She's the best. 2) Dad making my favorite dinner after a long day. 3) Getting a 92 on my bio test — all that studying actually paid off. Sometimes I forget to appreciate the little things when I'm stressed about the big stuff.", mood: 'good', prompt_used: "What are three things you're grateful for today? Be specific.", is_private: false, created_at: daysAgo(12) },
  ])

  // 6. Insert achievements — Roma's REAL accomplishments from her profile tracker
  const { error: achievementsError } = await supabase.from('achievements').insert([
    // Auto achievements
    { user_id: userId, title: 'First Reflection', description: 'Wrote your first journal entry', source: 'auto', category: 'personal', is_portfolio_visible: false, achieved_at: dateDaysAgo(12) },
    { user_id: userId, title: 'Journaling Habit', description: 'Wrote 5 journal entries', source: 'auto', category: 'personal', is_portfolio_visible: false, achieved_at: dateDaysAgo(1) },
    { user_id: userId, title: 'Goal Setter', description: 'Set your first goal', source: 'auto', category: 'personal', is_portfolio_visible: false, achieved_at: dateDaysAgo(10) },
    { user_id: userId, title: 'Productive Day', description: 'Completed 3 tasks in a single day', source: 'auto', category: 'streak', is_portfolio_visible: false, achieved_at: dateDaysAgo(1) },

    // 7th Grade — Academic
    { user_id: userId, title: '2nd Prize — School Science Fair', description: '7th Grade: Won 2nd place at the school science fair', source: 'manual', category: 'academic', is_portfolio_visible: true, achieved_at: '2024-03-01' },
    { user_id: userId, title: '2nd Prize — OC Science Fair (Electrical & Electronics)', description: '7th Grade: Won 2nd Prize in the Orange County Science Fair – Electrical and Electronics category', source: 'manual', category: 'academic', is_portfolio_visible: true, achieved_at: '2024-04-01' },
    { user_id: userId, title: 'Nominated — Thermo Fisher Junior Innovator Challenge', description: '7th Grade: Nominated for the prestigious Thermo Fisher Science Junior Innovator Challenge', source: 'manual', category: 'academic', is_portfolio_visible: true, achieved_at: '2024-04-15' },
    { user_id: userId, title: 'Honorable Mention — California Science Fair', description: '7th Grade: Received Honorable Mention at the California Science Fair – Electronics and Electromagnetism', source: 'manual', category: 'academic', is_portfolio_visible: true, achieved_at: '2024-05-01' },

    // 7th Grade — Leadership & Sports
    { user_id: userId, title: 'ASB Events Commissioner', description: '7th Grade: Served as Events Commissioner in the School ASB (Associated Student Body)', source: 'manual', category: 'leadership', is_portfolio_visible: true, achieved_at: '2023-09-01' },
    { user_id: userId, title: 'School Debate Team Member', description: '7th Grade: Member of the school debate team', source: 'manual', category: 'academic', is_portfolio_visible: true, achieved_at: '2023-09-01' },
    { user_id: userId, title: 'School Volleyball Team', description: '7th Grade: Played for the school girls volleyball team', source: 'manual', category: 'athletic', is_portfolio_visible: true, achieved_at: '2023-09-01' },
    { user_id: userId, title: 'Pulse Volleyball Club — 13s', description: '7th Grade: Member of the 13s volleyball club — Pulse', source: 'manual', category: 'athletic', is_portfolio_visible: true, achieved_at: '2023-11-01' },

    // 8th Grade — Academic & Debate
    { user_id: userId, title: 'OC Debate League — Distinguished Speaker Award', description: '8th Grade: Earned Distinguished Speaker Award in the Orange County Debate League', source: 'manual', category: 'academic', is_portfolio_visible: true, achieved_at: '2024-10-01' },
    { user_id: userId, title: 'Best in Show — School Science Fair', description: '8th Grade: Won Best in Show and Environmental Engineering Award at the School Science Fair', source: 'manual', category: 'academic', is_portfolio_visible: true, achieved_at: '2025-01-15' },
    { user_id: userId, title: '1st Prize — OC Science Fair (Environmental Engineering)', description: '8th Grade: Won 1st Prize in the Orange County Science Fair – Environmental Engineering', source: 'manual', category: 'academic', is_portfolio_visible: true, achieved_at: '2025-03-01' },
    { user_id: userId, title: 'Hitachi Digital Earth Alliance — Sustainability Award', description: '8th Grade: Won Special Award for Hitachi Digital Earth Alliance - Sustainability Award', source: 'manual', category: 'academic', is_portfolio_visible: true, achieved_at: '2025-03-15' },
    { user_id: userId, title: 'OC Debate — Winter Classic 14th Speaker (of 300)', description: '8th Grade: Ranked 14th Speaker out of 300 at the Orange County Debate League Winter Classic', source: 'manual', category: 'academic', is_portfolio_visible: true, achieved_at: '2025-01-01' },
    { user_id: userId, title: 'OC Debate — Winter Classic Distinguished Team (of 90)', description: '8th Grade: Team earned Distinguished Team status out of 90 teams at Winter Classic', source: 'manual', category: 'academic', is_portfolio_visible: true, achieved_at: '2025-01-01' },
    { user_id: userId, title: 'OC Debate — Spring Tournament 12th Speaker (of 320)', description: '8th Grade: Ranked 12th Speaker out of 320 at the OC Debate League Spring Tournament', source: 'manual', category: 'academic', is_portfolio_visible: true, achieved_at: '2025-04-01' },
    { user_id: userId, title: 'OC Debate — National Championship Distinguished Speaker', description: '8th Grade: Earned Distinguished Speaker Award at the OC Debate League National Championship', source: 'manual', category: 'academic', is_portfolio_visible: true, achieved_at: '2025-05-01' },
    { user_id: userId, title: 'OC Debate — National Championship Distinguished Team', description: '8th Grade: Team earned Distinguished Team Award at National Championship', source: 'manual', category: 'academic', is_portfolio_visible: true, achieved_at: '2025-05-01' },

    // 8th Grade — Leadership & Sports
    { user_id: userId, title: 'ASB Events Commissioner — 2nd Year', description: '8th Grade: Continued serving as Events Commissioner in the School ASB', source: 'manual', category: 'leadership', is_portfolio_visible: true, achieved_at: '2024-09-01' },
    { user_id: userId, title: 'Volleyball Club Captain — Oahu 15s', description: '8th Grade: Team Captain of the 15s volleyball club – Oahu', source: 'manual', category: 'leadership', is_portfolio_visible: true, achieved_at: '2024-11-01' },
    { user_id: userId, title: 'School Volleyball Team — 8th Grade', description: '8th Grade: Played for the school girls volleyball team', source: 'manual', category: 'athletic', is_portfolio_visible: true, achieved_at: '2024-09-01' },
    { user_id: userId, title: 'School Basketball Team', description: '8th Grade: Played for the school girls basketball team', source: 'manual', category: 'athletic', is_portfolio_visible: true, achieved_at: '2024-12-01' },

    // 9th Grade — Current
    { user_id: userId, title: 'Troy High School Cyber Basic Summer Camp', description: '9th Grade: Attended Troy High School Cyber Basic Summer Camp', source: 'manual', category: 'academic', is_portfolio_visible: true, achieved_at: '2025-07-01' },
    { user_id: userId, title: 'Completed Coursera: Intro to American Law', description: '9th Grade: Completed full Coursera course on Introduction to American Law', source: 'manual', category: 'academic', is_portfolio_visible: true, achieved_at: '2025-11-01' },
    { user_id: userId, title: 'Joined Robotics Club, Debate Club, Key Club', description: '9th Grade: Active member of Robotics Club (lunch + afterschool), Debate Club (weekly), and Key Club (service org)', source: 'manual', category: 'leadership', is_portfolio_visible: true, achieved_at: '2025-09-15' },
    { user_id: userId, title: 'Pehlay Akshar — Story Recordings', description: '9th Grade: Recording stories for Pehlay Akshar — A Story A Day literacy initiative', source: 'manual', category: 'community', is_portfolio_visible: true, achieved_at: '2025-10-01' },
  ])

  const errors = [profileError, goalsError, completedTasksError, pendingTasksError, journalError, achievementsError].filter(Boolean)

  if (errors.length > 0) {
    return NextResponse.json({ error: 'Some inserts failed', details: errors }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    seeded: {
      profile: 'Roma Reddy, 9th grade, Troy High School, volleyball setter',
      goals: 7,
      tasks: '8 completed + 11 pending',
      journal_entries: 5,
      achievements: '4 auto + 26 real accomplishments from 7th-9th grade',
    },
  })
}
