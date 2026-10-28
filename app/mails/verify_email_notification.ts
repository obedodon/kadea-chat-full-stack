import { BaseMail } from '@adonisjs/mail'
import type User from '#models/user'

/**
 * E-mail envoyé après l'inscription, avec le lien de confirmation (24 h).
 */
export default class VerifyEmailNotification extends BaseMail {
  subject = 'Confirme ton adresse e-mail — Kadea Chat'

  constructor(
    private user: User,
    private url: string
  ) {
    super()
  }

  prepare() {
    this.message
      .to(this.user.email, this.user.fullName)
      .htmlView('emails/verify_email', { user: this.user, url: this.url })
  }
}
