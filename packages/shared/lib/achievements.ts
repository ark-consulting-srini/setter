import type { SupabaseClient } from '@supabase/supabase-js'
import type { AchievementCategory } from '../types'

interface AchievementTrigger {
  id: string
  title: string
  description: string
  category: AchievementCategory
  check: (supabase: SupabaseClient, userId: string) => Promise<boolean>
}

const TRIGGERS: AchievementTrigger[] = [
  {
    id: 'productive_day',
    title: 'Productive Day',
    description: 'Completed 3 tasks in a single day',
    category: 'streak',
    check: async (supabase, userId) => {
      const today = new Date().toISOString().split('T')[0]
      const { count } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'completed')
        .gte('completed_at', `${today}T00:00:00`)
        .lte('completed_at', `${today}T23:59:59`)
      return (count ?? 0) >= 3
    },
  },
  {
    id: 'week_streak',
    title: 'Week Streak',
    description: 'Completed at least one task every day for 7 days',
    category: 'streak',
    check: async (supabase, userId) => {
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
      const { data } = await supabase
        .from('tasks')
        .select('completed_at')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .gte('completed_at', sevenDaysAgo.toISOString())
      if (!data) return false
      const uniqueDays = new Set(
        data.map((t) => new Date(t.completed_at!).toISOString().split('T')[0])
      )
      return uniqueDays.size >= 7
    },
  },
  {
    id: 'first_reflection',
    title: 'First Reflection',
    description: 'Wrote your first journal entry',
    category: 'personal',
    check: async (supabase, userId) => {
      const { count } = await supabase
        .from('journal_entries')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
      return (count ?? 0) >= 1
    },
  },
  {
    id: 'journaling_habit',
    title: 'Journaling Habit',
    description: 'Wrote 5 journal entries',
    category: 'personal',
    check: async (supabase, userId) => {
      const { count } = await supabase
        .from('journal_entries')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
      return (count ?? 0) >= 5
    },
  },
  {
    id: 'goal_setter',
    title: 'Goal Setter',
    description: 'Set your first goal',
    category: 'personal',
    check: async (supabase, userId) => {
      const { count } = await supabase
        .from('goals')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
      return (count ?? 0) >= 1
    },
  },
]

export async function checkAchievements(
  supabase: SupabaseClient,
  userId: string
): Promise<string[]> {
  const { data: existing } = await supabase
    .from('achievements')
    .select('title')
    .eq('user_id', userId)
    .eq('source', 'auto')

  const existingTitles = new Set((existing ?? []).map((a) => a.title))
  const unlocked: string[] = []

  for (const trigger of TRIGGERS) {
    if (existingTitles.has(trigger.title)) continue

    const earned = await trigger.check(supabase, userId)
    if (!earned) continue

    await supabase.from('achievements').insert({
      user_id: userId,
      title: trigger.title,
      description: trigger.description,
      category: trigger.category,
      source: 'auto',
      achieved_at: new Date().toISOString().split('T')[0],
    })

    unlocked.push(trigger.title)
  }

  return unlocked
}
