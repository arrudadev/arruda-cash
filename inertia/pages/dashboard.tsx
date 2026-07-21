import { Form, Link } from '@adonisjs/inertia/react'
import { endOfMonth, endOfYear, format, startOfMonth, startOfYear, subMonths } from 'date-fns'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { formatBRL } from '~/lib/format'
import { cn } from '~/lib/utils'

type BreakdownItem = {
  categoryId: string
  name: string
  color: string
  type: 'income' | 'expense'
  archived: boolean
  total: number
}

type Props = {
  period: { from: string; to: string }
  income: number
  expense: number
  balance: number
  breakdown: BreakdownItem[]
}

const dateFmt = 'yyyy-MM-dd'

function preset(from: Date, to: Date) {
  return { from: format(from, dateFmt), to: format(to, dateFmt) }
}

function isActivePreset(period: Props['period'], candidate: { from: string; to: string }) {
  return period.from === candidate.from && period.to === candidate.to
}

export default function Dashboard({ period, income, expense, balance, breakdown }: Props) {
  const now = new Date()
  const presets = [
    { label: 'This month', range: preset(startOfMonth(now), endOfMonth(now)) },
    {
      label: 'Last month',
      range: preset(startOfMonth(subMonths(now, 1)), endOfMonth(subMonths(now, 1))),
    },
    { label: 'This year', range: preset(startOfYear(now), endOfYear(now)) },
  ]

  const maxTotal = Math.max(...breakdown.map((item) => item.total), 1)

  return (
    <div className="py-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-2xl font-semibold">Dashboard</h1>

        <div className="flex flex-wrap items-end gap-3">
          <div className="flex gap-2">
            {presets.map((item) => (
              <Link
                key={item.label}
                route="dashboard"
                data={item.range}
                className={cn(
                  'inline-flex h-9 items-center rounded-md border px-3 text-sm font-medium',
                  isActivePreset(period, item.range)
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-input bg-background hover:bg-accent'
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <Form route="dashboard" className="flex items-end gap-2">
            {() => (
              <>
                <div className="grid gap-1.5">
                  <Label htmlFor="from">From</Label>
                  <Input id="from" name="from" type="date" defaultValue={period.from} />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="to">To</Label>
                  <Input id="to" name="to" type="date" defaultValue={period.to} />
                </div>
                <Button type="submit" variant="secondary">
                  Apply
                </Button>
              </>
            )}
          </Form>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Income</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold text-green-600">
            {formatBRL(income)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Expense</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold text-destructive">
            {formatBRL(expense)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Balance</CardTitle>
          </CardHeader>
          <CardContent
            className={cn(
              'text-2xl font-semibold',
              balance >= 0 ? 'text-green-600' : 'text-destructive'
            )}
          >
            {formatBRL(balance)}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>By category</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {breakdown.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No transactions in this period.
            </p>
          )}
          {breakdown.map((item) => (
            <div key={item.categoryId} className="flex items-center gap-3">
              <span
                className="size-3 shrink-0 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <div className="flex-1">
                <div className="mb-1 flex items-center gap-2 text-sm">
                  <span className="font-medium">{item.name}</span>
                  {item.archived && (
                    <Badge variant="secondary" className="text-xs">
                      Archived
                    </Badge>
                  )}
                  <span className="ml-auto text-muted-foreground">{formatBRL(item.total)}</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-muted">
                  <div
                    className="h-1.5 rounded-full"
                    style={{
                      width: `${(item.total / maxTotal) * 100}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
