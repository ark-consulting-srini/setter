export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-red-800 via-red-700 to-red-900 p-4">
      <div className="mb-6 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-red-800 text-2xl font-black shadow-lg">
          S
        </div>
        <h1 className="mt-3 text-2xl font-black text-white tracking-tight">Setter</h1>
        <p className="text-sm text-white/70">Troy Tech &apos;29</p>
      </div>
      <div className="w-full max-w-md">{children}</div>
    </div>
  )
}
