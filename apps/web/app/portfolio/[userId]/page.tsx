import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import type { Achievement, AchievementCategory } from '@setter/shared/types'

interface PortfolioGoal {
  title: string
  goal_type: string
  status: string
  progress_pct: number
}

interface PortfolioPageProps {
  params: { userId: string }
}

export default async function PublicPortfolioPage({ params }: PortfolioPageProps) {
  const supabase = createClient()

  const { data: profile } = await supabase
    .from('users')
    .select('full_name, grade_level, sport, position, college_target')
    .eq('id', params.userId)
    .single()

  if (!profile) {
    notFound()
  }

  const [{ data: achievements }, { data: goals }] = await Promise.all([
    supabase
      .from('achievements')
      .select('*')
      .eq('user_id', params.userId)
      .eq('is_portfolio_visible', true)
      .order('achieved_at', { ascending: false }),
    supabase
      .from('goals')
      .select('title, goal_type, status, progress_pct')
      .eq('user_id', params.userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const visibleAchievements: Achievement[] = achievements ?? []
  const activeGoals: PortfolioGoal[] = goals ?? []

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50 to-white">
      <div className="mx-auto max-w-3xl px-4 py-16">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="mb-4 inline-flex h-20 w-20 items-center justify-center rounded-full bg-primary text-3xl font-bold text-primary-foreground">
            {profile.full_name.charAt(0)}
          </div>
          <h1 className="text-3xl font-bold">{profile.full_name}</h1>
          <p className="mt-1 text-muted-foreground">
            {profile.grade_level ? `${profile.grade_level}th Grade` : 'High School Student'}
            {profile.sport && profile.position
              ? ` | ${profile.sport} - ${profile.position}`
              : ''}
          </p>
          {profile.college_target && (
            <p className="mt-2 text-sm text-primary font-medium">
              Goal: {profile.college_target}
            </p>
          )}
        </div>

        {/* Goals */}
        {activeGoals.length > 0 && (
          <div className="mb-12">
            <h2 className="mb-4 text-xl font-semibold">Current Goals</h2>
            <Separator className="mb-4" />
            <div className="space-y-3">
              {activeGoals.map((goal) => (
                <div key={goal.title} className="flex items-center gap-3 rounded-lg border bg-white p-4">
                  <div className="flex-1">
                    <p className="font-medium">{goal.title}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {goal.goal_type}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold text-primary">
                      {goal.progress_pct}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Achievements */}
        <div>
          <h2 className="mb-4 text-xl font-semibold">Achievements</h2>
          <Separator className="mb-4" />
          {visibleAchievements.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Achievements coming soon.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {visibleAchievements.map((ach) => (
                <div
                  key={ach.id}
                  className="rounded-lg border bg-white p-5 shadow-sm"
                >
                  <div className="mb-2">
                    <Badge variant={ach.category as AchievementCategory}>
                      {ach.category}
                    </Badge>
                  </div>
                  <h3 className="font-semibold">{ach.title}</h3>
                  {ach.description && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {ach.description}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-muted-foreground">
                    {new Date(ach.achieved_at + 'T00:00:00').toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-16 text-center">
          <p className="text-xs text-muted-foreground">
            Built with Setter
          </p>
        </div>
      </div>
    </div>
  )
}
