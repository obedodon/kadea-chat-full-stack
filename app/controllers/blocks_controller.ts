import type { HttpContext } from '@adonisjs/core/http'
import Block from '#models/block'
import User from '#models/user'

/**
 * Bloquer et débloquer une personne.
 * La personne bloquée n'est jamais prévenue : elle continue d'écrire,
 * mais ses messages ne sont pas remis (une seule barre).
 */
export default class BlocksController {
  async store({ auth, params, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const target = await User.findOrFail(params.id)
    if (target.id === user.id) {
      session.flash('error', 'Tu ne peux pas te bloquer toi-même.')
      return response.redirect().back()
    }

    // firstOrCreate : bloquer deux fois ne crée pas de doublon
    await Block.firstOrCreate({ blockerId: user.id, blockedId: target.id })

    session.flash('success', `${target.fullName} est bloqué. Tu ne recevras plus ses messages.`)
    return response.redirect().back()
  }

  async destroy({ auth, params, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const target = await User.findOrFail(params.id)

    await Block.query().where('blocker_id', user.id).where('blocked_id', target.id).delete()

    session.flash('success', `${target.fullName} est débloqué.`)
    return response.redirect().back()
  }
}
