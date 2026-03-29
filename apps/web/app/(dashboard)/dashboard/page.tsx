import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckSquare, Trophy, Flame, CalendarCheck } from 'lucide-react'
import { QuickAddTask } from './quick-add-task'
import { TodaysTasks } from './todays-tasks'
import { RecentJournal } from './recent-journal'
import type { DashboardSummary } from '@setter/shared/types'

async function getDashboardData(supabase: ReturnType<typeof createClient>): Promise<{
  summary: DashboardSummary
  userId: string
}> {
  const { data: { user } } = await supabase.auth.getUser()
  const userId = user!.id

  const today = new Date().toISOString().split('T')[0]

  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)

  const monthAgo = new Date()
  monthAgo.setDate(monthAgo.getDate() - 30)

  const [
    { count: tasksToday },
    { count: tasksCompletedThisWeek },
    { count: achievementsThisMonth },
    { count: activeGoals },
    { data: streakData },
  ] = await Promise.all([
    supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .in('status', ['pending', 'in_progress'])
      .eq('due_date', today),

    supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'completed')
      .gte('completed_at', weekAgo.toISOString()),

    supabase
      .from('achievements')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('achieved_at', monthAgo.toISOString().split('T')[0]),

    supabase
      .from('goals')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'active'),

    supabase
      .from('tasks')
      .select('completed_at')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .gte('completed_at', weekAgo.toISOString())
      .order('completed_at', { ascending: false }),
  ])

  // Calculate streak: consecutive days with at least one completion
  let currentStreak = 0
  if (streakData && streakData.length > 0) {
    const uniqueDays = new Set(
      streakData.map((t) => new Date(t.completed_at!).toISOString().split('T')[0])
    )
    const todayDate = new Date()
    for (let i = 0; i < 7; i++) {
      const checkDate = new Date(todayDate)
      checkDate.setDate(checkDate.getDate() - i)
      const dateStr = checkDate.toISOString().split('T')[0]
      if (uniqueDays.has(dateStr)) {
        currentStreak++
      } else if (i > 0) {
        break
      }
    }
  }

  return {
    summary: {
      tasksToday: tasksToday ?? 0,
      tasksCompletedThisWeek: tasksCompletedThisWeek ?? 0,
      currentStreak,
      achievementsThisMonth: achievementsThisMonth ?? 0,
      activeGoals: activeGoals ?? 0,
    },
    userId,
  }
}

export default async function DashboardPage() {
  const supabase = createClient()
  const { summary } = await getDashboardData(supabase)

  const SUMMARY_CARDS = [
    {
      title: 'Due Today',
      value: summary.tasksToday,
      icon: CalendarCheck,
      color: 'text-blue-600',
    },
    {
      title: 'Completed This Week',
      value: summary.tasksCompletedThisWeek,
      icon: CheckSquare,
      color: 'text-green-600',
    },
    {
      title: 'Day Streak',
      value: summary.currentStreak,
      icon: Flame,
      color: 'text-orange-500',
    },
    {
      title: 'Achievements',
      value: summary.achievementsThisMonth,
      icon: Trophy,
      color: 'text-violet-600',
    },
  ] as const

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Here&apos;s what&apos;s happening today.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {SUMMARY_CARDS.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <card.icon className={cn('h-5 w-5', card.color)} />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Add + Today's Tasks + Recent Journal */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <QuickAddTask />
          <TodaysTasks />
        </div>
        <RecentJournal />
      </div>
    </div>
  )
}

// Need this import for the summary cards
import { cn } from '@/lib/utils'
