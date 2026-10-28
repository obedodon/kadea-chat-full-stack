import Conversation from '#models/conversation'
import type Message from '#models/message'
import type User from '#models/user'
import { formatListTime } from '#services/date_format'
import { avatarTone } from '#services/avatar'

const IMAGE_EXTENSIONS = /\.(png|jpe?g|gif|webp)$/i

/**
 * Prépare la liste des discussions de la colonne de gauche.
 * Toutes les requêtes partent de Conversation.visibleTo(user) :
 * on ne charge jamais une conversation dont l'utilisateur n'est pas membre.
 */
export default class ConversationListService {
  static async forUser(user: User) {
    const conversations = await Conversation.visibleTo(user)
      .preload('participants')
      // Seulement le dernier message de chaque conversation, avec son auteur
      .preload('messages', (messages) =>
        messages.groupOrderBy('messages.created_at', 'desc').groupLimit(1).preload('sender')
      )
      // Nombre de messages non lus : écrits par les autres, après ma dernière lecture
      .withCount('messages', (messages) =>
        messages
          .as('unread_count')
          .whereNot('sender_id', user.id)
          .whereNull('deleted_at')
          .whereRaw(
            `messages.created_at > coalesce(
              (select cm.last_read_at from conversation_members cm
                where cm.conversation_id = messages.conversation_id and cm.user_id = ?),
              '-infinity'::timestamptz)`,
            [user.id]
          )
      )
      .orderByRaw('coalesce(last_message_at, created_at) desc')

    return conversations.map((conversation) => this.present(conversation, user))
  }

  /**
   * Transforme une conversation en données simples pour la vue.
   */
  static present(conversation: Conversation, viewer: User) {
    const other = conversation.isGroup ? null : conversation.otherParticipant(viewer)
    const title = conversation.titleFor(viewer)
    const last = conversation.messages[0] ?? null

    return {
      id: conversation.id,
      title,
      isGroup: conversation.isGroup,
      initials: other?.initials ?? '?',
      tone: avatarTone(other?.id ?? conversation.id),
      preview: this.previewOf(last, viewer, conversation.isGroup),
      time: formatListTime(last?.createdAt ?? conversation.createdAt),
      unread: Number(conversation.$extras.unread_count ?? 0),
      search: title.toLowerCase(),
    }
  }

  /**
   * Aperçu du dernier message : « Toi : … », « Josué : … » (groupe), « Photo »…
   */
  static previewOf(last: Message | null, viewer: User, isGroup: boolean) {
    if (!last) return 'Nouvelle discussion'

    let text: string
    if (last.isDeleted) {
      text = 'Message supprimé'
    } else if (last.body) {
      text = last.body
    } else {
      text = last.fileName && IMAGE_EXTENSIONS.test(last.fileName) ? 'Photo' : 'Fichier'
    }

    if (last.senderId === viewer.id) return `Toi : ${text}`
    if (isGroup && last.sender) return `${last.sender.fullName.split(' ')[0]} : ${text}`
    return text
  }

  /**
   * En-tête d'une discussion ouverte (maquette 07). Nécessite participants (preload).
   */
  static header(conversation: Conversation, viewer: User) {
    const other = conversation.isGroup ? null : conversation.otherParticipant(viewer)
    return {
      id: conversation.id,
      title: conversation.titleFor(viewer),
      isGroup: conversation.isGroup,
      initials: other?.initials ?? '?',
      tone: avatarTone(other?.id ?? conversation.id),
      subtitle: conversation.isGroup ? `${conversation.participants.length} membres` : (other?.email ?? ''),
    }
  }
}
