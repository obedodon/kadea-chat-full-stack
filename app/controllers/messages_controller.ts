import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import Conversation from '#models/conversation'
import ConversationMember from '#models/conversation_member'
import Message from '#models/message'
import { messageValidator } from '#validators/conversation'

/**
 * Les messages d'une discussion (écran 07).
 */
export default class MessagesController {
  /**
   * Envoie un message. Seuls les membres de la discussion peuvent écrire :
   * on la cherche avec visibleTo(user), sinon 404.
   */
  async store({ auth, params, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const conversation = await Conversation.visibleTo(user).where('id', params.id).firstOrFail()
    const { body } = await request.validateUsing(messageValidator)

    await db.transaction(async (trx) => {
      const message = await Message.create(
        { conversationId: conversation.id, senderId: user.id, body },
        { client: trx }
      )

      // La discussion remonte en haut de la liste
      conversation.useTransaction(trx)
      conversation.lastMessageAt = message.createdAt
      await conversation.save()

      // Mon propre message ne compte pas comme non lu pour moi
      await ConversationMember.query({ client: trx })
        .where('conversation_id', conversation.id)
        .where('user_id', user.id)
        .update({ last_read_at: message.createdAt.toJSDate() })
    })

    return response.redirect().toRoute('conversations.show', { id: conversation.id })
  }
}
