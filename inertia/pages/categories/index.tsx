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

type Category = Data.Category

type Props = {
  categories: Category[]
}

function CategoryTypeField({ defaultValue }: { defaultValue?: Category['type'] }) {
  return (
    <div className="grid gap-2">
      <Label htmlFor="type">Type</Label>
      <Select name="type" defaultValue={defaultValue ?? 'expense'}>
        <SelectTrigger id="type" className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="expense">Expense</SelectItem>
          <SelectItem value="income">Income</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}

function CreateCategoryDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>New category</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New category</DialogTitle>
          <DialogDescription>Categories group transactions by kind.</DialogDescription>
        </DialogHeader>
        <Form route="categories.store" onSuccess={() => onOpenChange(false)}>
          {({ errors, processing }) => (
            <div className="flex flex-col gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" aria-invalid={errors.name ? true : undefined} />
                {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
              </div>

              <CategoryTypeField />
              {errors.type && <p className="text-sm text-destructive">{errors.type}</p>}

              <div className="grid gap-2">
                <Label htmlFor="color">Color</Label>
                <Input
                  id="color"
                  name="color"
                  type="color"
                  defaultValue="#22c55e"
                  className="h-9 w-16 p-1"
                />
                {errors.color && <p className="text-sm text-destructive">{errors.color}</p>}
              </div>

              <Button type="submit" disabled={processing} className="w-full">
                Create category
              </Button>
            </div>
          )}
        </Form>
      </DialogContent>
    </Dialog>
  )
}

function EditCategoryDialog({
  category,
  onOpenChange,
}: {
  category: Category | null
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={category !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit category</DialogTitle>
        </DialogHeader>
        {category && (
          <Form
            route="categories.update"
            routeParams={{ id: category.id }}
            onSuccess={() => onOpenChange(false)}
          >
            {({ errors, processing }) => (
              <div className="flex flex-col gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-name">Name</Label>
                  <Input
                    id="edit-name"
                    name="name"
                    defaultValue={category.name}
                    aria-invalid={errors.name ? true : undefined}
                  />
                  {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                </div>

                <CategoryTypeField defaultValue={category.type} />
                {errors.type && <p className="text-sm text-destructive">{errors.type}</p>}

                <div className="grid gap-2">
                  <Label htmlFor="edit-color">Color</Label>
                  <Input
                    id="edit-color"
                    name="color"
                    type="color"
                    defaultValue={category.color}
                    className="h-9 w-16 p-1"
                  />
                  {errors.color && <p className="text-sm text-destructive">{errors.color}</p>}
                </div>

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

export default function CategoriesIndex({ categories }: Props) {
  const [showArchived, setShowArchived] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)

  const visible = categories.filter((category) => showArchived || !category.archivedAt)

  return (
    <div className="py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Categories</h1>
          <p className="text-sm text-muted-foreground">
            Organize your income and expenses into categories.
          </p>
        </div>
        <CreateCategoryDialog open={createOpen} onOpenChange={setCreateOpen} />
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
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                    No categories yet.
                  </TableCell>
                </TableRow>
              )}
              {visible.map((category) => (
                <TableRow key={category.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span
                        className="size-3 shrink-0 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      {category.name}
                    </div>
                  </TableCell>
                  <TableCell className="capitalize">{category.type}</TableCell>
                  <TableCell>
                    {category.archivedAt && <Badge variant="secondary">Archived</Badge>}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setEditing(category)}>
                        Edit
                      </Button>
                      {!category.archivedAt && (
                        <Form route="categories.destroy" routeParams={{ id: category.id }}>
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

      <EditCategoryDialog category={editing} onOpenChange={(open) => !open && setEditing(null)} />
    </div>
  )
}
