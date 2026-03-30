import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET — list knowledge entries with filters
export async function GET(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const subject = url.searchParams.get('subject')
  const filter = url.searchParams.get('filter') // 'weak', 'mastered', 'all'

  let query = supabase
    .from('knowledge_entries')
    .select('*')
    .eq('user_id', user.id)
    .order('mastery_score', { ascending: true })

  if (subject) {
    query = query.eq('subject', subject)
  }

  if (filter === 'weak') {
    query = query.lt('mastery_score', 0.6)
  } else if (filter === 'mastered') {
    query = query.eq('is_mastered', true)
  }

  const { data, error } = await query.limit(100)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Compute stats
  const all = data ?? []
  const weak = all.filter((e) => e.mastery_score < 0.6)
  const mastered = all.filter((e) => e.is_mastered)
  const subjectBreakdown: Record<string, { total: number; weak: number; mastered: number }> = {}

  for (const entry of all) {
    if (!subjectBreakdown[entry.subject]) {
      subjectBreakdown[entry.subject] = { total: 0, weak: 0, mastered: 0 }
    }
    subjectBreakdown[entry.subject].total++
    if (entry.mastery_score < 0.6) subjectBreakdown[entry.subject].weak++
    if (entry.is_mastered) subjectBreakdown[entry.subject].mastered++
  }

  return NextResponse.json({
    entries: data,
    stats: {
      total: all.length,
      weak: weak.length,
      mastered: mastered.length,
      subjects: subjectBreakdown,
    },
  })
}

// PATCH — mark entry as mastered manually
export async function PATCH(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, is_mastered } = await req.json()

  await supabase
    .from('knowledge_entries')
    .update({ is_mastered })
    .eq('id', id)
    .eq('user_id', user.id)

  return NextResponse.json({ success: true })
}
