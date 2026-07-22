import { Form, Link } from '@adonisjs/inertia/react'
import type { Data } from '@generated/data'
import { usePage } from '@inertiajs/react'
import { type ReactElement, useEffect } from 'react'
import { Toaster, toast } from 'sonner'
import { Button } from '~/components/ui/button'

export default function Layout({ children }: { children: ReactElement<Data.SharedProps> }) {
  const { url } = usePage()
  // biome-ignore lint/correctness/useExhaustiveDependencies: dismiss the toast whenever the route changes
  useEffect(() => {
    toast.dismiss()
  }, [url])

  useEffect(() => {
    if (children.props.flash.error) {
      toast.error(children.props.flash.error)
    }
    if (children.props.flash.success) {
      toast.success(children.props.flash.success)
    }
  })

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <Link route="home">
            <svg
              width="120"
              height="24"
              viewBox="0 0 195 38"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              role="img"
              aria-labelledby="logo-title"
            >
              <title id="logo-title">Naja Cash</title>
              <path
                d="M180 37.5v-30h-7.5V0H195v7.5h-7.5v30H180ZM150 15V7.5h-15V0h15v7.5h7.5V15H150Zm-15 22.5V30h-7.5V7.5h7.5V30h15v7.5h-15Zm15-7.5v-7.5h7.5V30H150ZM82.5 37.5v-30H90V0h15v7.5h7.5v30H105v-15H90v15h-7.5ZM90 15h15V7.8H90V15ZM45 37.5V0h22.5v7.5h-15V15h15v7.5h-15V30h15v7.5H45ZM0 37.5V0h22.5v7.5H30V15h-7.5v15H30v7.5h-7.5V30H15v-7.5H7.5v15H0ZM7.5 15h14.7V7.5H7.5V15Z"
                fill="currentColor"
              />
            </svg>
          </Link>

          <nav className="flex items-center gap-3">
            {children.props.user ? (
              <>
                <Link
                  route="dashboard"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                  Dashboard
                </Link>
                <Link
                  route="transactions.index"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                  Transactions
                </Link>
                <Link
                  route="categories.index"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                  Categories
                </Link>
                <Link
                  route="recurring.index"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                  Recurring
                </Link>
                <Link
                  route="dashboard"
                  className="flex size-9 items-center justify-center rounded-full bg-secondary text-sm font-medium text-secondary-foreground"
                >
                  {children.props.user.initials}
                </Link>
                <Form route="session.destroy">
                  <Button type="submit" variant="ghost">
                    Logout
                  </Button>
                </Form>
              </>
            ) : (
              <Button asChild>
                <Link route="session.create">Login</Link>
              </Button>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6">{children}</main>
      <Toaster position="top-center" richColors />
    </div>
  )
}
