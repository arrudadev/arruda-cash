import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import RecurringIndex from '~/pages/recurring/index'

type FormSlotProps = { errors: Record<string, string>; processing: boolean }

vi.mock('@adonisjs/inertia/react', () => ({
  Form: ({
    children,
    route,
    routeParams,
    onSuccess,
    ...props
  }: {
    children: ReactNode | ((slot: FormSlotProps) => ReactNode)
    route: string
    routeParams?: Record<string, string>
    onSuccess?: () => void
  } & Record<string, unknown>) => (
    <form {...props}>
      {typeof children === 'function' ? children({ errors: {}, processing: false }) : children}
    </form>
  ),
  Link: ({
    children,
    route,
    data,
    ...props
  }: { children: ReactNode; route: string; data?: unknown } & Record<string, unknown>) => (
    <a {...props}>{children}</a>
  ),
}))

const groceries = {
  id: 'cat-1',
  name: 'Groceries',
  color: '#22c55e',
  type: 'expense' as const,
  archivedAt: null,
  createdAt: '2026-01-01T00:00:00.000+00:00',
}

const netflix = {
  id: 'rule-1',
  type: 'expense' as const,
  name: 'Netflix',
  amount: 3990,
  kind: 'fixed' as const,
  dayOfMonth: 10,
  startMonth: '2026-07-01',
  installmentsTotal: null,
  installmentsRemaining: null,
  archivedAt: null,
  createdAt: '2026-01-01T00:00:00.000+00:00',
  category: groceries,
}

const cancelledGym = {
  ...netflix,
  id: 'rule-2',
  name: 'Gym (cancelled)',
  archivedAt: '2026-02-01T00:00:00.000+00:00',
}

const fridgeInstallments = {
  ...netflix,
  id: 'rule-3',
  name: 'Fridge, 12x',
  installmentsTotal: 12,
  installmentsRemaining: 9,
}

const emptySummary = { month: '2026-07-01', income: 0, expense: 0, balance: 0 }

const netflixInstance = {
  ruleId: netflix.id,
  name: netflix.name,
  type: netflix.type,
  kind: netflix.kind,
  amount: netflix.amount,
  dayOfMonth: netflix.dayOfMonth,
  categoryId: groceries.id,
  categoryName: groceries.name,
  categoryColor: groceries.color,
  installmentIndex: null,
  installmentsTotal: null,
  confirmed: false,
  transactionId: null,
}

const electricityInstance = {
  ...netflixInstance,
  ruleId: 'rule-electricity',
  name: 'Electricity',
  kind: 'variable' as const,
  amount: 20000,
}

describe('RecurringIndex', () => {
  it('shows an empty state when there are no rules or committed instances', () => {
    render(
      <RecurringIndex
        rules={[]}
        categories={[groceries]}
        month="2026-07-01"
        instances={[]}
        summary={emptySummary}
      />
    )

    expect(screen.getByText('No recurring rules yet.')).toBeInTheDocument()
    expect(screen.getByText('Nothing committed for this month.')).toBeInTheDocument()
  })

  it('hides archived rules until "Show archived" is toggled', async () => {
    const user = userEvent.setup()
    render(
      <RecurringIndex
        rules={[netflix, cancelledGym]}
        categories={[groceries]}
        month="2026-07-01"
        instances={[]}
        summary={emptySummary}
      />
    )

    expect(screen.getByText('Netflix')).toBeInTheDocument()
    expect(screen.queryByText('Gym (cancelled)')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Show archived' }))

    expect(screen.getByText('Gym (cancelled)')).toBeInTheDocument()
    expect(screen.getByText('Archived')).toBeInTheDocument()
  })

  it('opens the create rule dialog', async () => {
    const user = userEvent.setup()
    render(
      <RecurringIndex
        rules={[]}
        categories={[groceries]}
        month="2026-07-01"
        instances={[]}
        summary={emptySummary}
      />
    )

    await user.click(screen.getByRole('button', { name: 'New recurring rule' }))

    expect(screen.getByRole('dialog', { name: 'New recurring rule' })).toBeInTheDocument()
    expect(screen.getByLabelText('Name')).toBeInTheDocument()
  })

  it('shows an ongoing rule as having no installment count', () => {
    render(
      <RecurringIndex
        rules={[netflix]}
        categories={[groceries]}
        month="2026-07-01"
        instances={[]}
        summary={emptySummary}
      />
    )

    expect(screen.getByText('Ongoing')).toBeInTheDocument()
  })

  it('shows how many installments are left for a parcelled rule', () => {
    render(
      <RecurringIndex
        rules={[fridgeInstallments]}
        categories={[groceries]}
        month="2026-07-01"
        instances={[]}
        summary={emptySummary}
      />
    )

    expect(screen.getByText('9 of 12 left')).toBeInTheDocument()
  })

  it("renders the committed summary and this month's instances", () => {
    render(
      <RecurringIndex
        rules={[netflix]}
        categories={[groceries]}
        month="2026-07-01"
        instances={[netflixInstance]}
        summary={{ month: '2026-07-01', income: 0, expense: 3990, balance: -3990 }}
      />
    )

    expect(screen.getByText('Committed — July 2026')).toBeInTheDocument()
    expect(screen.getAllByText('Netflix').length).toBeGreaterThan(0)
    expect(screen.getByText('This month')).toBeInTheDocument()
    expect(screen.getByText('Next month')).toBeInTheDocument()
  })

  it('offers a one-click confirm for a fixed rule, with no editable amount', () => {
    render(
      <RecurringIndex
        rules={[netflix]}
        categories={[groceries]}
        month="2026-07-01"
        instances={[netflixInstance]}
        summary={{ month: '2026-07-01', income: 0, expense: 3990, balance: -3990 }}
      />
    )

    expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument()
    expect(screen.queryByLabelText('Amount for Netflix')).not.toBeInTheDocument()
  })

  it('lets a variable rule confirmation edit the amount before submitting', () => {
    render(
      <RecurringIndex
        rules={[netflix]}
        categories={[groceries]}
        month="2026-07-01"
        instances={[electricityInstance]}
        summary={{ month: '2026-07-01', income: 0, expense: 20000, balance: -20000 }}
      />
    )

    expect(screen.getByLabelText('Amount for Electricity')).toHaveValue(200)
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument()
  })

  it('shows a confirmed instance as confirmed, with no confirm action', () => {
    render(
      <RecurringIndex
        rules={[netflix]}
        categories={[groceries]}
        month="2026-07-01"
        instances={[{ ...netflixInstance, confirmed: true, transactionId: 'txn-1' }]}
        summary={{ month: '2026-07-01', income: 0, expense: 3990, balance: -3990 }}
      />
    )

    expect(screen.getByText('Confirmed')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Confirm' })).not.toBeInTheDocument()
  })
})
