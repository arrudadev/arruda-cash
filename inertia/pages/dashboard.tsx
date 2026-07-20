import { usePage } from '@inertiajs/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import type { InertiaProps } from '~/types'

export default function Dashboard() {
  const { user } = usePage<InertiaProps>().props

  return (
    <div className="py-16">
      <Card className="mx-auto max-w-lg">
        <CardHeader>
          <CardTitle className="text-2xl">You&apos;re logged in</CardTitle>
          <CardDescription>
            This page only renders once your session has been validated by the server.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            <dt className="text-muted-foreground">Name</dt>
            <dd>{user?.fullName ?? '—'}</dd>
            <dt className="text-muted-foreground">Email</dt>
            <dd>{user?.email}</dd>
          </dl>
        </CardContent>
      </Card>
    </div>
  )
}
