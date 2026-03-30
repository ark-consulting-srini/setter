import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET — list all quiz sets with stats
export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: sets } = await supabase
    .from('quiz_sets')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  // Get best scores for each set
  const { data: attempts } = await supabase
    .from('quiz_attempts')
    .select('quiz_set_id, score, mode')
    .eq('user_id', user.id)
    .eq('mode', 'test')
    .not('score', 'is', null)

  const bestScores: Record<string, number> = {}
  const attemptCounts: Record<string, number> = {}
  for (const a of attempts ?? []) {
    const setId = a.quiz_set_id
    attemptCounts[setId] = (attemptCounts[setId] ?? 0) + 1
    if (!bestScores[setId] || a.score > bestScores[setId]) {
      bestScores[setId] = a.score
    }
  }

  // Get review cards due
  const { count: reviewDue } = await supabase
    .from('quiz_sr_cards')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .lte('next_review_at', new Date().toISOString().split('T')[0])

  const enrichedSets = (sets ?? []).map((s) => ({
    ...s,
    bestScore: bestScores[s.id] ?? null,
    attemptCount: attemptCounts[s.id] ?? 0,
  }))

  return NextResponse.json({ sets: enrichedSets, reviewDue: reviewDue ?? 0 })
}

// DELETE — delete a quiz set
export async function DELETE(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  await supabase.from('quiz_sets').delete().eq('id', id).eq('user_id', user.id)
  return NextResponse.json({ success: true })
}
