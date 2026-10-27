import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Table blocks : qui a bloqué qui (ancre Blocage).
 * RG15 : un utilisateur bloqué ne peut plus envoyer de messages à celui qui l'a bloqué.
 */
export default class extends BaseSchema {
  protected tableName = 'blocks'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table
        .integer('blocker_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
      table
        .integer('blocked_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')

      table.timestamp('created_at').notNullable()

      table.unique(['blocker_id', 'blocked_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
