import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Table conversation_members : qui fait partie de quelle discussion (ancre Adhésion).
 * RG8, RG9 : le rôle admin donne la gestion des membres.
 * RG10 : un utilisateur ne figure qu'une fois par discussion.
 * RG11 : c'est cette table qu'on vérifie avant d'afficher une discussion.
 */
export default class extends BaseSchema {
  protected tableName = 'conversation_members'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table
        .integer('conversation_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('conversations')
        .onDelete('CASCADE')
      table
        .integer('user_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
      table.enum('role', ['admin', 'member']).notNullable().defaultTo('member')
      // Sert aux badges de non-lus et aux coches « lu »
      table.timestamp('last_read_at').nullable()

      table.timestamp('created_at').notNullable()

      table.unique(['conversation_id', 'user_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
