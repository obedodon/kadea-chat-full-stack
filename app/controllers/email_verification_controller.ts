import { DateTime } from 'luxon'
import User from '#models/user'
import { emailValidator } from '#validators/user'
import UserTokenService from '#services/user_token_service'
import AuthMailService from '#services/auth_mail_service'
import logger from '@adonisjs/core/services/logger'
import type { HttpContext } from '@adonisjs/core/http'

/**
 * Confirmation de l'adresse e-mail (écran 03 et lien reçu par e-mail).
 */
export default class EmailVerificationController {
  /**
   * Écran « Vérifie ta boîte mail ».
   */
  async notice({ view, session }: HttpContext) {
    return view.render('pages/auth/verify_email_sent', { email: session.get('pending_email') })
  }

  /**
   * Lien cliqué dans l'e-mail : confirme l'adresse puis renvoie vers la connexion.
   */
  async verify({ params, response, session }: HttpContext) {
    const user = await UserTokenService.consume(params.token, 'email_confirmation')

    if (!user) {
      session.flash('error', "Ce lien n'est plus valable. Demande un nouvel e-mail de confirmation.")
      return response.redirect().toRoute('verification.notice')
    }

    if (!user.isVerified) {
      user.emailVerifiedAt = DateTime.now()
      await user.save()
    }

    session.forget('pending_email')
    session.flash('success', 'Adresse confirmée. Tu peux te connecter.')
    return response.redirect().toRoute('session.create')
  }

  /**
   * Bouton « Renvoyer l'e-mail ».
   * La réponse est la même que le compte existe ou non : on ne révèle pas qui est inscrit.
   */
  async resend({ request, response, session }: HttpContext) {
    const { email } = await request.validateUsing(emailValidator)
    const user = await User.findBy('email', email)

    if (user && !user.isVerified) {
      try {
        await AuthMailService.sendVerification(user)
      } catch (error) {
        logger.error({ err: error }, "Échec du renvoi de l'e-mail de confirmation")
      }
    }

    session.put('pending_email', email)
    session.flash('success', 'Si un compte non confirmé existe pour cette adresse, un nouvel e-mail vient de partir.')
    return response.redirect().toRoute('verification.notice')
  }
}
