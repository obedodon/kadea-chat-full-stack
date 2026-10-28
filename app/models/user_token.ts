import { UserTokenSchema } from '#database/schema'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/user'

/**
 * Modèle UserToken : un lien secret envoyé par e-mail
 * (confirmation d'adresse ou réinitialisation du mot de passe).
 */
export default class UserToken extends UserTokenSchema {
  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>
}
