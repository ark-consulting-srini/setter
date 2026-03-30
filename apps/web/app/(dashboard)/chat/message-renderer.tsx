'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cn } from '@/lib/utils'

interface MessageRendererProps {
  content: string
  role: 'user' | 'assistant'
}

export function MessageRenderer({ content, role }: MessageRendererProps) {
  if (role === 'user') {
    return <p className="whitespace-pre-wrap">{content}</p>
  }

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>,
        h1: ({ children }) => <h1 className="text-lg font-bold mb-2 mt-4 first:mt-0">{children}</h1>,
        h2: ({ children }) => <h2 className="text-base font-bold mb-2 mt-3 first:mt-0">{children}</h2>,
        h3: ({ children }) => <h3 className="text-sm font-bold mb-1.5 mt-2 first:mt-0">{children}</h3>,
        ul: ({ children }) => <ul className="mb-3 ml-4 list-disc space-y-1 last:mb-0">{children}</ul>,
        ol: ({ children }) => <ol className="mb-3 ml-4 list-decimal space-y-1 last:mb-0">{children}</ol>,
        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
        em: ({ children }) => <em className="italic">{children}</em>,
        code: ({ className, children, ...props }) => {
          const isBlock = className?.includes('language-')
          if (isBlock) {
            const lang = className?.replace('language-', '') ?? ''
            return (
              <div className="mb-3 last:mb-0">
                {lang && (
                  <div className="rounded-t-lg bg-zinc-800 px-3 py-1.5 text-[10px] font-medium text-zinc-400">
                    {lang}
                  </div>
                )}
                <pre className={cn('overflow-x-auto rounded-b-lg bg-zinc-900 p-3 text-xs text-zinc-100', !lang && 'rounded-t-lg')}>
                  <code {...props}>{children}</code>
                </pre>
              </div>
            )
          }
          return (
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono" {...props}>
              {children}
            </code>
          )
        },
        pre: ({ children }) => <>{children}</>,
        blockquote: ({ children }) => (
          <blockquote className="mb-3 border-l-3 border-primary/30 pl-3 italic text-muted-foreground last:mb-0">
            {children}
          </blockquote>
        ),
        table: ({ children }) => (
          <div className="mb-3 overflow-x-auto last:mb-0">
            <table className="w-full border-collapse text-xs">{children}</table>
          </div>
        ),
        thead: ({ children }) => <thead className="bg-muted/50">{children}</thead>,
        th: ({ children }) => <th className="border border-border px-2 py-1.5 text-left font-semibold">{children}</th>,
        td: ({ children }) => <td className="border border-border px-2 py-1.5">{children}</td>,
        hr: () => <hr className="my-4 border-border" />,
        a: ({ href, children }) => (
          <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline hover:no-underline">
            {children}
          </a>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  )
}
