import type Message from '#models/message'
import ConversationMember from '#models/conversation_member'
import type User from '#models/user'
import { formatDayLabel, formatTime } from '#services/date_format'
import { avatarTone } from '#services/avatar'

export type MessageView = ReturnType<typeof MessageThreadService.present>

/**
 * Prépare les messages pour l'écran 07.
 */
export default class MessageThreadService {
  /**
   * Range les messages par jour (« Hier », « Aujourd'hui »…).
   * Les messages doivent arriver du plus ancien au plus récent, avec sender préchargé.
   */
  static group(messages: Message[], viewer: User, isGroup: boolean, readUpTo: number | null) {
    const days: { label: string; messages: MessageView[] }[] = []

    for (const message of messages) {
      const label = formatDayLabel(message.createdAt)
      let day = days.at(-1)
      if (!day || day.label !== label) {
        day = { label, messages: [] }
        days.push(day)
      }

      // Dans un groupe, l'avatar et le nom de l'auteur ne s'affichent qu'au début d'une série
      const previous = day.messages.at(-1)
      const followup = previous?.senderId === message.senderId
      day.messages.push(this.present(message, viewer, isGroup, followup, readUpTo))
    }

    return days
  }

  /**
   * Un message en données simples pour la vue partials/message.edge.
   */
  static present(
    message: Message,
    viewer: User,
    isGroup: boolean,
    followup: boolean,
    readUpTo: number | null
  ) {
    const mine = message.senderId === viewer.id
    const sentAt = message.createdAt.toMillis()
    return {
      id: message.id,
      mine,
      deleted: message.isDeleted,
      body: message.isDeleted ? null : message.body,
      time: formatTime(message.createdAt),
      dayLabel: formatDayLabel(message.createdAt),
      senderId: message.senderId,
      // Dans un groupe, les messages des autres portent l'avatar et le nom de leur auteur
      inGroup: isGroup && !mine,
      followup,
      senderName: message.sender.fullName,
      senderInitials: message.sender.initials,
      senderTone: avatarTone(message.senderId),
      senderAvatarUrl: message.sender.avatarUrl,
      sentAt,
      // Message non remis (j'ai été bloqué) : une seule barre, jamais « lu »
      undelivered: mine && message.isBlocked,
      // Accusé de lecture : mon message a été lu par au moins une autre personne
      read: mine && !message.isBlocked && readUpTo !== null && sentAt <= readUpTo,
    }
  }

  /**
   * Jusqu'à quand mes messages sont lus (en millisecondes) : la plus récente
   * des dates de dernière lecture des AUTRES membres. Dans un groupe, il suffit
   * donc qu'une seule autre personne ait lu pour que le message compte comme lu.
   * null si personne d'autre n'a encore ouvert la discussion.
   */
  static async readUpTo(conversationId: number, viewerId: number) {
    const others = await ConversationMember.query()
      .where('conversation_id', conversationId)
      .whereNot('user_id', viewerId)
    return this.latestReadAt(others)
  }

  static latestReadAt(members: ConversationMember[]) {
    const dates = members
      .filter((member) => member.lastReadAt)
      .map((member) => member.lastReadAt!.toMillis())
    return dates.length > 0 ? Math.max(...dates) : null
  }
}
