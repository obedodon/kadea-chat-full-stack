import { BaseMail } from '@adonisjs/mail'
import type User from '#models/user'

/**
 * E-mail envoyé quand l'utilisateur a oublié son mot de passe (lien valable 15 min).
 */
export default class ResetPasswordNotification extends BaseMail {
  subject = 'Réinitialise ton mot de passe — Kadea Chat'

  constructor(
    private user: User,
    private url: string
  ) {
    super()
  }

  prepare() {
    this.message
      .to(this.user.email, this.user.fullName)
      .htmlView('emails/reset_password', { user: this.user, url: this.url })
  }
}
