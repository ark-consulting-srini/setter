import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: attempt } = await supabase
    .from('quiz_attempts')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (!attempt) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: responses } = await supabase
    .from('quiz_responses')
    .select('*, question:quiz_questions(question_text, correct_answer, question_type, explanation, options)')
    .eq('attempt_id', params.id)
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  const { data: quizSet } = await supabase
    .from('quiz_sets')
    .select('title, subject')
    .eq('id', attempt.quiz_set_id)
    .single()

  return NextResponse.json({
    attempt,
    responses: responses ?? [],
    quizTitle: quizSet?.title ?? 'Unknown',
    subject: quizSet?.subject ?? 'Unknown',
  })
}
