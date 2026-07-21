import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import TransactionsIndex from '~/pages/transactions/index'

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
  id: 'cat-groceries',
  name: 'Groceries',
  color: '#22c55e',
  type: 'expense' as const,
  archivedAt: null,
  createdAt: '2026-01-01T00:00:00.000+00:00',
}

const salary = {
  id: 'cat-salary',
  name: 'Salary',
  color: '#eab308',
  type: 'income' as const,
  archivedAt: null,
  createdAt: '2026-01-01T00:00:00.000+00:00',
}

const groceriesTransaction = {
  id: 'txn-1',
  type: 'expense' as const,
  amount: 4250,
  description: 'Weekly shop',
  date: '2026-07-01',
  createdAt: '2026-07-01T00:00:00.000+00:00',
  category: groceries,
}

const emptyFilters = { categoryId: null, type: null, from: null, to: null, search: null }
const pagination = { currentPage: 1, lastPage: 1, total: 0 }

describe('TransactionsIndex', () => {
  it('shows an empty state when there are no transactions', () => {
    render(
      <TransactionsIndex
        transactions={[]}
        pagination={pagination}
        categories={[groceries, salary]}
        filters={emptyFilters}
      />
    )

    expect(screen.getByText('No transactions found.')).toBeInTheDocument()
  })

  it('lists a transaction with its category and formatted amount', () => {
    render(
      <TransactionsIndex
        transactions={[groceriesTransaction]}
        pagination={{ ...pagination, total: 1 }}
        categories={[groceries, salary]}
        filters={emptyFilters}
      />
    )

    const table = screen.getByRole('table')
    expect(within(table).getByText('Groceries')).toBeInTheDocument()
    expect(within(table).getByText('Weekly shop')).toBeInTheDocument()
    expect(within(table).getByText(/42,50/)).toBeInTheDocument()
  })

  it('filters the category picker by the selected type in the create dialog', async () => {
    const user = userEvent.setup()
    render(
      <TransactionsIndex
        transactions={[]}
        pagination={pagination}
        categories={[groceries, salary]}
        filters={emptyFilters}
      />
    )

    await user.click(screen.getByRole('button', { name: 'New transaction' }))
    const dialog = screen.getByRole('dialog', { name: 'New transaction' })

    // Defaults to expense: only Groceries is offered.
    await user.click(within(dialog).getByRole('combobox', { name: 'Category' }))
    expect(screen.getByRole('option', { name: 'Groceries' })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'Salary' })).not.toBeInTheDocument()
    await user.keyboard('{Escape}')

    // Switching to income offers Salary instead.
    await user.click(within(dialog).getByRole('button', { name: 'Income' }))
    await user.click(within(dialog).getByRole('combobox', { name: 'Category' }))
    expect(screen.getByRole('option', { name: 'Salary' })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'Groceries' })).not.toBeInTheDocument()
  })
})
