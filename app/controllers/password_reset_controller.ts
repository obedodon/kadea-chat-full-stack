import { DateTime } from 'luxon'
import User from '#models/user'
import { emailValidator, resetPasswordValidator } from '#validators/user'
import UserTokenService from '#services/user_token_service'
import AuthMailService from '#services/auth_mail_service'
import logger from '@adonisjs/core/services/logger'
import type { HttpContext } from '@adonisjs/core/http'

/**
 * Mot de passe oublié (écrans 04 et 05).
 */
export default class PasswordResetController {
  /**
   * Écran 04 : formulaire « Mot de passe oublié ».
   */
  async create({ view }: HttpContext) {
    return view.render('pages/auth/forgot_password')
  }

  /**
   * Envoie le lien de réinitialisation (valable 15 minutes).
   * Même message que le compte existe ou non : on ne révèle pas qui est inscrit.
   */
  async store({ request, response, session }: HttpContext) {
    const { email } = await request.validateUsing(emailValidator)
    const user = await User.findBy('email', email)

    if (user) {
      try {
        await AuthMailService.sendPasswordReset(user)
      } catch (error) {
        logger.error({ err: error }, "Échec de l'envoi de l'e-mail de réinitialisation")
      }
    }

    session.flash(
      'success',
      'Si un compte existe pour cette adresse, un lien vient de partir. Il est valable 15 minutes.'
    )
    return response.redirect().back()
  }

  /**
   * Écran 05 : formulaire « Nouveau mot de passe », ouvert depuis le lien de l'e-mail.
   */
  async edit({ params, view, response, session }: HttpContext) {
    const record = await UserTokenService.find(params.token, 'password_reset')

    if (!record) {
      session.flash('error', "Ce lien n'est plus valable. Demande un nouveau lien.")
      return response.redirect().toRoute('password.forgot')
    }

    return view.render('pages/auth/reset_password', { token: params.token })
  }

  /**
   * Enregistre le nouveau mot de passe. Le lien ne sert qu'une fois.
   */
  async update({ request, response, session }: HttpContext) {
    const { token, password } = await request.validateUsing(resetPasswordValidator)
    const user = await UserTokenService.consume(token, 'password_reset')

    if (!user) {
      session.flash('error', "Ce lien n'est plus valable. Demande un nouveau lien.")
      return response.redirect().toRoute('password.forgot')
    }

    // Le mot de passe est haché automatiquement par withAuthFinder avant l'enregistrement
    user.password = password
    // Ouvrir le lien reçu prouve aussi que l'adresse appartient à l'utilisateur
    if (!user.isVerified) {
      user.emailVerifiedAt = DateTime.now()
    }
    await user.save()

    session.flash('success', 'Mot de passe modifié. Tu peux te connecter.')
    return response.redirect().toRoute('session.create')
  }
}
