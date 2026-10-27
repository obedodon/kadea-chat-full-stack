import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Table conversations : discussions privées et groupes (ancre Discussion).
 * RG6, RG7 : le type distingue les deux ; seul un groupe a un nom.
 * RG16 : last_message_at sert à trier la liste.
 */
export default class extends BaseSchema {
  protected tableName = 'conversations'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table.enum('type', ['private', 'group']).notNullable()
      table.string('name', 80).nullable()
      table.text('description').nullable()
      table
        .integer('created_by')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')
      table.timestamp('last_message_at').nullable().index()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
