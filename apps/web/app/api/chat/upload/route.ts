import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.pptx', '.txt', '.md']

/* eslint-disable @typescript-eslint/no-explicit-any */
async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  try {
    const mod = await import('pdf-parse') as any
    const parser = mod.PDFParse ?? mod.default ?? mod
    if (typeof parser === 'function') {
      const data = await parser(buffer)
      return data.text?.trim() ?? ''
    }
    return '[Could not parse PDF — try a different file]'
  } catch {
    return '[Could not extract text from this PDF]'
  }
}

async function extractTextFromDocx(buffer: Buffer): Promise<string> {
  try {
    const mod = await import('mammoth') as any
    const mammoth = mod.default ?? mod
    const result = await mammoth.extractRawText({ buffer })
    return result.value.trim()
  } catch {
    return '[Could not extract text from this document]'
  }
}

async function extractTextFromPptx(buffer: Buffer): Promise<string> {
  try {
    const mod = await import('pptx-parser') as any
    const parse = mod.default ?? mod
    const slides = await parse(buffer)
    if (Array.isArray(slides)) {
      return slides
        .map((slide: any, i: number) => {
          const text = slide.text || (slide.texts ? slide.texts.join('\n') : '')
          return `--- Slide ${i + 1} ---\n${text}`
        })
        .join('\n\n')
        .trim()
    }
    return String(slides)
  } catch {
    return '[Could not extract text from this presentation — try converting to PDF]'
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

async function extractText(buffer: Buffer, fileName: string): Promise<string> {
  const ext = fileName.toLowerCase().split('.').pop()

  switch (ext) {
    case 'pdf':
      return extractTextFromPdf(buffer)
    case 'docx':
      return extractTextFromDocx(buffer)
    case 'pptx':
      return extractTextFromPptx(buffer)
    case 'txt':
    case 'md':
      return buffer.toString('utf-8').trim()
    default:
      return '[Unsupported file format]'
  }
}

export async function POST(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'File too large. Max size is 10MB.' }, { status: 400 })
  }

  const ext = '.' + file.name.toLowerCase().split('.').pop()
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return NextResponse.json(
      { error: `Unsupported file type. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}` },
      { status: 400 }
    )
  }

  try {
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const extractedText = await extractText(buffer, file.name)

    // Truncate if too long (keep first ~8000 chars to fit in context window)
    const maxChars = 8000
    const truncated = extractedText.length > maxChars
    const content = truncated
      ? extractedText.slice(0, maxChars) + '\n\n[... content truncated — showing first portion of document]'
      : extractedText

    return NextResponse.json({
      success: true,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      extractedText: content,
      truncated,
      charCount: extractedText.length,
    })
  } catch (error) {
    console.error('File processing error:', error)
    return NextResponse.json(
      { error: 'Failed to process file. Please try a different format.' },
      { status: 500 }
    )
  }
}
