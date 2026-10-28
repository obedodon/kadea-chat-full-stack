import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Photo d'un groupe : le nom du fichier, comme pour la photo de profil d'un utilisateur.
 * null = pas de photo (on affiche l'icône de groupe).
 */
export default class extends BaseSchema {
  protected tableName = 'conversations'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('avatar_path').nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('avatar_path')
    })
  }
}
