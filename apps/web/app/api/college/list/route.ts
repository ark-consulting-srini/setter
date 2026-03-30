import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase
    .from('college_list')
    .select('*, college:colleges(*)')
    .eq('user_id', user.id)
    .order('fit_score', { ascending: false })

  return NextResponse.json({ list: data ?? [] })
}

export async function DELETE(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await req.json()
  await supabase.from('college_list').delete().eq('id', id).eq('user_id', user.id)
  return NextResponse.json({ success: true })
}
