import { BaseSeeder } from '@adonisjs/lucid/seeders'
import { DateTime } from 'luxon'
import User from '#models/user'

/**
 * Comptes de test, déjà confirmés.
 * Lancer : node ace db:seed
 * Mot de passe commun : Kadea2026!
 *
 * updateOrCreateMany('email', …) : si l'adresse existe déjà, le compte est
 * mis à jour au lieu d'être recréé. On peut donc relancer sans doublons.
 */
export default class UserSeeder extends BaseSeeder {
  async run() {
    const password = 'Kadea2026!'
    const now = DateTime.now()

    await User.updateOrCreateMany('email', [
      { fullName: 'Obed Mungwana', email: 'obed@kadea.test', password, emailVerifiedAt: now },
      { fullName: 'Grâce Mbuyi', email: 'grace@kadea.test', password, emailVerifiedAt: now },
      { fullName: 'Josué Kalala', email: 'josue@kadea.test', password, emailVerifiedAt: now },
      { fullName: 'Daniel Mutombo', email: 'daniel@kadea.test', password, emailVerifiedAt: now },
      { fullName: 'Ruth Ilunga', email: 'ruth@kadea.test', password, emailVerifiedAt: now },
      { fullName: 'Prisca Nzimba', email: 'prisca@kadea.test', password, emailVerifiedAt: now },
      { fullName: 'Joseph Mukendi', email: 'joseph@kadea.test', password, emailVerifiedAt: now },
    ])
  }
}
