import User from '#models/user'
import { loginValidator } from '#validators/user'
import type { HttpContext } from '@adonisjs/core/http'

/**
 * Connexion et déconnexion (écran 02).
 */
export default class SessionController {
  /**
   * Affiche le formulaire de connexion.
   */
  async create({ view }: HttpContext) {
    return view.render('pages/auth/login')
  }

  /**
   * Vérifie l'e-mail et le mot de passe, puis ouvre la session.
   * Un compte non confirmé est refusé (RG4).
   */
  async store({ request, auth, response, session }: HttpContext) {
    const { email, password } = await request.validateUsing(loginValidator)

    let user: User
    try {
      user = await User.verifyCredentials(email, password)
    } catch {
      // Message volontairement vague : on ne dit pas si c'est l'e-mail ou le mot de passe qui est faux
      session.flashExcept(['password'])
      session.flash('error', 'Adresse e-mail ou mot de passe incorrect.')
      return response.redirect().back()
    }

    if (!user.isVerified) {
      session.put('pending_email', user.email)
      session.flash('error', "Confirme d'abord ton adresse e-mail : le lien est dans ta boîte de réception.")
      return response.redirect().toRoute('verification.notice')
    }

    await auth.use('web').login(user)
    return response.redirect().toRoute('dashboard')
  }

  /**
   * Ferme la session.
   */
  async destroy({ auth, response, session }: HttpContext) {
    await auth.use('web').logout()
    session.flash('success', 'Tu es déconnecté.')
    return response.redirect().toRoute('session.create')
  }
}
