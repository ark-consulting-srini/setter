import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { Toaster } from '@/components/ui/toaster'
import './globals.css'

export const metadata: Metadata = {
  title: 'Setter — Your Personal Companion',
  description: 'Plan, reflect, achieve. Your AI-powered study companion.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={GeistSans.className}>
      <body className="min-h-screen">
        {children}
        <Toaster />
      </body>
    </html>
  )
}
