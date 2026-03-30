import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET — fetch questions due for spaced repetition review
export async function GET(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const subject = url.searchParams.get('subject')
  const today = new Date().toISOString().split('T')[0]

  const { data: cards } = await supabase
    .from('quiz_sr_cards')
    .select(`
      id, ease_factor, interval_days, repetitions, next_review_at,
      question:quiz_questions (
        id, question_type, question_text, correct_answer, options, explanation, difficulty,
        quiz_set:quiz_sets ( title, subject )
      )
    `)
    .eq('user_id', user.id)
    .lte('next_review_at', today)
    .order('next_review_at', { ascending: true })
    .limit(20)

  // Filter by subject if requested
  let filtered = cards ?? []
  if (subject) {
    filtered = filtered.filter((c: Record<string, unknown>) => {
      const q = c.question as Record<string, unknown> | null
      const qs = q?.quiz_set as Record<string, unknown> | null
      return qs?.subject === subject
    })
  }

  return NextResponse.json({ cards: filtered, total: filtered.length })
}
