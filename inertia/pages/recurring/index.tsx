import { Form } from '@adonisjs/inertia/react'
import type { Data } from '@generated/data'
import { useState } from 'react'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { formatBRL } from '~/lib/format'

type Category = Data.Category
type RecurringRule = Data.RecurringRule
type RuleType = Category['type']

type Props = {
  rules: RecurringRule[]
  categories: Category[]
}

function centsToReaisInput(cents: number) {
  return (cents / 100).toFixed(2)
}

function KindField({ defaultValue }: { defaultValue?: RecurringRule['kind'] }) {
  return (
    <div className="grid gap-2">
      <Label htmlFor="kind">Kind</Label>
      <Select name="kind" defaultValue={defaultValue ?? 'fixed'}>
        <SelectTrigger id="kind" className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="fixed">Fixed</SelectItem>
          <SelectItem value="variable">Variable</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}

function RecurringRuleFormFields({
  categories,
  type,
  onTypeChange,
  defaults,
  errors,
}: {
  categories: Category[]
  type: RuleType
  onTypeChange: (type: RuleType) => void
  defaults?: {
    categoryId: string
    name: string
    amount: string
    kind: RecurringRule['kind']
    dayOfMonth: string
    startMonth: string
    installmentsTotal: string
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
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          name="name"
          defaultValue={defaults?.name}
          aria-invalid={errors.name ? true : undefined}
        />
        {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
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

      <KindField defaultValue={defaults?.kind} />
      {errors.kind && <p className="text-sm text-destructive">{errors.kind}</p>}

      <div className="grid gap-2">
        <Label htmlFor="dayOfMonth">Day of month</Label>
        <Input
          id="dayOfMonth"
          name="dayOfMonth"
          type="number"
          min="1"
          max="31"
          defaultValue={defaults?.dayOfMonth ?? '1'}
          aria-invalid={errors.dayOfMonth ? true : undefined}
        />
        {errors.dayOfMonth && <p className="text-sm text-destructive">{errors.dayOfMonth}</p>}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="startMonth">Starts in</Label>
        <Input
          id="startMonth"
          name="startMonth"
          type="date"
          defaultValue={defaults?.startMonth}
          aria-invalid={errors.startMonth ? true : undefined}
        />
        {errors.startMonth && <p className="text-sm text-destructive">{errors.startMonth}</p>}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="installmentsTotal">Installments</Label>
        <Input
          id="installmentsTotal"
          name="installmentsTotal"
          type="number"
          min="1"
          placeholder="Leave blank for ongoing"
          defaultValue={defaults?.installmentsTotal}
          aria-invalid={errors.installmentsTotal ? true : undefined}
        />
        {errors.installmentsTotal && (
          <p className="text-sm text-destructive">{errors.installmentsTotal}</p>
        )}
      </div>
    </div>
  )
}

function CreateRuleDialog({
  categories,
  open,
  onOpenChange,
}: {
  categories: Category[]
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [type, setType] = useState<RuleType>('expense')

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) setType('expense')
        onOpenChange(next)
      }}
    >
      <DialogTrigger asChild>
        <Button>New recurring rule</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New recurring rule</DialogTitle>
          <DialogDescription>
            A rule projects what's committed every month until you archive it.
          </DialogDescription>
        </DialogHeader>
        <Form route="recurring.store" onSuccess={() => onOpenChange(false)}>
          {({ errors, processing }) => (
            <div className="flex flex-col gap-4">
              <RecurringRuleFormFields
                categories={categories}
                type={type}
                onTypeChange={setType}
                errors={errors}
              />
              <Button type="submit" disabled={processing} className="w-full">
                Create rule
              </Button>
            </div>
          )}
        </Form>
      </DialogContent>
    </Dialog>
  )
}

function EditRuleDialog({
  categories,
  rule,
  onOpenChange,
}: {
  categories: Category[]
  rule: RecurringRule | null
  onOpenChange: (open: boolean) => void
}) {
  const [type, setType] = useState<RuleType>(rule?.category?.type ?? 'expense')

  return (
    <Dialog
      open={rule !== null}
      onOpenChange={(next) => {
        if (!next) onOpenChange(false)
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit recurring rule</DialogTitle>
        </DialogHeader>
        {rule && (
          <Form
            route="recurring.update"
            routeParams={{ id: rule.id }}
            onSuccess={() => onOpenChange(false)}
          >
            {({ errors, processing }) => (
              <div className="flex flex-col gap-4">
                <RecurringRuleFormFields
                  categories={categories}
                  type={type}
                  onTypeChange={setType}
                  defaults={{
                    categoryId: rule.category?.id ?? '',
                    name: rule.name,
                    amount: centsToReaisInput(rule.amount),
                    kind: rule.kind,
                    dayOfMonth: String(rule.dayOfMonth),
                    startMonth: (rule.startMonth ?? '').slice(0, 10),
                    installmentsTotal:
                      rule.installmentsTotal === null ? '' : String(rule.installmentsTotal),
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

export default function RecurringIndex({ rules, categories }: Props) {
  const [showArchived, setShowArchived] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] = useState<RecurringRule | null>(null)

  const visible = rules.filter((rule) => showArchived || !rule.archivedAt)

  return (
    <div className="py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Recurring</h1>
          <p className="text-sm text-muted-foreground">
            Subscriptions, bills, and installments that repeat every month.
          </p>
        </div>
        <CreateRuleDialog categories={categories} open={createOpen} onOpenChange={setCreateOpen} />
      </div>

      <div className="mb-4">
        <Button
          variant={showArchived ? 'secondary' : 'outline'}
          size="sm"
          onClick={() => setShowArchived((value) => !value)}
        >
          {showArchived ? 'Hide archived' : 'Show archived'}
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Kind</TableHead>
                <TableHead>Day</TableHead>
                <TableHead>Installments</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                    No recurring rules yet.
                  </TableCell>
                </TableRow>
              )}
              {visible.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell>{rule.name}</TableCell>
                  <TableCell>
                    {rule.category && (
                      <div className="flex items-center gap-2">
                        <span
                          className="size-3 shrink-0 rounded-full"
                          style={{ backgroundColor: rule.category.color }}
                        />
                        {rule.category.name}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="capitalize">{rule.kind}</TableCell>
                  <TableCell>{rule.dayOfMonth}</TableCell>
                  <TableCell>{rule.installmentsTotal ?? 'Ongoing'}</TableCell>
                  <TableCell
                    className={`text-right font-medium ${rule.type === 'income' ? 'text-green-600' : 'text-destructive'}`}
                  >
                    {rule.type === 'income' ? '+' : '-'}
                    {formatBRL(rule.amount)}
                  </TableCell>
                  <TableCell>
                    {rule.archivedAt && <Badge variant="secondary">Archived</Badge>}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setEditing(rule)}>
                        Edit
                      </Button>
                      {!rule.archivedAt && (
                        <Form route="recurring.destroy" routeParams={{ id: rule.id }}>
                          <Button variant="ghost" size="sm" type="submit">
                            Archive
                          </Button>
                        </Form>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <EditRuleDialog
        categories={categories}
        rule={editing}
        onOpenChange={(open) => !open && setEditing(null)}
      />
    </div>
  )
}
