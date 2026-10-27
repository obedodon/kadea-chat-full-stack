import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Table messages (ancre Message).
 * RG12 : un auteur, une discussion, et un texte ou un fichier.
 * RG13 : deleted_at permet la suppression « douce ».
 */
export default class extends BaseSchema {
  protected tableName = 'messages'

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
        .integer('sender_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
      table.text('body').nullable()
      table.string('file_path').nullable()
      table.string('file_name').nullable()
      // Vide : message visible. Rempli : « Ce message a été supprimé »
      table.timestamp('deleted_at').nullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      // Affichage rapide de l'historique d'une discussion
      table.index(['conversation_id', 'created_at'])
    })

    // RG12 garantie par la base : un message a un texte ou un fichier
    this.defer(async (db) => {
      await db.rawQuery(
        'ALTER TABLE messages ADD CONSTRAINT messages_body_or_file CHECK (body IS NOT NULL OR file_path IS NOT NULL)'
      )
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
