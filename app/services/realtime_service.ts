import transmit from '@adonisjs/transmit/services/main'
import ConversationMember from '#models/conversation_member'
import MessageThreadService from '#services/message_thread_service'

/**
 * Ce que le navigateur reçoit sur son canal users/<id>.
 * On n'envoie que des identifiants, jamais le contenu du message :
 * le navigateur redemande le message au serveur, qui revérifie le droit d'accès.
 */
export type RealtimeEvent =
  | { type: 'message'; conversationId: number; messageId: number }
  | { type: 'conversation'; conversationId: number }
  | { type: 'read'; conversationId: number; readUpTo: number }

export default class RealtimeService {
  /**
   * Prévient chaque membre d'une discussion, sur son propre canal.
   */
  static async notifyMembers(conversationId: number, event: RealtimeEvent) {
    const members = await ConversationMember.query()
      .select('user_id')
      .where('conversation_id', conversationId)

    for (const member of members) {
      this.notifyUser(member.userId, event)
    }
  }

  /**
   * Quelqu'un vient de lire la discussion : chaque autre membre reçoit
   * jusqu'à quand ses propres messages sont lus, pour colorer ses accusés de lecture.
   */
  static async notifyRead(conversationId: number, readerId: number) {
    const members = await ConversationMember.query().where('conversation_id', conversationId)

    for (const member of members) {
      if (member.userId === readerId) continue
      const others = members.filter((other) => other.userId !== member.userId)
      const readUpTo = MessageThreadService.latestReadAt(others)
      if (readUpTo !== null) {
        this.notifyUser(member.userId, { type: 'read', conversationId, readUpTo })
      }
    }
  }

  static notifyUser(userId: number, event: RealtimeEvent) {
    transmit.broadcast(`users/${userId}`, event)
  }
}
