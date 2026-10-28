import { UserSchema } from '#database/schema'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'

/**
 * Modèle User : un compte Kadea Chat.
 * withAuthFinder ajoute verifyCredentials() et hache le mot de passe
 * automatiquement avant chaque enregistrement (RG3).
 */
export default class User extends compose(UserSchema, withAuthFinder(hash)) {
  /**
   * Vrai quand l'adresse e-mail a été confirmée (RG4).
   */
  get isVerified() {
    return this.emailVerifiedAt !== null
  }

  /**
   * Initiales affichées quand il n'y a pas de photo de profil.
   */
  get initials() {
    const [first, last] = this.fullName.trim().split(/\s+/)
    if (first && last) {
      return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase()
    }
    return first.slice(0, 2).toUpperCase()
  }
}
