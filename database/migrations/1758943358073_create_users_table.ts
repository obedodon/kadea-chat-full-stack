import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Table users : les comptes (ancre Utilisateur).
 * RG1 nom obligatoire, RG2 e-mail unique, RG3 mot de passe haché, RG4 confirmation.
 */
export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table.string('full_name', 100).notNullable()
      table.string('email', 254).notNullable().unique()
      table.string('password').notNullable()
      table.string('avatar_path').nullable()

      // Vide tant que l'adresse n'est pas confirmée : la connexion est alors refusée (RG4)
      table.timestamp('email_verified_at').nullable()
      // Sert à afficher « en ligne »
      table.timestamp('last_seen_at').nullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
