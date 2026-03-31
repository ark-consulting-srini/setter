'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Clock, Trophy, ArrowLeft, ChevronDown, Check, X, Minus } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface QuizAttempt {
  id: string; quiz_set_id: string; mode: string; score: number | null
  correct_count: number; total_questions: number; time_spent_seconds: number
  completed_at: string; created_at: string; quizTitle: string; subject: string
}

interface AttemptDetail {
  attempt: QuizAttempt
  responses: Array<{
    id: string; user_answer: string; is_correct: boolean
    question: { question_text: string; correct_answer: string; question_type: string; explanation: string | null; options: string[] | null }
  }>
  quizTitle: string; subject: string
}

export default function QuizHistoryPage() {
  const router = useRouter()
  const [history, setHistory] = useState<QuizAttempt[]>([])
  const [selectedAttempt, setSelectedAttempt] = useState<AttemptDetail | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/analytics')
      if (res.ok) { const d = await res.json(); setHistory(d.quizHistory ?? []) }
    }
    load()
  }, [])

  async function loadAttempt(id: string) {
    setLoading(true)
    try {
      const res = await fetch(`/api/quiz/attempt/${id}`)
      if (res.ok) setSelectedAttempt(await res.json())
    } catch {} finally { setLoading(false) }
  }

  function formatTime(s: number): string {
    if (s < 60) return `${s}s`
    return `${Math.floor(s / 60)}m ${s % 60}s`
  }

  if (selectedAttempt) {
    const { attempt, responses, quizTitle, subject } = selectedAttempt
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => setSelectedAttempt(null)}>
          <ArrowLeft className="mr-1 h-4 w-4" /> Back to History
        </Button>

        <div className="text-center py-4">
          <div className={cn('mx-auto h-20 w-20 rounded-full flex items-center justify-center text-2xl font-bold text-white mb-3',
            (attempt.score ?? 0) >= 90 ? 'bg-emerald-500' : (attempt.score ?? 0) >= 70 ? 'bg-primary' : 'bg-amber-500'
          )}>{attempt.score ?? 0}%</div>
          <h2 className="text-lg font-bold">{quizTitle}</h2>
          <p className="text-xs text-muted-foreground">{subject} • {attempt.correct_count}/{attempt.total_questions} correct • {formatTime(attempt.time_spent_seconds)}</p>
        </div>

        <div className="space-y-2">
          {responses.map((r, i) => (
            <Card key={r.id} className={cn('border-l-3', r.is_correct ? 'border-l-emerald-400' : 'border-l-red-400')}>
              <CardContent className="p-4">
                <div className="flex items-start gap-2">
                  {r.is_correct ? <Check className="h-4 w-4 text-emerald-500 mt-0.5" /> : <X className="h-4 w-4 text-red-500 mt-0.5" />}
                  <div className="flex-1">
                    <p className="text-sm font-medium">{i + 1}. {r.question.question_text}</p>
                    <p className="text-xs mt-1">
                      <span className="text-muted-foreground">Your answer: </span>
                      <span className={r.is_correct ? 'text-emerald-600' : 'text-red-600'}>{r.user_answer || '(no answer)'}</span>
                    </p>
                    {!r.is_correct && (
                      <p className="text-xs mt-0.5">
                        <span className="text-muted-foreground">Correct: </span>
                        <span className="text-emerald-600 font-medium">{r.question.correct_answer}</span>
                      </p>
                    )}
                    {r.question.explanation && <p className="text-xs text-muted-foreground mt-1 italic">{r.question.explanation}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Quiz History</h1>
          <p className="text-sm text-muted-foreground">{history.length} quiz{history.length !== 1 ? 'zes' : ''} taken</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => router.push('/quiz')}>Go to Quiz Zone</Button>
      </div>

      {history.length > 0 ? (
        <div className="space-y-2">
          {history.map(a => (
            <Card key={a.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => loadAttempt(a.id)}>
              <CardContent className="flex items-center gap-4 p-4">
                <div className={cn('h-12 w-12 rounded-full flex items-center justify-center text-sm font-bold text-white',
                  (a.score ?? 0) >= 90 ? 'bg-emerald-500' : (a.score ?? 0) >= 70 ? 'bg-primary' : (a.score ?? 0) >= 50 ? 'bg-amber-500' : 'bg-red-400'
                )}>{a.score ?? '—'}%</div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{a.quizTitle}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                    <Badge variant="outline" className="text-[10px]">{a.subject}</Badge>
                    <span>{a.correct_count}/{a.total_questions} correct</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatTime(a.time_spent_seconds)}</span>
                    <span>{new Date(a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  </div>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <Trophy className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-semibold">No quizzes taken yet</h3>
          <p className="text-sm text-muted-foreground mt-1">Take a quiz in Quiz Zone to see your history here</p>
        </div>
      )}
    </div>
  )
}
