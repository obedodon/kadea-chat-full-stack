import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Les photos (profil et groupe) rangées dans la base de données.
 * Pourquoi pas sur le disque ? L'hébergeur (Render) efface le disque à chaque
 * redémarrage : dans la base, les photos sont conservées et sauvegardées avec le reste.
 * name = le nom enregistré dans users.avatar_path ou conversations.avatar_path.
 */
export default class extends BaseSchema {
  protected tableName = 'avatars'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.string('name', 120).primary()
      table.string('mime_type', 50).notNullable()
      table.binary('data').notNullable()
      table.timestamp('created_at').notNullable().defaultTo(this.now())
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
