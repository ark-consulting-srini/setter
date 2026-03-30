export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-pink-100 via-pink-50 to-white p-4">
      <div className="mb-6 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-pink-400 text-white text-2xl font-bold shadow-lg">
          S
        </div>
        <h1 className="mt-3 text-2xl font-bold text-foreground tracking-tight">Setter</h1>
        <p className="text-sm text-muted-foreground">your personal companion</p>
      </div>
      <div className="w-full max-w-md">{children}</div>
    </div>
  )
}
