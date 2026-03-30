'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Brain, AlertTriangle, CheckCircle2, BookOpen, Sparkles, Filter, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { KnowledgeEntry } from '@setter/shared/types'
import { ROMA_SUBJECTS } from '@setter/shared/types'

interface KnowledgeStats {
  total: number
  weak: number
  mastered: number
  subjects: Record<string, { total: number; weak: number; mastered: number }>
}

export default function KnowledgePage() {
  const router = useRouter()
  const [entries, setEntries] = useState<KnowledgeEntry[]>([])
  const [stats, setStats] = useState<KnowledgeStats>({ total: 0, weak: 0, mastered: 0, subjects: {} })
  const [filter, setFilter] = useState<'all' | 'weak' | 'mastered'>('all')
  const [subjectFilter, setSubjectFilter] = useState<string>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => { fetchData() }, [filter, subjectFilter])

  async function fetchData() {
    const params = new URLSearchParams()
    if (filter !== 'all') params.set('filter', filter)
    if (subjectFilter !== 'all') params.set('subject', subjectFilter)

    const res = await fetch(`/api/knowledge?${params}`)
    if (res.ok) {
      const data = await res.json()
      setEntries(data.entries)
      setStats(data.stats)
    }
  }

  async function toggleMastered(id: string, current: boolean) {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, is_mastered: !current } : e))
    )
    await fetch('/api/knowledge', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, is_mastered: !current }),
    })
  }

  function generateWeakAreasQuiz() {
    // Navigate to quiz create with weak areas context
    const weakEntries = entries.filter((e) => e.mastery_score < 0.6)
    const topics = [...new Set(weakEntries.map((e) => e.topic).filter(Boolean))]
    const subject = subjectFilter !== 'all' ? subjectFilter : weakEntries[0]?.subject ?? ROMA_SUBJECTS[0]

    router.push(`/quiz?subject=${encodeURIComponent(subject)}&topic=${encodeURIComponent(topics.join(', '))}&mode=weak`)
  }

  function getMasteryColor(score: number): string {
    if (score >= 0.8) return 'text-emerald-600 bg-emerald-50'
    if (score >= 0.5) return 'text-amber-600 bg-amber-50'
    return 'text-red-600 bg-red-50'
  }

  function getMasteryLabel(score: number): string {
    if (score >= 0.8) return 'Strong'
    if (score >= 0.5) return 'Learning'
    return 'Needs Work'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Knowledge Base</h1>
          <p className="text-sm text-muted-foreground">Track what you know and what needs work</p>
        </div>
        {stats.weak > 0 && (
          <Button size="sm" onClick={generateWeakAreasQuiz}>
            <Sparkles className="mr-1 h-4 w-4" />
            Quiz Weak Areas
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-3 grid-cols-3">
        <Card className={cn('cursor-pointer transition-shadow', filter === 'all' && 'ring-1 ring-primary')} onClick={() => setFilter('all')}>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
              <BookOpen className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-[10px] text-muted-foreground">Total Questions</p>
            </div>
          </CardContent>
        </Card>
        <Card className={cn('cursor-pointer transition-shadow', filter === 'weak' && 'ring-1 ring-red-400')} onClick={() => setFilter('weak')}>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50">
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">{stats.weak}</p>
              <p className="text-[10px] text-muted-foreground">Needs Work</p>
            </div>
          </CardContent>
        </Card>
        <Card className={cn('cursor-pointer transition-shadow', filter === 'mastered' && 'ring-1 ring-emerald-400')} onClick={() => setFilter('mastered')}>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-600">{stats.mastered}</p>
              <p className="text-[10px] text-muted-foreground">Mastered</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subject Breakdown */}
      {Object.keys(stats.subjects).length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">By Subject</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(stats.subjects).map(([subj, s]) => (
              <button
                key={subj}
                onClick={() => setSubjectFilter(subjectFilter === subj ? 'all' : subj)}
                className={cn(
                  'w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors',
                  subjectFilter === subj ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
                )}
              >
                <span className="font-medium">{subj}</span>
                <div className="flex items-center gap-3 text-xs">
                  {s.weak > 0 && <span className="text-red-500">{s.weak} weak</span>}
                  <span className="text-muted-foreground">{s.total} total</span>
                  {s.mastered > 0 && <span className="text-emerald-500">{s.mastered} mastered</span>}
                  <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-400"
                      style={{ width: `${s.total > 0 ? (s.mastered / s.total) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Knowledge Entries */}
      {entries.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground px-1">
            {entries.length} question{entries.length !== 1 ? 's' : ''}
            {filter === 'weak' ? ' needing work' : filter === 'mastered' ? ' mastered' : ''}
            {subjectFilter !== 'all' ? ` in ${subjectFilter}` : ''}
          </p>
          {entries.map((entry) => {
            const expanded = expandedId === entry.id
            return (
              <Card key={entry.id} className={cn('transition-shadow', !entry.is_mastered && entry.mastery_score < 0.6 && 'border-l-3 border-l-red-300')}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => setExpandedId(expanded ? null : entry.id)}
                      className="mt-0.5 text-muted-foreground"
                    >
                      {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-snug">{entry.question_text}</p>

                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <Badge variant="outline" className={cn('text-[10px] px-1.5', getMasteryColor(entry.mastery_score))}>
                          {getMasteryLabel(entry.mastery_score)} ({Math.round(entry.mastery_score * 100)}%)
                        </Badge>
                        <Badge variant="outline" className="text-[10px] px-1.5">{entry.subject}</Badge>
                        <span className="text-[10px] text-muted-foreground">
                          Seen {entry.times_seen}x • {entry.times_correct} correct • {entry.times_incorrect} wrong
                        </span>
                      </div>

                      {expanded && (
                        <div className="mt-3 space-y-2 text-sm animate-fade-in-scale">
                          <div className="rounded-lg bg-emerald-50 px-3 py-2">
                            <span className="text-[10px] font-semibold text-emerald-700 uppercase">Correct Answer</span>
                            <p className="text-emerald-800 font-medium">{entry.correct_answer}</p>
                          </div>

                          {entry.user_answer && entry.user_answer !== entry.correct_answer && (
                            <div className="rounded-lg bg-red-50 px-3 py-2">
                              <span className="text-[10px] font-semibold text-red-700 uppercase">Your Last Answer</span>
                              <p className="text-red-800">{entry.user_answer}</p>
                            </div>
                          )}

                          {entry.explanation && (
                            <div className="rounded-lg bg-blue-50 px-3 py-2">
                              <span className="text-[10px] font-semibold text-blue-700 uppercase">Explanation</span>
                              <p className="text-blue-800 text-xs leading-relaxed">{entry.explanation}</p>
                            </div>
                          )}

                          <div className="flex items-center gap-2 pt-1">
                            <button
                              onClick={() => toggleMastered(entry.id, entry.is_mastered)}
                              className={cn(
                                'text-xs font-medium px-3 py-1 rounded-full transition-colors',
                                entry.is_mastered
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-muted text-muted-foreground hover:bg-emerald-50 hover:text-emerald-600'
                              )}
                            >
                              {entry.is_mastered ? '✓ Mastered' : 'Mark as mastered'}
                            </button>
                            <span className="text-[10px] text-muted-foreground">
                              Last tested {new Date(entry.last_tested_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Brain className="mb-4 h-12 w-12 text-muted-foreground/30" />
          <h3 className="text-lg font-semibold">Knowledge base is empty</h3>
          <p className="mt-1 text-sm text-muted-foreground max-w-sm">
            Take quizzes in the Quiz Zone and your questions will be tracked here — especially the ones you get wrong, so you can review before exams.
          </p>
          <Button variant="outline" className="mt-4" onClick={() => router.push('/quiz')}>
            Go to Quiz Zone
          </Button>
        </div>
      )}
    </div>
  )
}
