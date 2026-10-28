import User from '#models/user'
import { signupValidator } from '#validators/user'
import AuthMailService from '#services/auth_mail_service'
import logger from '@adonisjs/core/services/logger'
import type { HttpContext } from '@adonisjs/core/http'

/**
 * Inscription (écran 01).
 */
export default class NewAccountController {
  /**
   * Affiche le formulaire d'inscription.
   */
  async create({ view }: HttpContext) {
    return view.render('pages/auth/signup')
  }

  /**
   * Crée le compte, envoie l'e-mail de confirmation, puis affiche « Vérifie ta boîte mail ».
   * L'utilisateur n'est PAS connecté : il doit d'abord confirmer son adresse (RG4).
   */
  async store({ request, response, session }: HttpContext) {
    const { fullName, email, password } = await request.validateUsing(signupValidator)
    const user = await User.create({ fullName, email, password })

    try {
      await AuthMailService.sendVerification(user)
    } catch (error) {
      logger.error({ err: error }, "Échec de l'envoi de l'e-mail de confirmation")
      session.flash('error', "Ton compte est créé, mais l'e-mail n'a pas pu partir. Renvoie-le ci-dessous.")
    }

    session.put('pending_email', user.email)
    return response.redirect().toRoute('verification.notice')
  }
}
