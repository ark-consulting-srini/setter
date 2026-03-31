import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET — list all uploaded files
export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase
    .from('uploads')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return NextResponse.json({ files: data ?? [] })
}

// POST — save file metadata after upload
export async function POST(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { fileName, fileSize, mimeType, linkedTo, extractedText } = await req.json()

  const { data, error } = await supabase
    .from('uploads')
    .insert({
      user_id: user.id,
      file_path: `uploads/${user.id}/${Date.now()}_${fileName}`,
      file_name: fileName,
      file_size: fileSize ?? null,
      mime_type: mimeType ?? null,
      linked_entity_type: linkedTo ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ file: data })
}

// DELETE — delete a file
export async function DELETE(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await req.json()
  await supabase.from('uploads').delete().eq('id', id).eq('user_id', user.id)
  return NextResponse.json({ success: true })
}
