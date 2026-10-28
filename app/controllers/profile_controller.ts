import type { HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'
import hash from '@adonisjs/core/services/hash'
import ConversationListService from '#services/conversation_list_service'
import { AVATARS_DIR, avatarTone, storeAvatar } from '#services/avatar'
import { changePasswordValidator, profileValidator } from '#validators/user'

/**
 * 10 · Ton profil : nom, photo et mot de passe.
 */
export default class ProfileController {
  async show({ auth, view }: HttpContext) {
    const user = auth.getUserOrFail()
    const conversations = await ConversationListService.forUser(user)
    return view.render('pages/profile/show', {
      conversations,
      profile: {
        fullName: user.fullName,
        email: user.email,
        initials: user.initials,
        tone: avatarTone(user.id),
        avatarUrl: user.avatarUrl,
      },
    })
  }

  /**
   * Enregistre le nom et, si une photo est choisie, la remplace.
   */
  async update({ auth, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const { fullName, avatar } = await request.validateUsing(profileValidator)
    user.fullName = fullName

    if (avatar) {
      // Nom de fichier imprévisible : on ne devine pas la photo de quelqu'un d'autre
      user.avatarPath = await storeAvatar(avatar, `u${user.id}`, user.avatarPath)
    }

    await user.save()
    session.flash('success', 'Profil enregistré.')
    return response.redirect().toRoute('profile.show')
  }

  /**
   * Change le mot de passe, après vérification de l'actuel.
   */
  async password({ auth, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const { currentPassword, password } = await request.validateUsing(changePasswordValidator)

    if (!(await hash.verify(user.password, currentPassword))) {
      session.flash('inputErrorsBag', { currentPassword: ['Mot de passe actuel incorrect.'] })
      return response.redirect().toRoute('profile.show')
    }

    // Le mixin withAuthFinder hache le nouveau mot de passe à l'enregistrement
    user.password = password
    await user.save()
    session.flash('success', 'Mot de passe modifié.')
    return response.redirect().toRoute('profile.show')
  }

  /**
   * Sert une photo de profil ou de groupe (réservé aux utilisateurs connectés).
   * Le nom est contrôlé par la route : pas de « ../ » possible.
   */
  async avatar({ params, response }: HttpContext) {
    response.header('Cache-Control', 'private, max-age=86400')
    return response.download(app.makePath(AVATARS_DIR, params.file))
  }
}
