import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'recurring_instances'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.string('id').primary()
      table.string('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE')
      table
        .string('recurring_rule_id')
        .notNullable()
        .references('id')
        .inTable('recurring_rules')
        .onDelete('CASCADE')
      table.date('period_month').notNullable()
      table.integer('amount').notNullable()
      table
        .string('transaction_id')
        .nullable()
        .references('id')
        .inTable('transactions')
        .onDelete('SET NULL')
      table.timestamp('confirmed_at').notNullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.unique(['recurring_rule_id', 'period_month'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
