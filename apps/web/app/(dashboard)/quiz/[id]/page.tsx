'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, Check, X, RotateCcw, Trophy, Clock, BrainCircuit } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { QuizSet, QuizQuestion, QuizMode } from '@setter/shared/types'

interface QuizData {
  quizSet: QuizSet
  questions: QuizQuestion[]
}

export default function QuizPlayerPage() {
  const { id } = useParams()
  const router = useRouter()
  const [data, setData] = useState<QuizData | null>(null)
  const [mode, setMode] = useState<QuizMode | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [flipped, setFlipped] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [results, setResults] = useState<{ score: number; correctCount: number; results: { questionId: string; isCorrect: boolean }[] } | null>(null)
  const [startTime] = useState(Date.now())
  const [submitting, setSubmitting] = useState(false)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        setError(null)

        const [setsRes, questionsRes] = await Promise.all([
          fetch('/api/quiz/sets'),
          fetch(`/api/quiz/questions?setId=${id}`),
        ])

        if (!setsRes.ok) {
          const err = await setsRes.text()
          setError(`Failed to load quiz sets: ${err}`)
          return
        }

        if (!questionsRes.ok) {
          const err = await questionsRes.text()
          setError(`Failed to load questions: ${err}`)
          return
        }

        const { sets } = await setsRes.json()
        const set = sets.find((s: QuizSet) => s.id === id)
        const questions = await questionsRes.json()

        if (!set) {
          setError('Quiz set not found')
          return
        }

        if (!questions || !Array.isArray(questions) || questions.length === 0) {
          setError(`No questions found for this quiz (set: ${set.title}). The quiz may not have generated correctly. Try creating a new one.`)
          return
        }

        setData({ quizSet: set, questions })
      } catch (e) {
        setError(`Unexpected error: ${e instanceof Error ? e.message : String(e)}`)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const question = data?.questions[currentIndex]
  const totalQuestions = data?.questions.length ?? 0
  const progress = totalQuestions > 0 ? ((currentIndex + 1) / totalQuestions) * 100 : 0

  async function handleSubmit() {
    if (!data || submitting) return
    setSubmitting(true)

    const responses = data.questions.map((q) => ({
      questionId: q.id,
      answer: answers[q.id] ?? '',
      timeSpentSeconds: Math.round((Date.now() - startTime) / 1000 / totalQuestions),
    }))

    try {
      const res = await fetch('/api/quiz/attempt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quizSetId: id,
          mode: mode ?? 'test',
          responses,
          totalTimeSeconds: Math.round((Date.now() - startTime) / 1000),
        }),
      })

      if (res.ok) {
        const result = await res.json()
        setResults(result)
        setSubmitted(true)
      }
    } catch { /* ignore */ }
    finally { setSubmitting(false) }
  }

  // Mode selection screen
  if (!mode && !loading) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={() => router.push('/quiz')}>
          <ArrowLeft className="mr-1 h-4 w-4" /> Back to Quiz Zone
        </Button>

        <div className="text-center py-8">
          <BrainCircuit className="mx-auto h-12 w-12 text-primary mb-4" />
          <h1 className="text-xl font-bold">{data?.quizSet.title ?? 'Loading...'}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {totalQuestions} questions • {data?.quizSet.subject}
          </p>
        </div>

        <div className="grid gap-3 max-w-md mx-auto">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setMode('learn')}>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
                <RotateCcw className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold">Learn</h3>
                <p className="text-xs text-muted-foreground">Flashcard mode — flip to reveal answers</p>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setMode('test')}>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Trophy className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Test</h3>
                <p className="text-xs text-muted-foreground">Answer questions and get scored</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Results screen
  if (submitted && results) {
    const correctMap = new Map(results.results.map((r) => [r.questionId, r.isCorrect]))
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className={cn(
            'mx-auto h-20 w-20 rounded-full flex items-center justify-center text-2xl font-bold text-white mb-4',
            results.score >= 90 ? 'bg-green-500' : results.score >= 70 ? 'bg-primary' : 'bg-amber-500'
          )}>
            {results.score}%
          </div>
          <h2 className="text-xl font-bold">
            {results.score >= 90 ? 'Excellent!' : results.score >= 70 ? 'Good job!' : 'Keep practicing!'}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {results.correctCount} of {totalQuestions} correct
          </p>
        </div>

        {/* Per-question review */}
        <div className="space-y-3">
          {data?.questions.map((q, i) => {
            const isCorrect = correctMap.get(q.id)
            return (
              <Card key={q.id} className={cn('border-l-4', isCorrect ? 'border-l-green-500' : 'border-l-red-500')}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-2">
                    {isCorrect ? <Check className="h-4 w-4 text-green-500 mt-0.5" /> : <X className="h-4 w-4 text-red-500 mt-0.5" />}
                    <div className="flex-1">
                      <p className="text-sm font-medium">{i + 1}. {q.question_text}</p>
                      <p className="text-xs mt-1">
                        <span className="text-muted-foreground">Your answer: </span>
                        <span className={isCorrect ? 'text-green-600' : 'text-red-600'}>{answers[q.id] || '(no answer)'}</span>
                      </p>
                      {!isCorrect && (
                        <p className="text-xs mt-0.5">
                          <span className="text-muted-foreground">Correct: </span>
                          <span className="text-green-600 font-medium">{q.correct_answer}</span>
                        </p>
                      )}
                      {q.explanation && (
                        <p className="text-xs text-muted-foreground mt-1 italic">{q.explanation}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="flex gap-2 justify-center">
          <Button onClick={() => { setMode(null); setSubmitted(false); setResults(null); setAnswers({}); setCurrentIndex(0) }}>
            Try Again
          </Button>
          <Button variant="outline" onClick={() => router.push('/quiz')}>
            Back to Quiz Zone
          </Button>
        </div>
      </div>
    )
  }

  if (loading) {
    return <div className="py-12 text-center text-muted-foreground">Loading questions...</div>
  }

  if (error) {
    return (
      <div className="py-12 text-center space-y-4">
        <p className="text-sm text-destructive">{error}</p>
        <Button variant="outline" onClick={() => router.push('/quiz')}>
          <ArrowLeft className="mr-1 h-4 w-4" /> Back to Quiz Zone
        </Button>
      </div>
    )
  }

  if (!question) {
    return (
      <div className="py-12 text-center space-y-4">
        <p className="text-sm text-muted-foreground">No questions available.</p>
        <Button variant="outline" onClick={() => router.push('/quiz')}>
          <ArrowLeft className="mr-1 h-4 w-4" /> Back to Quiz Zone
        </Button>
      </div>
    )
  }

  // Learn mode (flashcards)
  if (mode === 'learn') {
    return (
      <div className="space-y-6">
        {/* Progress */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push('/quiz')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
          <span className="text-xs text-muted-foreground">{currentIndex + 1}/{totalQuestions}</span>
        </div>

        {/* Flashcard */}
        <div
          className="min-h-[300px] cursor-pointer"
          onClick={() => setFlipped(!flipped)}
        >
          <Card className="min-h-[300px] flex items-center justify-center">
            <CardContent className="text-center p-8">
              {!flipped ? (
                <>
                  <Badge variant="outline" className="mb-4 text-xs">{question.question_type === 'flashcard' ? 'Term' : 'Question'}</Badge>
                  <p className="text-lg font-semibold">{question.question_text}</p>
                  <p className="text-xs text-muted-foreground mt-4">Tap to flip</p>
                </>
              ) : (
                <>
                  <Badge variant="outline" className="mb-4 text-xs bg-green-50 text-green-700">Answer</Badge>
                  <p className="text-lg font-semibold text-green-700">{question.correct_answer}</p>
                  {question.explanation && (
                    <p className="text-sm text-muted-foreground mt-3">{question.explanation}</p>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button variant="outline" disabled={currentIndex === 0} onClick={() => { setCurrentIndex((i) => i - 1); setFlipped(false) }}>
            <ArrowLeft className="mr-1 h-4 w-4" /> Previous
          </Button>
          <Button disabled={currentIndex >= totalQuestions - 1} onClick={() => { setCurrentIndex((i) => i + 1); setFlipped(false) }}>
            Next <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }

  // Test mode
  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.push('/quiz')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
        <span className="text-xs text-muted-foreground">{currentIndex + 1}/{totalQuestions}</span>
      </div>

      {/* Question */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <Badge variant="outline" className="text-xs">
            {question.question_type === 'multiple_choice' ? 'Multiple Choice' :
             question.question_type === 'true_false' ? 'True or False' :
             question.question_type === 'fill_blank' ? 'Fill in the Blank' : 'Question'}
          </Badge>
          <p className="text-base font-semibold">{question.question_text}</p>

          {/* Multiple Choice */}
          {question.question_type === 'multiple_choice' && question.options && (
            <div className="space-y-2">
              {(question.options as string[]).map((option) => (
                <button
                  key={option}
                  onClick={() => setAnswers((prev) => ({ ...prev, [question.id]: option }))}
                  className={cn(
                    'w-full text-left rounded-lg border p-3 text-sm transition-colors',
                    answers[question.id] === option
                      ? 'border-primary bg-primary/5 text-primary font-medium'
                      : 'hover:bg-accent'
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
          )}

          {/* True/False */}
          {question.question_type === 'true_false' && (
            <div className="flex gap-3">
              {['True', 'False'].map((opt) => (
                <button
                  key={opt}
                  onClick={() => setAnswers((prev) => ({ ...prev, [question.id]: opt }))}
                  className={cn(
                    'flex-1 rounded-lg border p-4 text-sm font-medium transition-colors',
                    answers[question.id] === opt
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'hover:bg-accent'
                  )}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}

          {/* Fill in the blank */}
          {question.question_type === 'fill_blank' && (
            <input
              type="text"
              placeholder="Type your answer..."
              value={answers[question.id] ?? ''}
              onChange={(e) => setAnswers((prev) => ({ ...prev, [question.id]: e.target.value }))}
              className="w-full rounded-lg border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          )}

          {/* Flashcard in test mode */}
          {question.question_type === 'flashcard' && (
            <input
              type="text"
              placeholder="Type the definition..."
              value={answers[question.id] ?? ''}
              onChange={(e) => setAnswers((prev) => ({ ...prev, [question.id]: e.target.value }))}
              className="w-full rounded-lg border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" disabled={currentIndex === 0} onClick={() => setCurrentIndex((i) => i - 1)}>
          <ArrowLeft className="mr-1 h-4 w-4" /> Previous
        </Button>

        {currentIndex < totalQuestions - 1 ? (
          <Button onClick={() => setCurrentIndex((i) => i + 1)}>
            Next <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit Quiz'}
          </Button>
        )}
      </div>
    </div>
  )
}
