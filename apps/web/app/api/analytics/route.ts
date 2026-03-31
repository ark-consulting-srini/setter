import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST — track an event
export async function POST(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { eventType, eventData, page, sessionId } = await req.json()

  await supabase.from('usage_analytics').insert({
    user_id: user.id,
    event_type: eventType,
    event_data: eventData ?? {},
    page: page ?? null,
    session_id: sessionId ?? null,
  })

  return NextResponse.json({ success: true })
}

// GET — fetch analytics summary
export async function GET(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const days = parseInt(url.searchParams.get('days') ?? '30')
  const since = new Date(Date.now() - days * 86400000).toISOString()

  const { data: events } = await supabase
    .from('usage_analytics')
    .select('event_type, page, created_at')
    .eq('user_id', user.id)
    .gte('created_at', since)
    .order('created_at', { ascending: false })

  // Aggregate
  const summary: Record<string, number> = {}
  const pageViews: Record<string, number> = {}
  const dailyActivity: Record<string, number> = {}

  for (const e of events ?? []) {
    summary[e.event_type] = (summary[e.event_type] ?? 0) + 1
    if (e.page) pageViews[e.page] = (pageViews[e.page] ?? 0) + 1
    const day = new Date(e.created_at).toISOString().split('T')[0]
    dailyActivity[day] = (dailyActivity[day] ?? 0) + 1
  }

  // Quiz history
  const { data: quizAttempts } = await supabase
    .from('quiz_attempts')
    .select('id, quiz_set_id, mode, score, correct_count, total_questions, time_spent_seconds, completed_at, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  // Get quiz set titles
  const setIds = [...new Set((quizAttempts ?? []).map(a => a.quiz_set_id))]
  const { data: quizSets } = await supabase
    .from('quiz_sets')
    .select('id, title, subject')
    .in('id', setIds.length > 0 ? setIds : ['none'])

  const setMap = new Map((quizSets ?? []).map(s => [s.id, s]))

  const quizHistory = (quizAttempts ?? []).map(a => ({
    ...a,
    quizTitle: setMap.get(a.quiz_set_id)?.title ?? 'Unknown Quiz',
    subject: setMap.get(a.quiz_set_id)?.subject ?? 'Unknown',
  }))

  return NextResponse.json({
    summary,
    pageViews,
    dailyActivity,
    quizHistory,
    totalEvents: events?.length ?? 0,
    activeDays: Object.keys(dailyActivity).length,
  })
}
