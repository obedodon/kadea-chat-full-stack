import { BlockSchema } from '#database/schema'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/user'

/**
 * Modèle Block : « blocker a bloqué blocked ».
 * Tant qu'il existe, aucun des deux ne peut écrire à l'autre en privé.
 */
export default class Block extends BlockSchema {
  @belongsTo(() => User, { foreignKey: 'blockedId' })
  declare blocked: BelongsTo<typeof User>

  @belongsTo(() => User, { foreignKey: 'blockerId' })
  declare blocker: BelongsTo<typeof User>
}
