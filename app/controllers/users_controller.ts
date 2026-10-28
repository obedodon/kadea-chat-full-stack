import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import { avatarTone } from '#services/avatar'

/**
 * Recherche de personnes pour la fenêtre « Nouvelle discussion » (écran 09).
 */
export default class UsersController {
  /**
   * Renvoie en JSON jusqu'à 8 comptes confirmés dont le nom ou l'e-mail
   * contient le texte tapé (2 caractères minimum). Jamais soi-même.
   */
  async search({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const q = String(request.input('q', '')).trim().slice(0, 100)
    if (q.length < 2) {
      return response.json([])
    }

    // On neutralise % et _ : l'utilisateur cherche du texte, pas un motif SQL
    const pattern = `%${q.replace(/[\\%_]/g, (char) => `\\${char}`)}%`

    const users = await User.query()
      .whereNot('id', user.id)
      .whereNotNull('email_verified_at')
      .where((query) => query.whereILike('full_name', pattern).orWhereILike('email', pattern))
      .orderBy('full_name')
      .limit(8)

    return response.json(
      users.map((person) => ({
        id: person.id,
        fullName: person.fullName,
        email: person.email,
        initials: person.initials,
        tone: avatarTone(person.id),
        avatarUrl: person.avatarUrl,
      }))
    )
  }
}
