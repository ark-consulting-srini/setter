import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { CreateJournalEntryRequest } from '@setter/shared/types'

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body: CreateJournalEntryRequest = await req.json()

  const { data, error } = await supabase
    .from('journal_entries')
    .insert({
      user_id: user.id,
      content: body.content ?? '',
      mood: body.mood ?? null,
      prompt_used: body.prompt_used ?? null,
      is_private: body.is_private ?? false,
      has_attachment: false,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
