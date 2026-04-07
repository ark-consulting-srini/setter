'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, Check, X, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface ReviewCard {
  id: string
  ease_factor: number
  interval_days: number
  repetitions: number
  next_review_at: string
  question: {
    id: string
    question_type: string
    question_text: string
    correct_answer: string
    options: string[] | null
    explanation: string | null
    difficulty: string
    quiz_set: { title: string; subject: string }
  }
}

type Rating = 'again' | 'hard' | 'good' | 'easy'

interface ReviewResult {
  cardId: string
  questionId: string
  rating: Rating
  isCorrect: boolean
}

export default function ReviewPage() {
  const router = useRouter()
  const [cards, setCards] = useState<ReviewCard[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [answer, setAnswer] = useState('')
  const [answered, setAnswered] = useState(false)
  const [results, setResults] = useState<ReviewResult[]>([])
  const [loading, setLoading] = useState(true)
  const [done, setDone] = useState(false)

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/quiz/review')
      if (res.ok) {
        const data = await res.json()
        setCards(data.cards ?? [])
      }
      setLoading(false)
    }
    load()
  }, [])

  const card = cards[currentIndex]
  const question = card?.question
  const totalCards = cards.length
  const progress = totalCards > 0 ? ((currentIndex + 1) / totalCards) * 100 : 0

  function checkAnswer() {
    setAnswered(true)
    setFlipped(true)
  }

  function rate(rating: Rating) {
    if (!card || !question) return
    const isCorrect = rating === 'good' || rating === 'easy'
    setResults((prev) => [...prev, { cardId: card.id, questionId: question.id, rating, isCorrect }])
    setAnswer('')
    setAnswered(false)
    setFlipped(false)

    if (currentIndex + 1 >= totalCards) {
      setDone(true)
    } else {
      setCurrentIndex((i) => i + 1)
    }
  }

  if (loading) {
    return <div className="py-12 text-center text-muted-foreground">Loading review cards...</div>
  }

  if (totalCards === 0) {
    return (
      <div className="py-12 text-center space-y-4">
        <RotateCcw className="mx-auto h-12 w-12 text-muted-foreground/30" />
        <h3 className="text-lg font-semibold">No cards due for review</h3>
        <p className="text-sm text-muted-foreground">Take some quizzes first — cards will appear here when they&apos;re due.</p>
        <Button variant="outline" onClick={() => router.push('/quiz')}>
          <ArrowLeft className="mr-1 h-4 w-4" /> Back to Quiz Zone
        </Button>
      </div>
    )
  }

  // Done screen
  if (done) {
    const correct = results.filter((r) => r.isCorrect).length
    return (
      <div className="py-12 text-center space-y-6">
        <div className={cn(
          'mx-auto h-20 w-20 rounded-full flex items-center justify-center text-2xl font-bold text-white',
          correct === totalCards ? 'bg-green-500' : correct >= totalCards * 0.7 ? 'bg-primary' : 'bg-amber-500'
        )}>
          {correct}/{totalCards}
        </div>
        <div>
          <h2 className="text-xl font-bold">Review Complete</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {correct} of {totalCards} rated good or easy
          </p>
        </div>
        <div className="flex gap-2 justify-center">
          <Button onClick={() => router.push('/quiz')}>Back to Quiz Zone</Button>
        </div>
      </div>
    )
  }

  if (!question) return null

  const isMultipleChoice = question.question_type === 'multiple_choice'
  const isTrueFalse = question.question_type === 'true_false'

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
        <span className="text-xs text-muted-foreground">{currentIndex + 1}/{totalCards}</span>
      </div>

      <div className="text-center">
        <Badge variant="outline" className="text-xs">
          {question.quiz_set.subject} — {question.quiz_set.title}
        </Badge>
      </div>

      {/* Card */}
      <Card className="min-h-[250px] flex items-center justify-center cursor-pointer" onClick={() => !answered && setFlipped(!flipped)}>
        <CardContent className="text-center p-8 w-full">
          {!flipped ? (
            <>
              <p className="text-base font-semibold">{question.question_text}</p>

              {isMultipleChoice && question.options && !answered && (
                <div className="space-y-2 mt-4 text-left">
                  {(question.options as string[]).map((option) => (
                    <button
                      key={option}
                      onClick={(e) => { e.stopPropagation(); setAnswer(option) }}
                      className={cn(
                        'w-full text-left rounded-lg border p-3 text-sm transition-colors',
                        answer === option ? 'border-primary bg-primary/5 text-primary font-medium' : 'hover:bg-accent'
                      )}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}

              {isTrueFalse && !answered && (
                <div className="flex gap-3 mt-4 justify-center">
                  {['True', 'False'].map((opt) => (
                    <button
                      key={opt}
                      onClick={(e) => { e.stopPropagation(); setAnswer(opt) }}
                      className={cn(
                        'flex-1 max-w-[120px] rounded-lg border p-3 text-sm font-medium transition-colors',
                        answer === opt ? 'border-primary bg-primary/5 text-primary' : 'hover:bg-accent'
                      )}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}

              {!isMultipleChoice && !isTrueFalse && !answered && (
                <p className="text-xs text-muted-foreground mt-4">Tap to reveal answer</p>
              )}
            </>
          ) : (
            <>
              <Badge variant="outline" className="mb-4 text-xs bg-green-50 text-green-700">Answer</Badge>
              <p className="text-lg font-semibold text-green-700">{question.correct_answer}</p>
              {answer && answer !== question.correct_answer && (
                <p className="text-sm text-red-500 mt-2">Your answer: {answer}</p>
              )}
              {question.explanation && (
                <p className="text-sm text-muted-foreground mt-3">{question.explanation}</p>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      {!flipped && (isMultipleChoice || isTrueFalse) ? (
        <div className="flex justify-center">
          <Button onClick={checkAnswer} disabled={!answer}>
            Check Answer <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      ) : flipped ? (
        <div className="space-y-2">
          <p className="text-xs text-center text-muted-foreground">How well did you know this?</p>
          <div className="flex gap-2 justify-center">
            <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => rate('again')}>
              <X className="mr-1 h-3 w-3" /> Again
            </Button>
            <Button size="sm" variant="outline" className="text-amber-600 border-amber-200 hover:bg-amber-50" onClick={() => rate('hard')}>
              Hard
            </Button>
            <Button size="sm" variant="outline" className="text-green-600 border-green-200 hover:bg-green-50" onClick={() => rate('good')}>
              <Check className="mr-1 h-3 w-3" /> Good
            </Button>
            <Button size="sm" variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50" onClick={() => rate('easy')}>
              Easy
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
