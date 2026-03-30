import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import type { GenerateQuizRequest, QuestionType } from '@setter/shared/types'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function POST(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body: GenerateQuizRequest = await req.json()
  const { subject, topic, questionTypes, questionCount, difficulty, documentText } = body

  if (!subject || !questionTypes.length || questionCount < 1) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const count = Math.min(questionCount, 30)
  const types = questionTypes.join(', ')
  const difficultyStr = difficulty ?? 'mixed'

  const documentContext = documentText
    ? `\n\nGenerate questions based on this study material:\n---\n${documentText.slice(0, 6000)}\n---`
    : ''

  const systemPrompt = `You are a quiz generator for Roma, a 9th grader at Troy High School in the Troy Tech magnet program.

Subject: ${subject}
Topic: ${topic || 'general review'}
Difficulty: ${difficultyStr}
${documentContext}

Generate exactly ${count} questions using these types: ${types}.

Return ONLY valid JSON (no markdown, no code fences) in this exact format:
{
  "title": "descriptive title for this quiz set",
  "questions": [
    {
      "question_type": "multiple_choice",
      "question_text": "What is...",
      "correct_answer": "The answer",
      "options": ["Option A", "Option B", "The answer", "Option D"],
      "explanation": "Brief explanation",
      "difficulty": "medium"
    }
  ]
}

Rules:
- For flashcard: question_text is the term/concept, correct_answer is the definition. No options needed.
- For multiple_choice: provide exactly 4 options including the correct answer, shuffled randomly.
- For true_false: correct_answer must be exactly "True" or "False". No options needed.
- For fill_blank: use ___ in question_text where the answer goes. correct_answer is the missing word/phrase.
- Make questions appropriate for ${subject} at Troy High School level.
- Include clear, educational explanations.
- Vary difficulty across the set if difficulty is "mixed".`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [{ role: 'user', content: 'Generate the quiz now.' }],
      system: systemPrompt,
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''

    // Parse JSON — handle potential markdown code fences
    const jsonStr = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    let parsed: { title: string; questions: Array<{
      question_type: QuestionType
      question_text: string
      correct_answer: string
      options?: string[]
      explanation?: string
      difficulty?: string
    }> }

    try {
      parsed = JSON.parse(jsonStr)
    } catch {
      return NextResponse.json({ error: 'AI returned invalid quiz format. Please try again.' }, { status: 500 })
    }

    if (!parsed.questions?.length) {
      return NextResponse.json({ error: 'No questions generated. Please try again.' }, { status: 500 })
    }

    // Create quiz set
    const { data: quizSet, error: setError } = await supabase
      .from('quiz_sets')
      .insert({
        user_id: user.id,
        title: parsed.title || `${subject} Quiz`,
        subject,
        source_type: documentText ? 'from_document' : 'ai_generated',
        description: topic || null,
        question_count: parsed.questions.length,
      })
      .select()
      .single()

    if (setError || !quizSet) {
      return NextResponse.json({ error: 'Failed to create quiz set' }, { status: 500 })
    }

    // Insert questions
    const questions = parsed.questions.map((q, i) => ({
      quiz_set_id: quizSet.id,
      user_id: user.id,
      question_type: q.question_type,
      question_text: q.question_text,
      correct_answer: q.correct_answer,
      options: q.options ?? null,
      explanation: q.explanation ?? null,
      difficulty: q.difficulty ?? 'medium',
      order_index: i,
    }))

    const { data: insertedQuestions, error: qError } = await supabase
      .from('quiz_questions')
      .insert(questions)
      .select()

    if (qError) {
      return NextResponse.json({ error: 'Failed to save questions' }, { status: 500 })
    }

    // Initialize SR cards for each question
    if (insertedQuestions) {
      const srCards = insertedQuestions.map((q) => ({
        user_id: user.id,
        question_id: q.id,
        ease_factor: 2.5,
        interval_days: 1,
        repetitions: 0,
        next_review_at: new Date().toISOString().split('T')[0],
      }))

      await supabase.from('quiz_sr_cards').insert(srCards)
    }

    return NextResponse.json({
      quizSet,
      questions: insertedQuestions,
    }, { status: 201 })

  } catch (error) {
    console.error('Quiz generation error:', error)
    return NextResponse.json({ error: 'Failed to generate quiz' }, { status: 500 })
  }
}
