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

describe('RecurringIndex', () => {
  it('shows an empty state when there are no rules', () => {
    render(<RecurringIndex rules={[]} categories={[groceries]} />)

    expect(screen.getByText('No recurring rules yet.')).toBeInTheDocument()
  })

  it('hides archived rules until "Show archived" is toggled', async () => {
    const user = userEvent.setup()
    render(<RecurringIndex rules={[netflix, cancelledGym]} categories={[groceries]} />)

    expect(screen.getByText('Netflix')).toBeInTheDocument()
    expect(screen.queryByText('Gym (cancelled)')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Show archived' }))

    expect(screen.getByText('Gym (cancelled)')).toBeInTheDocument()
    expect(screen.getByText('Archived')).toBeInTheDocument()
  })

  it('opens the create rule dialog', async () => {
    const user = userEvent.setup()
    render(<RecurringIndex rules={[]} categories={[groceries]} />)

    await user.click(screen.getByRole('button', { name: 'New recurring rule' }))

    expect(screen.getByRole('dialog', { name: 'New recurring rule' })).toBeInTheDocument()
    expect(screen.getByLabelText('Name')).toBeInTheDocument()
  })

  it('shows an ongoing rule as having no installment count', () => {
    render(<RecurringIndex rules={[netflix]} categories={[groceries]} />)

    expect(screen.getByText('Ongoing')).toBeInTheDocument()
  })
})
