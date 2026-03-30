import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const setId = url.searchParams.get('setId')
  if (!setId) return NextResponse.json({ error: 'Missing setId' }, { status: 400 })

  const { data, error } = await supabase
    .from('quiz_questions')
    .select('*')
    .eq('quiz_set_id', setId)
    .eq('user_id', user.id)
    .order('order_index', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
