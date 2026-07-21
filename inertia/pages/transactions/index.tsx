import { Form, Link } from '@adonisjs/inertia/react'
import type { Data } from '@generated/data'
import { useState } from 'react'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'
import { Textarea } from '~/components/ui/textarea'
import { formatBRL } from '~/lib/format'

type Category = Data.Category
type Transaction = Data.Transaction
type TransactionType = Category['type']

type Filters = {
  categoryId: string | null
  type: string | null
  from: string | null
  to: string | null
  search: string | null
}

type Props = {
  transactions: Transaction[]
  pagination: { currentPage: number; lastPage: number; total: number }
  categories: Category[]
  filters: Filters
}

function centsToReaisInput(cents: number) {
  return (cents / 100).toFixed(2)
}

function TransactionFormFields({
  categories,
  type,
  onTypeChange,
  defaults,
  errors,
}: {
  categories: Category[]
  type: TransactionType
  onTypeChange: (type: TransactionType) => void
  defaults?: {
    categoryId: string
    amount: string
    date: string
    description: string | null
  }
  errors: Record<string, string>
}) {
  const availableCategories = categories.filter(
    (category) => !category.archivedAt && category.type === type
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-2">
        <Label>Type</Label>
        <div className="flex gap-2">
          <Button
            type="button"
            variant={type === 'expense' ? 'default' : 'outline'}
            className="flex-1"
            onClick={() => onTypeChange('expense')}
          >
            Expense
          </Button>
          <Button
            type="button"
            variant={type === 'income' ? 'default' : 'outline'}
            className="flex-1"
            onClick={() => onTypeChange('income')}
          >
            Income
          </Button>
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="categoryId">Category</Label>
        <Select
          name="categoryId"
          key={type}
          defaultValue={
            defaults?.categoryId && availableCategories.some((c) => c.id === defaults.categoryId)
              ? defaults.categoryId
              : undefined
          }
        >
          <SelectTrigger id="categoryId" className="w-full">
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {availableCategories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.categoryId && <p className="text-sm text-destructive">{errors.categoryId}</p>}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="amount">Amount (R$)</Label>
        <Input
          id="amount"
          name="amount"
          type="number"
          step="0.01"
          min="0"
          defaultValue={defaults?.amount}
          aria-invalid={errors.amount ? true : undefined}
        />
        {errors.amount && <p className="text-sm text-destructive">{errors.amount}</p>}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="date">Date</Label>
        <Input
          id="date"
          name="date"
          type="date"
          defaultValue={defaults?.date}
          aria-invalid={errors.date ? true : undefined}
        />
        {errors.date && <p className="text-sm text-destructive">{errors.date}</p>}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" defaultValue={defaults?.description ?? ''} />
        {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
      </div>
    </div>
  )
}

function CreateTransactionDialog({
  categories,
  open,
  onOpenChange,
}: {
  categories: Category[]
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [type, setType] = useState<TransactionType>('expense')

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) setType('expense')
        onOpenChange(next)
      }}
    >
      <DialogTrigger asChild>
        <Button>New transaction</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New transaction</DialogTitle>
        </DialogHeader>
        <Form route="transactions.store" onSuccess={() => onOpenChange(false)}>
          {({ errors, processing }) => (
            <div className="flex flex-col gap-4">
              <TransactionFormFields
                categories={categories}
                type={type}
                onTypeChange={setType}
                errors={errors}
              />
              <Button type="submit" disabled={processing} className="w-full">
                Create transaction
              </Button>
            </div>
          )}
        </Form>
      </DialogContent>
    </Dialog>
  )
}

function EditTransactionDialog({
  categories,
  transaction,
  onOpenChange,
}: {
  categories: Category[]
  transaction: Transaction | null
  onOpenChange: (open: boolean) => void
}) {
  const [type, setType] = useState<TransactionType>(transaction?.category?.type ?? 'expense')

  return (
    <Dialog
      open={transaction !== null}
      onOpenChange={(next) => {
        if (!next) onOpenChange(false)
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit transaction</DialogTitle>
        </DialogHeader>
        {transaction && (
          <Form
            route="transactions.update"
            routeParams={{ id: transaction.id }}
            onSuccess={() => onOpenChange(false)}
          >
            {({ errors, processing }) => (
              <div className="flex flex-col gap-4">
                <TransactionFormFields
                  categories={categories}
                  type={type}
                  onTypeChange={setType}
                  defaults={{
                    categoryId: transaction.category?.id ?? '',
                    amount: centsToReaisInput(transaction.amount),
                    date: (transaction.date ?? '').slice(0, 10),
                    description: transaction.description,
                  }}
                  errors={errors}
                />
                <Button type="submit" disabled={processing} className="w-full">
                  Save changes
                </Button>
              </div>
            )}
          </Form>
        )}
      </DialogContent>
    </Dialog>
  )
}

function FilterBar({ categories, filters }: { categories: Category[]; filters: Filters }) {
  return (
    <Form route="transactions.index" className="mb-4">
      {() => (
        <div className="flex flex-wrap items-end gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="filter-search">Search</Label>
            <Input
              id="filter-search"
              name="search"
              placeholder="Description..."
              defaultValue={filters.search ?? ''}
              className="w-48"
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="filter-category">Category</Label>
            <Select name="categoryId" defaultValue={filters.categoryId ?? undefined}>
              <SelectTrigger id="filter-category" className="w-40">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                    {category.archivedAt ? ' (archived)' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="filter-type">Type</Label>
            <Select name="type" defaultValue={filters.type ?? undefined}>
              <SelectTrigger id="filter-type" className="w-32">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="expense">Expense</SelectItem>
                <SelectItem value="income">Income</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="filter-from">From</Label>
            <Input id="filter-from" name="from" type="date" defaultValue={filters.from ?? ''} />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="filter-to">To</Label>
            <Input id="filter-to" name="to" type="date" defaultValue={filters.to ?? ''} />
          </div>

          <Button type="submit" variant="secondary">
            Filter
          </Button>
        </div>
      )}
    </Form>
  )
}

export default function TransactionsIndex({
  transactions,
  pagination,
  categories,
  filters,
}: Props) {
  const [createOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] = useState<Transaction | null>(null)

  return (
    <div className="py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Transactions</h1>
          <p className="text-sm text-muted-foreground">{pagination.total} transactions</p>
        </div>
        <CreateTransactionDialog
          categories={categories}
          open={createOpen}
          onOpenChange={setCreateOpen}
        />
      </div>

      <FilterBar categories={categories} filters={filters} />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    No transactions found.
                  </TableCell>
                </TableRow>
              )}
              {transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>{(transaction.date ?? '').slice(0, 10)}</TableCell>
                  <TableCell>{transaction.description ?? '—'}</TableCell>
                  <TableCell>
                    {transaction.category && (
                      <div className="flex items-center gap-2">
                        <span
                          className="size-3 shrink-0 rounded-full"
                          style={{ backgroundColor: transaction.category.color }}
                        />
                        {transaction.category.name}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={transaction.type === 'income' ? 'default' : 'secondary'}>
                      {transaction.type}
                    </Badge>
                  </TableCell>
                  <TableCell
                    className={`text-right font-medium ${transaction.type === 'income' ? 'text-green-600' : 'text-destructive'}`}
                  >
                    {transaction.type === 'income' ? '+' : '-'}
                    {formatBRL(transaction.amount)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setEditing(transaction)}>
                        Edit
                      </Button>
                      <Form route="transactions.destroy" routeParams={{ id: transaction.id }}>
                        <Button variant="ghost" size="sm" type="submit">
                          Delete
                        </Button>
                      </Form>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {pagination.lastPage > 1 && (
        <div className="mt-4 flex items-center justify-center gap-4">
          <Link
            route="transactions.index"
            data={{ ...filters, page: pagination.currentPage - 1 }}
            className="text-sm text-muted-foreground hover:text-foreground aria-disabled:pointer-events-none aria-disabled:opacity-50"
            aria-disabled={pagination.currentPage <= 1}
          >
            Previous
          </Link>
          <span className="text-sm text-muted-foreground">
            Page {pagination.currentPage} of {pagination.lastPage}
          </span>
          <Link
            route="transactions.index"
            data={{ ...filters, page: pagination.currentPage + 1 }}
            className="text-sm text-muted-foreground hover:text-foreground aria-disabled:pointer-events-none aria-disabled:opacity-50"
            aria-disabled={pagination.currentPage >= pagination.lastPage}
          >
            Next
          </Link>
        </div>
      )}

      <EditTransactionDialog
        categories={categories}
        transaction={editing}
        onOpenChange={(open) => !open && setEditing(null)}
      />
    </div>
  )
}
