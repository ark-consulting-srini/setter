'use client'

import { useEffect } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Dashboard error:', error)
  }, [error])

  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <Card className="max-w-md">
        <CardContent className="flex flex-col items-center py-10 text-center">
          <AlertCircle className="mb-4 h-12 w-12 text-destructive/60" />
          <h2 className="mb-2 text-lg font-semibold">Something went wrong</h2>
          <p className="mb-6 text-sm text-muted-foreground">
            Don&apos;t worry — it&apos;s not your fault. Let&apos;s try that again.
          </p>
          <Button onClick={reset}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Try again
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
