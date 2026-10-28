import { MessageSchema } from '#database/schema'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import Conversation from '#models/conversation'

/**
 * Modèle Message : un texte et/ou un fichier envoyé dans une conversation.
 */
export default class Message extends MessageSchema {
  @belongsTo(() => Conversation)
  declare conversation: BelongsTo<typeof Conversation>

  /** L'auteur du message (colonne sender_id). */
  @belongsTo(() => User, { foreignKey: 'senderId' })
  declare sender: BelongsTo<typeof User>

  /**
   * Un message supprimé reste en base, mais n'affiche plus son contenu.
   * « != null » couvre null (lu en base) et undefined (message tout juste créé).
   */
  get isDeleted() {
    return this.deletedAt !== null && this.deletedAt !== undefined
  }
}
