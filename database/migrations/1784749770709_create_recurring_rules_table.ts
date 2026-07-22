import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'recurring_rules'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.string('id').primary()
      table.string('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE')
      table
        .string('category_id')
        .notNullable()
        .references('id')
        .inTable('categories')
        .onDelete('RESTRICT')
      table.string('type').notNullable()
      table.string('name').notNullable()
      table.integer('amount').notNullable()
      table.string('kind').notNullable()
      table.integer('day_of_month').notNullable()
      table.date('start_month').notNullable()
      table.integer('installments_total').nullable()
      table.timestamp('archived_at').nullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
