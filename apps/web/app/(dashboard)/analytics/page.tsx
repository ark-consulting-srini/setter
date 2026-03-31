'use client'

import { useState, useEffect } from 'react'
import { BarChart3, Calendar, BookOpen, MessageCircle, CheckSquare, BrainCircuit, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface AnalyticsData {
  summary: Record<string, number>
  pageViews: Record<string, number>
  dailyActivity: Record<string, number>
  quizHistory: Array<{ score: number; subject: string; created_at: string }>
  totalEvents: number
  activeDays: number
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [days, setDays] = useState(30)

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/analytics?days=${days}`)
      if (res.ok) setData(await res.json())
    }
    load()
  }, [days])

  if (!data) return <div className="py-12 text-center text-muted-foreground">Loading analytics...</div>

  const featureStats = [
    { label: 'Quizzes Taken', value: data.summary.quiz_taken ?? 0, icon: BrainCircuit, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Chat Messages', value: data.summary.chat_sent ?? 0, icon: MessageCircle, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Tasks Completed', value: data.summary.task_completed ?? 0, icon: CheckSquare, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Files Uploaded', value: data.summary.file_uploaded ?? 0, icon: BookOpen, color: 'text-amber-600', bg: 'bg-amber-50' },
  ]

  // Build activity heatmap for last 30 days
  const today = new Date()
  const heatmapDays: { date: string; count: number; label: string }[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    heatmapDays.push({
      date: dateStr,
      count: data.dailyActivity[dateStr] ?? 0,
      label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    })
  }

  const maxActivity = Math.max(...heatmapDays.map(d => d.count), 1)

  // Quiz score trend
  const quizScores = data.quizHistory.filter(q => q.score !== null).slice(0, 20).reverse()
  const avgScore = quizScores.length > 0 ? Math.round(quizScores.reduce((a, b) => a + b.score, 0) / quizScores.length) : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="text-sm text-muted-foreground">Track your learning activity</p>
        </div>
        <div className="flex gap-1 rounded-lg border p-0.5">
          {[7, 30, 90].map(d => (
            <button key={d} onClick={() => setDays(d)} className={cn('rounded-md px-3 py-1 text-xs font-medium', days === d ? 'bg-primary text-primary-foreground' : 'text-muted-foreground')}>{d}d</button>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-pink-50">
              <Calendar className="h-5 w-5 text-pink-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{data.activeDays}</p>
              <p className="text-[10px] text-muted-foreground">Active Days</p>
            </div>
          </CardContent>
        </Card>
        {featureStats.map(s => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', s.bg)}>
                <s.icon className={cn('h-5 w-5', s.color)} />
              </div>
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Activity Heatmap */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Daily Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-1 flex-wrap">
            {heatmapDays.map(d => (
              <div
                key={d.date}
                title={`${d.label}: ${d.count} events`}
                className="w-4 h-4 rounded-sm transition-colors"
                style={{
                  backgroundColor: d.count === 0 ? '#f1f5f9'
                    : `rgba(232, 160, 191, ${0.2 + (d.count / maxActivity) * 0.8})`,
                }}
              />
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">Less → More activity</p>
        </CardContent>
      </Card>

      {/* Quiz Performance */}
      {quizScores.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" /> Quiz Performance
              </CardTitle>
              <Badge variant="outline" className="text-xs">Avg: {avgScore}%</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-1 h-24">
              {quizScores.map((q, i) => (
                <div
                  key={i}
                  title={`${q.subject}: ${q.score}%`}
                  className="flex-1 rounded-t transition-all"
                  style={{
                    height: `${q.score}%`,
                    backgroundColor: q.score >= 90 ? '#10B981' : q.score >= 70 ? '#E8A0BF' : q.score >= 50 ? '#FBBF24' : '#F87171',
                  }}
                />
              ))}
            </div>
            <div className="flex justify-between text-[9px] text-muted-foreground mt-1">
              <span>Oldest</span>
              <span>Most Recent</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Page Views */}
      {Object.keys(data.pageViews).length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Most Used Features</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(data.pageViews).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([page, count]) => (
              <div key={page} className="flex items-center justify-between">
                <span className="text-xs font-medium">{page.replace('/', '').replace(/-/g, ' ') || 'Home'}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${(count / Math.max(...Object.values(data.pageViews))) * 100}%` }} />
                  </div>
                  <span className="text-xs text-muted-foreground w-8 text-right">{count}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
