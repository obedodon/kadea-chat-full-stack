import Block from '#models/block'
import ConversationMember from '#models/conversation_member'
import type Conversation from '#models/conversation'

/**
 * Règles du blocage.
 */
export default class BlockService {
  /**
   * Qui a bloqué qui entre deux personnes.
   */
  static async between(viewerId: number, otherId: number) {
    const blocks = await Block.query()
      .where((query) => query.where('blocker_id', viewerId).where('blocked_id', otherId))
      .orWhere((query) => query.where('blocker_id', otherId).where('blocked_id', viewerId))

    const iBlocked = blocks.some((block) => block.blockerId === viewerId)
    const blockedMe = blocks.some((block) => block.blockerId === otherId)
    return { iBlocked, blockedMe, any: iBlocked || blockedMe }
  }

  /**
   * État du blocage dans une discussion privée (null pour un groupe : jamais concerné).
   */
  static async inPrivateChat(conversation: Conversation, viewerId: number) {
    if (conversation.isGroup) return null
    const other = await ConversationMember.query()
      .where('conversation_id', conversation.id)
      .whereNot('user_id', viewerId)
      .first()
    if (!other) return null
    return this.between(viewerId, other.userId)
  }

  /**
   * Les personnes qui m'ont bloqué : je ne vois plus leur photo ni leur profil.
   */
  static async blockersOf(userId: number) {
    const blocks = await Block.query().select('blocker_id').where('blocked_id', userId)
    return new Set(blocks.map((block) => block.blockerId))
  }

  /**
   * Filtre des messages, à passer à .where() : les messages non remis
   * (is_blocked) ne sont visibles que de leur auteur.
   */
  static visibleMessages(viewerId: number) {
    return (query: any) => query.where('is_blocked', false).orWhere('sender_id', viewerId)
  }

  /**
   * Sous-requêtes : les personnes que j'ai bloquées, et celles qui m'ont bloqué.
   */
  static blockedByMe(viewerId: number) {
    return Block.query().select('blocked_id').where('blocker_id', viewerId)
  }

}
