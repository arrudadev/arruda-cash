import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import CategoriesIndex from '~/pages/categories/index'

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

const oldSubscription = {
  id: 'cat-2',
  name: 'Old subscription',
  color: '#ef4444',
  type: 'expense' as const,
  archivedAt: '2026-02-01T00:00:00.000+00:00',
  createdAt: '2026-01-01T00:00:00.000+00:00',
}

describe('CategoriesIndex', () => {
  it('shows an empty state when there are no categories', () => {
    render(<CategoriesIndex categories={[]} />)

    expect(screen.getByText('No categories yet.')).toBeInTheDocument()
  })

  it('hides archived categories until "Show archived" is toggled', async () => {
    const user = userEvent.setup()
    render(<CategoriesIndex categories={[groceries, oldSubscription]} />)

    expect(screen.getByText('Groceries')).toBeInTheDocument()
    expect(screen.queryByText('Old subscription')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Show archived' }))

    expect(screen.getByText('Old subscription')).toBeInTheDocument()
    expect(screen.getByText('Archived')).toBeInTheDocument()
  })

  it('opens the create category dialog', async () => {
    const user = userEvent.setup()
    render(<CategoriesIndex categories={[]} />)

    await user.click(screen.getByRole('button', { name: 'New category' }))

    expect(screen.getByRole('dialog', { name: 'New category' })).toBeInTheDocument()
    expect(screen.getByLabelText('Name')).toBeInTheDocument()
  })
})
