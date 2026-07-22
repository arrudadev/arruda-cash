import { Form, Link } from '@adonisjs/inertia/react'
import type { Data } from '@generated/data'
import { endOfMonth, endOfYear, format, startOfMonth, startOfYear, subMonths } from 'date-fns'
import { useEffect, useState } from 'react'
import { client } from '~/client'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '~/components/ui/sheet'
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

type Period = { from: string; to: string }

type CommittedSummary = {
  month: string
  income: number
  expense: number
  balance: number
  confirmedIncome: number
  confirmedExpense: number
  pendingIncome: number
  pendingExpense: number
}

type Props = {
  period: Period
  income: number
  expense: number
  balance: number
  breakdown: BreakdownItem[]
  committed: CommittedSummary
}

const dateFmt = 'yyyy-MM-dd'

function preset(from: Date, to: Date) {
  return { from: format(from, dateFmt), to: format(to, dateFmt) }
}

function isActivePreset(period: Period, candidate: Period) {
  return period.from === candidate.from && period.to === candidate.to
}

function CategoryDrilldown({
  category,
  period,
  onOpenChange,
}: {
  category: { id: string; name: string } | null
  period: Period
  onOpenChange: (open: boolean) => void
}) {
  const [transactions, setTransactions] = useState<Data.Transaction[] | null>(null)

  useEffect(() => {
    if (!category) {
      setTransactions(null)
      return
    }

    let cancelled = false
    setTransactions(null)

    client
      .request('dashboard.category_transactions', {
        params: { categoryId: category.id },
        query: { from: period.from, to: period.to },
      })
      .safe()
      .then(([result]) => {
        if (!cancelled) {
          setTransactions(result?.data ?? [])
        }
      })

    return () => {
      cancelled = true
    }
  }, [category, period])

  return (
    <Sheet open={category !== null} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{category?.name}</SheetTitle>
          <SheetDescription>Transactions in the selected period.</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-3 px-4">
          {transactions === null && <p className="text-sm text-muted-foreground">Loading...</p>}
          {transactions?.length === 0 && (
            <p className="text-sm text-muted-foreground">No transactions found.</p>
          )}
          {transactions?.map((transaction) => (
            <div key={transaction.id} className="flex items-center justify-between text-sm">
              <div>
                <p className="font-medium">{transaction.description ?? '—'}</p>
                <p className="text-muted-foreground">{(transaction.date ?? '').slice(0, 10)}</p>
              </div>
              <span
                className={cn(
                  'font-medium',
                  transaction.type === 'income' ? 'text-green-600' : 'text-destructive'
                )}
              >
                {transaction.type === 'income' ? '+' : '-'}
                {formatBRL(transaction.amount)}
              </span>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  )
}

export default function Dashboard({
  period,
  income,
  expense,
  balance,
  breakdown,
  committed,
}: Props) {
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
  const [selectedCategory, setSelectedCategory] = useState<{ id: string; name: string } | null>(
    null
  )

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

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
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
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Committed this month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-destructive">
              {formatBRL(committed.expense)}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {formatBRL(committed.confirmedExpense)} confirmed ·{' '}
              {formatBRL(committed.pendingExpense)} to confirm
            </p>
            <Link
              route="recurring.index"
              className="mt-2 inline-block text-sm font-medium text-primary hover:underline"
            >
              View recurring →
            </Link>
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
            <button
              key={item.categoryId}
              type="button"
              className="flex items-center gap-3 rounded-md p-1 text-left hover:bg-accent"
              onClick={() => setSelectedCategory({ id: item.categoryId, name: item.name })}
            >
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
            </button>
          ))}
        </CardContent>
      </Card>

      <CategoryDrilldown
        category={selectedCategory}
        period={period}
        onOpenChange={(open) => !open && setSelectedCategory(null)}
      />
    </div>
  )
}
