import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { SubmitQuizRequest } from '@setter/shared/types'

export async function POST(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body: SubmitQuizRequest = await req.json()
  const { quizSetId, mode, responses, totalTimeSeconds } = body

  // Fetch full question data (needed for knowledge base)
  const questionIds = responses.map((r) => r.questionId)
  const { data: questions } = await supabase
    .from('quiz_questions')
    .select('id, correct_answer, question_type, question_text, explanation, quiz_set_id')
    .in('id', questionIds)

  // Fetch quiz set for subject info
  const { data: quizSetData } = await supabase
    .from('quiz_sets')
    .select('subject, description')
    .eq('id', quizSetId)
    .single()

  const answerMap = new Map(
    (questions ?? []).map((q) => [q.id, { answer: q.correct_answer, type: q.question_type, text: q.question_text, explanation: q.explanation, setId: q.quiz_set_id }])
  )

  // Grade responses
  let correctCount = 0
  const gradedResponses = responses.map((r) => {
    const correct = answerMap.get(r.questionId)
    const isCorrect = correct
      ? checkAnswer(r.answer, correct.answer, correct.type)
      : false
    if (isCorrect) correctCount++
    return {
      question_id: r.questionId,
      user_id: user.id,
      user_answer: r.answer,
      is_correct: isCorrect,
      time_spent_seconds: r.timeSpentSeconds,
    }
  })

  const score = responses.length > 0
    ? Math.round((correctCount / responses.length) * 100)
    : 0

  // Create attempt
  const { data: attempt, error: attemptError } = await supabase
    .from('quiz_attempts')
    .insert({
      user_id: user.id,
      quiz_set_id: quizSetId,
      mode,
      score: mode === 'test' ? score : null,
      total_questions: responses.length,
      correct_count: correctCount,
      time_spent_seconds: totalTimeSeconds,
      completed_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (attemptError || !attempt) {
    return NextResponse.json({ error: 'Failed to save attempt' }, { status: 500 })
  }

  // Save responses
  const responsesWithAttempt = gradedResponses.map((r) => ({
    ...r,
    attempt_id: attempt.id,
  }))
  await supabase.from('quiz_responses').insert(responsesWithAttempt)

  // Update SR cards (SM-2 algorithm)
  for (const r of gradedResponses) {
    const { data: card } = await supabase
      .from('quiz_sr_cards')
      .select('*')
      .eq('user_id', user.id)
      .eq('question_id', r.question_id)
      .single()

    if (card) {
      const quality = r.is_correct ? 4 : 1 // Simplified: correct=4, wrong=1
      const newEase = Math.max(1.3, card.ease_factor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
      let newInterval: number
      let newReps: number

      if (!r.is_correct) {
        newReps = 0
        newInterval = 1
      } else {
        newReps = card.repetitions + 1
        if (newReps === 1) newInterval = 1
        else if (newReps === 2) newInterval = 6
        else newInterval = Math.round(card.interval_days * newEase)
      }

      const nextReview = new Date()
      nextReview.setDate(nextReview.getDate() + newInterval)

      await supabase
        .from('quiz_sr_cards')
        .update({
          ease_factor: newEase,
          interval_days: newInterval,
          repetitions: newReps,
          next_review_at: nextReview.toISOString().split('T')[0],
          last_reviewed_at: new Date().toISOString(),
        })
        .eq('id', card.id)
    }
  }

  // Update Knowledge Base — track every question, especially wrong ones
  for (const r of gradedResponses) {
    const qData = answerMap.get(r.question_id)
    if (!qData) continue

    // Check if this question already exists in knowledge base
    const { data: existing } = await supabase
      .from('knowledge_entries')
      .select('id, times_seen, times_correct, times_incorrect')
      .eq('user_id', user.id)
      .eq('source_question_id', r.question_id)
      .single()

    if (existing) {
      // Update existing entry
      const newSeen = existing.times_seen + 1
      const newCorrect = existing.times_correct + (r.is_correct ? 1 : 0)
      const newIncorrect = existing.times_incorrect + (r.is_correct ? 0 : 1)
      const masteryScore = newSeen > 0 ? newCorrect / newSeen : 0

      await supabase
        .from('knowledge_entries')
        .update({
          times_seen: newSeen,
          times_correct: newCorrect,
          times_incorrect: newIncorrect,
          mastery_score: masteryScore,
          is_mastered: masteryScore >= 0.8 && newSeen >= 3,
          user_answer: r.user_answer,
          last_tested_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
    } else {
      // Create new knowledge entry
      await supabase
        .from('knowledge_entries')
        .insert({
          user_id: user.id,
          subject: quizSetData?.subject ?? 'Unknown',
          topic: quizSetData?.description ?? null,
          question_text: qData.text,
          correct_answer: qData.answer,
          user_answer: r.user_answer,
          explanation: qData.explanation,
          is_mastered: false,
          times_seen: 1,
          times_correct: r.is_correct ? 1 : 0,
          times_incorrect: r.is_correct ? 0 : 1,
          mastery_score: r.is_correct ? 1.0 : 0.0,
          source_quiz_set_id: quizSetId,
          source_question_id: r.question_id,
          last_tested_at: new Date().toISOString(),
        })
    }
  }

  // Auto-achievement: first quiz or perfect score
  if (score === 100 && mode === 'test') {
    await supabase.from('achievements').insert({
      user_id: user.id,
      title: 'Perfect Score!',
      description: `Scored 100% on a ${mode} quiz`,
      source: 'auto',
      category: 'academic',
      is_portfolio_visible: false,
      achieved_at: new Date().toISOString().split('T')[0],
    })
  }

  return NextResponse.json({
    attempt,
    score,
    correctCount,
    totalQuestions: responses.length,
    results: gradedResponses.map((r) => ({
      questionId: r.question_id,
      userAnswer: r.user_answer,
      isCorrect: r.is_correct,
    })),
  })
}

function checkAnswer(userAnswer: string, correctAnswer: string, questionType: string): boolean {
  if (!userAnswer) return false
  const ua = userAnswer.trim().toLowerCase()
  const ca = correctAnswer.trim().toLowerCase()

  if (questionType === 'true_false' || questionType === 'multiple_choice') {
    return ua === ca
  }

  // For fill_blank and flashcard: fuzzy match
  if (ua === ca) return true
  // Accept if 90%+ similar (simple check)
  if (ca.includes(ua) && ua.length > ca.length * 0.7) return true
  if (ua.includes(ca) && ca.length > ua.length * 0.7) return true
  return false
}
