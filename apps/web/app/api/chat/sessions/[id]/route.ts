import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET — load a specific session with full messages
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('chat_sessions')
    .select('id, title, subject, messages, created_at, updated_at')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  return NextResponse.json({
    id: data.id,
    title: data.title,
    subject: data.subject,
    messages: data.messages,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  })
}
