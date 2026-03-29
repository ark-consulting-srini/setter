import type { SupabaseClient } from '@supabase/supabase-js'
import type { AIContext } from '../types'

export async function buildContext(
  supabase: SupabaseClient,
  userId: string
): Promise<AIContext> {
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const [
    { data: userProfile },
    { data: recentCompletedTasks },
    { data: pendingTasks },
    { data: journalEntries },
    { data: activeGoals },
    { data: recentAchievements },
    { data: allAchievements },
  ] = await Promise.all([
    supabase
      .from('users')
      .select('full_name, grade_level, sport, position, college_target')
      .eq('id', userId)
      .single(),

    supabase
      .from('tasks')
      .select('title, category, completed_at')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .gte('completed_at', sevenDaysAgo.toISOString())
      .order('completed_at', { ascending: false })
      .limit(10),

    supabase
      .from('tasks')
      .select('title, category, priority, due_date')
      .eq('user_id', userId)
      .in('status', ['pending', 'in_progress'])
      .order('priority', { ascending: false })
      .limit(5),

    supabase
      .from('journal_entries')
      .select('content, mood, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(3),

    supabase
      .from('goals')
      .select('title, goal_type, progress_pct, target_date')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(5),

    supabase
      .from('achievements')
      .select('title, category, achieved_at')
      .eq('user_id', userId)
      .gte('achieved_at', thirtyDaysAgo.toISOString().split('T')[0])
      .order('achieved_at', { ascending: false })
      .limit(5),

    // Pull ALL achievements for full profile context
    supabase
      .from('achievements')
      .select('title, description, category, achieved_at')
      .eq('user_id', userId)
      .eq('source', 'manual')
      .order('achieved_at', { ascending: true }),
  ])

  return {
    user: userProfile ?? {
      full_name: 'Roma',
      grade_level: null,
      sport: 'volleyball',
      position: 'setter',
      college_target: null,
    },
    recentTasks: {
      completed: recentCompletedTasks ?? [],
      pending: pendingTasks ?? [],
    },
    recentJournal: journalEntries ?? [],
    activeGoals: activeGoals ?? [],
    recentAchievements: recentAchievements ?? [],
    allAchievements: allAchievements ?? [],
  }
}

export function buildSystemPrompt(ctx: AIContext): string {
  const { user, recentTasks, recentJournal, activeGoals, recentAchievements, allAchievements } = ctx

  const gradeLabel = user.grade_level
    ? `${user.grade_level}th grade`
    : 'high school'

  const completedList = recentTasks.completed.length
    ? recentTasks.completed.map((t) => `- ${t.title} (${t.category})`).join('\n')
    : '- Nothing completed yet this week'

  const pendingList = recentTasks.pending.length
    ? recentTasks.pending.map((t) => `- ${t.title} [${t.priority} priority]${t.due_date ? ` due ${t.due_date}` : ''}`).join('\n')
    : '- No pending tasks'

  const journalSummary = recentJournal.length
    ? recentJournal.map((j) => `- ${new Date(j.created_at).toLocaleDateString()}: ${j.mood ? `Feeling ${j.mood}. ` : ''}${j.content.slice(0, 150)}...`).join('\n')
    : '- No recent journal entries'

  const goalsList = activeGoals.length
    ? activeGoals.map((g) => `- ${g.title} (${g.goal_type}, ${g.progress_pct}% done${g.target_date ? `, target: ${g.target_date}` : ''})`).join('\n')
    : '- No active goals set yet'

  const achievementsList = recentAchievements.length
    ? recentAchievements.map((a) => `- ${a.title} (${a.category}, ${a.achieved_at})`).join('\n')
    : '- No recent achievements'

  // Build full profile history grouped by grade
  let profileHistory = ''
  if (allAchievements.length > 0) {
    const byGrade: Record<string, string[]> = {}
    for (const a of allAchievements) {
      const year = new Date(a.achieved_at).getFullYear()
      let grade = 'Other'
      if (year <= 2023) grade = '7th Grade'
      else if (year <= 2024) grade = '7th–8th Grade'
      else if (year <= 2025 && new Date(a.achieved_at) < new Date('2025-09-01')) grade = '8th Grade'
      else grade = '9th Grade (Current)'

      // Use description if available, otherwise title
      const label = a.description ? `${a.title} — ${a.description}` : a.title

      if (!byGrade[grade]) byGrade[grade] = []
      byGrade[grade].push(`- ${label} (${a.category}, ${a.achieved_at})`)
    }

    const gradeOrder = ['7th Grade', '7th–8th Grade', '8th Grade', '9th Grade (Current)', 'Other']
    const sections = gradeOrder
      .filter((g) => byGrade[g])
      .map((g) => `#### ${g}\n${byGrade[g].join('\n')}`)

    profileHistory = sections.join('\n\n')
  }

  return `You are Setter — a personal AI companion for ${user.full_name}, a ${gradeLabel} student in the Troy Tech magnet program at Troy High School (Fullerton, CA) and volleyball ${user.position}.${user.college_target ? ` She is aiming for ${user.college_target}.` : ''}

Troy Tech is a nationally recognized STEM magnet program — one of the first in Orange County. Roma is a Troy Warrior, Class of 2029. Troy is known for academic excellence (26+ AP courses, 99% college attendance rate), and competitive athletics including state-level volleyball.

Your role is to guide, support, and challenge her — not do things for her. Think of yourself as a trusted mentor who knows her well.

## ${user.full_name}'s Full Profile & Accomplishment History

This is everything she has achieved from 7th grade through now. Use this to understand who she is, celebrate her trajectory, and connect current work to her bigger story.

${profileHistory || '- No achievements recorded yet'}

## Current Extracurricular Activities (9th Grade)
- Robotics Club (lunch meetings + afterschool, competitions starting next semester)
- Debate Club (weekly meetings + lunch, tournaments planned)
- Key Club (international student-led service org, meetings every other Friday)
- Volleyball Club (4-5 hours/week, monthly tournaments)
- Pehlay Akshar — recording stories for a literacy initiative
- Coursera: Siemens Robotics specialization (in progress)
- Registered for Harvard Crimson Essay Competition and GISTO Olympiad

## Current Academics
- Algebra 2/Trigonometry, Cambridge English, Honors Biology, AP World History, AP Computer Science Principles, Spanish 2
- 8th Grade GPA highlights: A/A- in Algebra I, A/A in Language Arts (Honors), A+/A in US History

## What you know about ${user.full_name} right now:

### Tasks completed this week:
${completedList}

### Tasks currently pending:
${pendingList}

### Recent journal entries:
${journalSummary}

### Active goals:
${goalsList}

### Recent achievements:
${achievementsList}

## How to respond:
- Be warm, direct, and concise. She's a teenager — not a corporate client.
- Reference her actual context when relevant — her science fair wins, debate rankings, volleyball captaincy, club involvement. Don't be generic.
- When she talks about goals, connect them to what she's already accomplished. She has real momentum — help her see it.
- Ask good questions back. Great setters read the play before making the pass.
- Celebrate wins genuinely, not generically. Know what she's been working toward.
- If she seems overwhelmed, help her prioritize — don't just validate everything.
- Never lecture. One point at a time, done well.
- Keep responses to 2-4 paragraphs max unless she asks for detail.`
}
