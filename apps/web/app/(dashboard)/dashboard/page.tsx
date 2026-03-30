import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckSquare, Trophy, Flame, CalendarCheck, Target, BookOpen, Newspaper, ExternalLink } from 'lucide-react'
import { QuickAddTask } from './quick-add-task'
import { TodaysTasks } from './todays-tasks'
import { RecentJournal } from './recent-journal'
import { NewsFeed } from './news-feed'
import { Greeting } from './greeting'
import { PrimaryGoals } from './primary-goals'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import type { DashboardSummary } from '@setter/shared/types'

async function getDashboardData(supabase: ReturnType<typeof createClient>): Promise<{
  summary: DashboardSummary
  userId: string
  userName: string
  gpaUnweighted: number | null
  gpaWeighted: number | null
  activeGoals: { title: string; goal_type: string; progress_pct: number }[]
  upcomingTasks: { title: string; category: string; due_date: string }[]
  recentAchievements: { title: string; category: string; achieved_at: string }[]
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
    { count: activeGoalsCount },
    { data: streakData },
    { data: userProfile },
    { data: goalsList },
    { data: upcoming },
    { data: recentAch },
    { data: studentProfile },
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

    supabase
      .from('users')
      .select('full_name')
      .eq('id', userId)
      .single(),

    supabase
      .from('goals')
      .select('title, goal_type, progress_pct')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('progress_pct', { ascending: false })
      .limit(4),

    supabase
      .from('tasks')
      .select('title, category, due_date')
      .eq('user_id', userId)
      .in('status', ['pending', 'in_progress'])
      .gt('due_date', today)
      .order('due_date', { ascending: true })
      .limit(5),

    supabase
      .from('achievements')
      .select('title, category, achieved_at')
      .eq('user_id', userId)
      .order('achieved_at', { ascending: false })
      .limit(3),

    supabase
      .from('student_profile')
      .select('gpa_unweighted, gpa_weighted')
      .eq('user_id', userId)
      .single(),
  ])

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
      activeGoals: activeGoalsCount ?? 0,
    },
    userId,
    userName: userProfile?.full_name ?? 'Roma',
    gpaUnweighted: studentProfile?.gpa_unweighted ?? null,
    gpaWeighted: studentProfile?.gpa_weighted ?? null,
    activeGoals: goalsList ?? [],
    upcomingTasks: upcoming ?? [],
    recentAchievements: recentAch ?? [],
  }
}

// getGreeting and getMotivation moved to client component (greeting.tsx)
// Server Components run in Vercel's timezone, not the user's

const GOAL_TYPE_COLORS: Record<string, string> = {
  academic: 'bg-blue-100 text-blue-700',
  athletic: 'bg-green-100 text-green-700',
  personal: 'bg-purple-100 text-purple-700',
  college: 'bg-amber-100 text-amber-700',
}

const CATEGORY_COLORS: Record<string, string> = {
  academic: 'text-blue-600',
  athletic: 'text-green-600',
  leadership: 'text-amber-600',
  community: 'text-pink-600',
  personal: 'text-purple-600',
  streak: 'text-orange-500',
}

export default async function DashboardPage() {
  const supabase = createClient()
  const { summary, userName, gpaUnweighted, gpaWeighted, activeGoals, upcomingTasks, recentAchievements } = await getDashboardData(supabase)

  const firstName = userName.split(' ')[0]

  const SUMMARY_CARDS = [
    {
      title: 'Due Today',
      value: summary.tasksToday,
      icon: CalendarCheck,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Done This Week',
      value: summary.tasksCompletedThisWeek,
      icon: CheckSquare,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Day Streak',
      value: summary.currentStreak,
      icon: Flame,
      color: 'text-orange-500',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'Trophies',
      value: summary.achievementsThisMonth,
      icon: Trophy,
      color: 'text-primary',
      bgColor: 'bg-accent',
    },
  ] as const

  return (
    <div className="space-y-8">
      {/* Hero Greeting */}
      <div className="rounded-2xl bg-gradient-to-br from-pink-100 via-pink-50 to-white border border-pink-100 p-6 animate-fade-in-scale">
        <Greeting firstName={firstName} />
        <div className="mt-3 flex flex-wrap gap-2">
          {gpaUnweighted && (
            <Badge variant="outline" className="bg-pink-50 text-pink-600 border-pink-200 text-xs">
              GPA: {gpaUnweighted.toFixed(2)} UW {gpaWeighted ? `/ ${gpaWeighted.toFixed(2)} W` : ''}
            </Badge>
          )}
          <Badge variant="outline" className="bg-pink-50 text-pink-600 border-pink-200 text-xs">
            {summary.activeGoals} Active Goals
          </Badge>
          <Badge variant="outline" className="bg-pink-50 text-pink-600 border-pink-200 text-xs">
            {summary.tasksCompletedThisWeek} Done This Week
          </Badge>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {SUMMARY_CARDS.map((card) => (
          <Card key={card.title} className="animate-slide-up">
            <CardContent className="flex items-center gap-4 p-4">
              <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', card.bgColor)}>
                <card.icon className={cn('h-5 w-5', card.color)} />
              </div>
              <div>
                <p className="text-2xl font-bold">{card.value}</p>
                <p className="text-xs text-muted-foreground">{card.title}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Primary Goals */}
      <PrimaryGoals />

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column — Tasks */}
        <div className="space-y-6 lg:col-span-2">
          <QuickAddTask />
          <TodaysTasks />

          {/* Upcoming Tasks */}
          {upcomingTasks.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold">Coming Up</CardTitle>
                  <Link href="/tasks" className="text-xs text-primary hover:underline">View all</Link>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {upcomingTasks.map((task, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                    <span>{task.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column — Goals, Achievements, Journal */}
        <div className="space-y-6">
          {/* Active Goals */}
          {activeGoals.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Target className="h-4 w-4 text-primary" />
                    Goals
                  </CardTitle>
                  <Link href="/goals" className="text-xs text-primary hover:underline">View all</Link>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {activeGoals.map((goal, i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium truncate max-w-[180px]">{goal.title}</span>
                      <Badge variant="outline" className={cn('text-[10px] px-1.5', GOAL_TYPE_COLORS[goal.goal_type] || '')}>
                        {goal.goal_type}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${goal.progress_pct}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground font-medium">{goal.progress_pct}%</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Recent Achievements */}
          {recentAchievements.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-troy-gold" />
                    Latest Wins
                  </CardTitle>
                  <Link href="/achievements" className="text-xs text-primary hover:underline">View all</Link>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {recentAchievements.map((ach, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <span className={cn('mt-0.5 text-xs', CATEGORY_COLORS[ach.category] || 'text-muted-foreground')}>
                      {ach.category === 'athletic' ? '⚽' : ach.category === 'academic' ? '📚' : ach.category === 'leadership' ? '⭐' : ach.category === 'community' ? '🤝' : '🏆'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{ach.title}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(ach.achieved_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Recent Journal */}
          <RecentJournal />
        </div>
      </div>

      {/* News Feed */}
      <NewsFeed />
    </div>
  )
}
