import { createHash, randomBytes } from 'node:crypto'
import { DateTime } from 'luxon'
import UserToken from '#models/user_token'
import type User from '#models/user'

export type TokenType = 'email_confirmation' | 'password_reset'

/**
 * Durée de validité de chaque type de lien (RG5).
 */
const LIFETIME = {
  email_confirmation: { hours: 24 },
  password_reset: { minutes: 15 },
} as const

/**
 * Service qui crée, vérifie et consomme les liens envoyés par e-mail.
 *
 * Le code secret n'est jamais stocké en clair : on garde seulement son
 * empreinte SHA-256. Même si la base fuitait, les liens seraient inutilisables.
 */
export default class UserTokenService {
  private static hash(token: string) {
    return createHash('sha256').update(token).digest('hex')
  }

  /**
   * Crée un nouveau lien et renvoie le code secret (à mettre dans l'URL).
   * Les anciens liens du même type sont supprimés : seul le dernier e-mail fonctionne.
   */
  static async generate(user: User, type: TokenType) {
    await UserToken.query().where('user_id', user.id).where('type', type).delete()

    const token = randomBytes(32).toString('base64url')
    await UserToken.create({
      userId: user.id,
      type,
      tokenHash: this.hash(token),
      expiresAt: DateTime.now().plus(LIFETIME[type]),
    })

    return token
  }

  /**
   * Renvoie le lien s'il existe et n'a pas expiré, sans le consommer.
   */
  static async find(token: string, type: TokenType) {
    const record = await UserToken.query()
      .where('token_hash', this.hash(token))
      .where('type', type)
      .preload('user')
      .first()

    if (!record || record.expiresAt.toMillis() <= Date.now()) {
      return null
    }
    return record
  }

  /**
   * Vérifie le lien, le supprime (usage unique) et renvoie l'utilisateur.
   */
  static async consume(token: string, type: TokenType) {
    const record = await this.find(token, type)
    if (!record) {
      return null
    }
    await record.delete()
    return record.user
  }
}
