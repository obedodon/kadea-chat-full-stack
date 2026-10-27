import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Table user_tokens : les liens secrets envoyés par e-mail (ancre Lien e-mail).
 * RG5 : confirmation valable 24 h, réinitialisation 15 min, un seul usage.
 */
export default class extends BaseSchema {
  protected tableName = 'user_tokens'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table
        .integer('user_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
      table.enum('type', ['email_confirmation', 'password_reset']).notNullable()
      // On stocke l'empreinte du code, jamais le code lui-même
      table.string('token_hash').notNullable().unique()
      table.timestamp('expires_at').notNullable()

      table.timestamp('created_at').notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
