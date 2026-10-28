import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Un message envoyé par quelqu'un qui a été bloqué : il est enregistré
 * (l'expéditeur le voit, avec une seule barre) mais n'est jamais remis au destinataire.
 */
export default class extends BaseSchema {
  protected tableName = 'messages'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.boolean('is_blocked').notNullable().defaultTo(false)
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('is_blocked')
    })
  }
}
