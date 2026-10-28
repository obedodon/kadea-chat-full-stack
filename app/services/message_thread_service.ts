import type Message from '#models/message'
import type User from '#models/user'
import { formatDayLabel, formatTime } from '#services/date_format'

/**
 * Range les messages par jour (« Hier », « Aujourd'hui »…) pour l'écran 07.
 * Les messages doivent arriver du plus ancien au plus récent, avec sender préchargé.
 */
export default class MessageThreadService {
  static group(messages: Message[], viewer: User, isGroup: boolean) {
    const days: {
      label: string
      messages: {
        id: number
        mine: boolean
        deleted: boolean
        body: string | null
        time: string
        senderId: number
        senderName: string | null
      }[]
    }[] = []

    for (const message of messages) {
      const label = formatDayLabel(message.createdAt)
      let day = days.at(-1)
      if (!day || day.label !== label) {
        day = { label, messages: [] }
        days.push(day)
      }

      const mine = message.senderId === viewer.id
      const previous = day.messages.at(-1)
      // Dans un groupe, on affiche le nom de l'auteur au début de chaque série de messages
      const showName = isGroup && !mine && previous?.senderId !== message.senderId

      day.messages.push({
        id: message.id,
        mine,
        deleted: message.isDeleted,
        body: message.isDeleted ? null : message.body,
        time: formatTime(message.createdAt),
        senderId: message.senderId,
        senderName: showName ? message.sender.fullName : null,
      })
    }

    return days
  }
}
