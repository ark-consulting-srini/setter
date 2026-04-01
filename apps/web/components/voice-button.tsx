'use client'

import { useState, useRef, useCallback } from 'react'
import { Mic, MicOff } from 'lucide-react'
import { cn } from '@/lib/utils'

interface VoiceButtonProps {
  onTranscript: (text: string) => void
  className?: string
  size?: 'sm' | 'md'
}

export function VoiceButton({ onTranscript, className, size = 'md' }: VoiceButtonProps) {
  const [listening, setListening] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null)

  const toggle = useCallback(() => {
    if (listening) {
      recognitionRef.current?.stop()
      setListening(false)
      return
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any
    const SpeechRecognition = w.SpeechRecognition ?? w.webkitSpeechRecognition

    if (!SpeechRecognition) {
      alert('Voice input is not supported in this browser.')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'en-US'

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      onTranscript(transcript)
      setListening(false)
    }

    recognition.onerror = () => setListening(false)
    recognition.onend = () => setListening(false)

    recognitionRef.current = recognition
    recognition.start()
    setListening(true)
  }, [listening, onTranscript])

  const sizeClass = size === 'sm' ? 'h-8 w-8' : 'h-10 w-10'
  const iconSize = size === 'sm' ? 14 : 18

  return (
    <button
      onClick={toggle}
      className={cn(
        'rounded-full flex items-center justify-center transition-all',
        listening
          ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-200'
          : 'bg-muted text-muted-foreground hover:bg-accent hover:text-foreground',
        sizeClass,
        className
      )}
      title={listening ? 'Stop listening' : 'Voice input'}
    >
      {listening ? <MicOff className={`h-[${iconSize}px] w-[${iconSize}px]`} /> : <Mic className={`h-[${iconSize}px] w-[${iconSize}px]`} />}
    </button>
  )
}
