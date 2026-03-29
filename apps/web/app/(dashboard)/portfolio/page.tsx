import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Achievement, AchievementCategory } from '@setter/shared/types'

export default async function PortfolioPreviewPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('users')
    .select('full_name, grade_level, sport, position')
    .eq('id', user.id)
    .single()

  const { data: achievements } = await supabase
    .from('achievements')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_portfolio_visible', true)
    .order('achieved_at', { ascending: false })

  const visibleAchievements: Achievement[] = achievements ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Portfolio Preview</h1>
          <p className="text-muted-foreground">
            This is how your public portfolio looks. Toggle achievement visibility from the Achievements page.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/portfolio/${user.id}`} target="_blank">
            <ExternalLink className="mr-2 h-4 w-4" />
            View Public Page
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{profile?.full_name ?? 'Your Name'}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {profile?.grade_level ? `${profile.grade_level}th Grade` : 'High School'}{' '}
            {profile?.sport && profile?.position
              ? `| ${profile.sport} - ${profile.position}`
              : ''}
          </p>
        </CardHeader>
        <CardContent>
          {visibleAchievements.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No achievements visible on your portfolio yet.
              Go to Achievements and toggle the eye icon to show them here.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {visibleAchievements.map((ach) => (
                <div key={ach.id} className="rounded-lg border p-4">
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
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
