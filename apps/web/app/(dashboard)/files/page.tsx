'use client'

import { useState, useEffect } from 'react'
import { FileText, Upload, Trash2, Download, File, Image, FileSpreadsheet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface FileEntry {
  id: string
  file_name: string
  file_size: number | null
  mime_type: string | null
  linked_entity_type: string | null
  created_at: string
}

const FILE_ICONS: Record<string, typeof FileText> = {
  pdf: FileText,
  docx: File,
  pptx: FileSpreadsheet,
  image: Image,
}

function getFileIcon(name: string) {
  const ext = name.split('.').pop()?.toLowerCase()
  if (ext === 'pdf') return FileText
  if (ext === 'pptx' || ext === 'xlsx') return FileSpreadsheet
  if (['png', 'jpg', 'jpeg', 'gif'].includes(ext ?? '')) return Image
  return File
}

function formatSize(bytes: number | null): string {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function FilesPage() {
  const [files, setFiles] = useState<FileEntry[]>([])
  const [uploading, setUploading] = useState(false)

  useEffect(() => { fetchFiles() }, [])

  async function fetchFiles() {
    const res = await fetch('/api/files')
    if (res.ok) { const d = await res.json(); setFiles(d.files) }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      // Extract text (reuse existing endpoint)
      const fd = new FormData(); fd.append('file', file)
      const uploadRes = await fetch('/api/chat/upload', { method: 'POST', body: fd })

      // Save metadata
      await fetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: file.name, fileSize: file.size, mimeType: file.type }),
      })
      fetchFiles()
    } catch {} finally { setUploading(false); e.target.value = '' }
  }

  async function deleteFile(id: string) {
    setFiles(p => p.filter(f => f.id !== id))
    await fetch('/api/files', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Files</h1>
          <p className="text-sm text-muted-foreground">{files.length} document{files.length !== 1 ? 's' : ''} uploaded</p>
        </div>
        <div>
          <input type="file" accept=".pdf,.docx,.pptx,.txt,.xlsx,.png,.jpg" onChange={handleUpload} className="hidden" id="file-upload" />
          <label htmlFor="file-upload">
            <Button asChild disabled={uploading}>
              <span><Upload className="mr-1 h-4 w-4" />{uploading ? 'Uploading...' : 'Upload File'}</span>
            </Button>
          </label>
        </div>
      </div>

      {files.length > 0 ? (
        <div className="space-y-2">
          {files.map(file => {
            const Icon = getFileIcon(file.file_name)
            return (
              <Card key={file.id} className="group">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-pink-50">
                    <Icon className="h-5 w-5 text-pink-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.file_name}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{formatSize(file.file_size)}</span>
                      <span>{new Date(file.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      {file.linked_entity_type && <Badge variant="outline" className="text-[9px]">{file.linked_entity_type}</Badge>}
                    </div>
                  </div>
                  <button onClick={() => deleteFile(file.id)} className="opacity-0 group-hover:opacity-100 p-2 rounded-lg hover:bg-destructive/10 transition-opacity">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-16">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-semibold">No files yet</h3>
          <p className="text-sm text-muted-foreground mt-1">Upload transcripts, homework, or study materials</p>
        </div>
      )}
    </div>
  )
}
