import env from '#start/env'
import mail from '@adonisjs/mail/services/main'
import type User from '#models/user'
import UserTokenService from '#services/user_token_service'
import VerifyEmailNotification from '#mails/verify_email_notification'
import ResetPasswordNotification from '#mails/reset_password_notification'

/**
 * Regroupe l'envoi des deux e-mails liés au compte.
 * Les contrôleurs restent courts : ils appellent seulement ces méthodes.
 */
export default class AuthMailService {
  static async sendVerification(user: User) {
    const token = await UserTokenService.generate(user, 'email_confirmation')
    const url = `${env.get('APP_URL')}/verify-email/${token}`
    await mail.send(new VerifyEmailNotification(user, url))
  }

  static async sendPasswordReset(user: User) {
    const token = await UserTokenService.generate(user, 'password_reset')
    const url = `${env.get('APP_URL')}/reset-password/${token}`
    await mail.send(new ResetPasswordNotification(user, url))
  }
}
