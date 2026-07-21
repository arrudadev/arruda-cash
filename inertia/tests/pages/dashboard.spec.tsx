import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import Dashboard from '~/pages/dashboard'

type FormSlotProps = { errors: Record<string, string>; processing: boolean }

vi.mock('@adonisjs/inertia/react', () => ({
  Form: ({
    children,
    route,
    ...props
  }: { children: ReactNode | ((slot: FormSlotProps) => ReactNode); route: string } & Record<
    string,
    unknown
  >) => (
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

describe('Dashboard', () => {
  it('shows income, expense and balance totals', () => {
    render(
      <Dashboard
        period={{ from: '2026-07-01', to: '2026-07-31' }}
        income={500000}
        expense={100000}
        balance={400000}
        breakdown={[]}
      />
    )

    expect(screen.getByText(/R\$\s*5\.000,00/)).toBeInTheDocument()
    expect(screen.getByText(/R\$\s*1\.000,00/)).toBeInTheDocument()
    expect(screen.getByText(/R\$\s*4\.000,00/)).toBeInTheDocument()
  })

  it('shows an empty state when there is no breakdown', () => {
    render(
      <Dashboard
        period={{ from: '2026-07-01', to: '2026-07-31' }}
        income={0}
        expense={0}
        balance={0}
        breakdown={[]}
      />
    )

    expect(screen.getByText('No transactions in this period.')).toBeInTheDocument()
  })

  it('lists the category breakdown with archived categories marked', () => {
    render(
      <Dashboard
        period={{ from: '2026-07-01', to: '2026-07-31' }}
        income={0}
        expense={2000}
        balance={-2000}
        breakdown={[
          {
            categoryId: 'cat-1',
            name: 'Old subscription',
            color: '#ef4444',
            type: 'expense',
            archived: true,
            total: 2000,
          },
        ]}
      />
    )

    expect(screen.getByText('Old subscription')).toBeInTheDocument()
    expect(screen.getByText('Archived')).toBeInTheDocument()
  })

  it('pre-fills the custom range inputs with the current period', () => {
    render(
      <Dashboard
        period={{ from: '2026-07-01', to: '2026-07-31' }}
        income={0}
        expense={0}
        balance={0}
        breakdown={[]}
      />
    )

    expect(screen.getByLabelText('From')).toHaveValue('2026-07-01')
    expect(screen.getByLabelText('To')).toHaveValue('2026-07-31')
  })
})
