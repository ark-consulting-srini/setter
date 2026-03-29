export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-violet-600 via-violet-500 to-indigo-600 p-4">
      <div className="w-full max-w-md">{children}</div>
    </div>
  )
}
