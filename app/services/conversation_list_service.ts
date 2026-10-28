import Conversation from '#models/conversation'
import type Message from '#models/message'
import type User from '#models/user'
import { APP_ZONE, formatListTime } from '#services/date_format'
import { avatarTone } from '#services/avatar'
import BlockService from '#services/block_service'

const IMAGE_EXTENSIONS = /\.(png|jpe?g|gif|webp)$/i

/**
 * Prépare la liste des discussions de la colonne de gauche.
 * Toutes les requêtes partent de Conversation.visibleTo(user) :
 * on ne charge jamais une conversation dont l'utilisateur n'est pas membre.
 */
export default class ConversationListService {
  static async forUser(user: User) {
    const hiddenProfiles = await BlockService.blockersOf(user.id)
    const conversations = await Conversation.visibleTo(user)
      .preload('participants')
      // Seulement le dernier message de chaque conversation, avec son auteur
      .preload('messages', (messages) =>
        messages
          .where(BlockService.visibleMessages(user.id))
          .groupOrderBy('messages.created_at', 'desc')
          .groupLimit(1)
          .preload('sender')
      )
      // Nombre de messages non lus : écrits par les autres, après ma dernière lecture
      .withCount('messages', (messages) =>
        messages
          .as('unread_count')
          .whereNot('sender_id', user.id)
          .whereNull('deleted_at')
          .where('is_blocked', false)
          .whereRaw(
            `messages.created_at > coalesce(
              (select cm.last_read_at from conversation_members cm
                where cm.conversation_id = messages.conversation_id and cm.user_id = ?),
              '-infinity'::timestamptz)`,
            [user.id]
          )
      )
      .orderByRaw('coalesce(last_message_at, created_at) desc')

    return conversations.map((conversation) => this.present(conversation, user, hiddenProfiles))
  }

  /**
   * Transforme une conversation en données simples pour la vue.
   */
  static present(conversation: Conversation, viewer: User, hiddenProfiles: Set<number>) {
    const other = conversation.isGroup ? null : conversation.otherParticipant(viewer)
    const hidden = other ? hiddenProfiles.has(other.id) : false
    const title = conversation.titleFor(viewer)
    const last = conversation.messages[0] ?? null

    return {
      id: conversation.id,
      title,
      isGroup: conversation.isGroup,
      initials: other?.initials ?? '?',
      tone: avatarTone(other?.id ?? conversation.id),
      avatarUrl: conversation.isGroup ? conversation.avatarUrl : hidden ? null : (other?.avatarUrl ?? null),
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
  static header(conversation: Conversation, viewer: User, hidden = false) {
    const other = conversation.isGroup ? null : conversation.otherParticipant(viewer)
    return {
      id: conversation.id,
      title: conversation.titleFor(viewer),
      isGroup: conversation.isGroup,
      initials: other?.initials ?? '?',
      tone: avatarTone(other?.id ?? conversation.id),
      avatarUrl: conversation.isGroup ? conversation.avatarUrl : hidden ? null : (other?.avatarUrl ?? null),
      subtitle: conversation.isGroup
        ? `${conversation.participants.length} membres : ${this.firstNames(conversation)}`
        : hidden
          ? ''
          : (other?.email ?? ''),
    }
  }

  /**
   * Panneau « Infos du groupe » (maquette 08). Nécessite participants (preload).
   * Le rôle vient de la table conversation_members (pivot_role).
   */
  static groupInfo(conversation: Conversation, viewer: User) {
    const members = conversation.participants
      .map((participant) => ({
        id: participant.id,
        fullName: participant.fullName,
        initials: participant.initials,
        tone: avatarTone(participant.id),
        avatarUrl: participant.avatarUrl,
        isAdmin: participant.$extras.pivot_role === 'admin',
        isMe: participant.id === viewer.id,
      }))
      // Les admins d'abord, puis par ordre alphabétique
      .sort((a, b) => Number(b.isAdmin) - Number(a.isAdmin) || a.fullName.localeCompare(b.fullName))

    return {
      id: conversation.id,
      name: conversation.name ?? '',
      avatarUrl: conversation.avatarUrl,
      description: conversation.description ?? '',
      firstNames: this.firstNames(conversation),
      members,
      memberIds: members.map((member) => member.id),
      canManage: members.some((member) => member.isMe && member.isAdmin),
    }
  }

  /**
   * Panneau « Infos du contact » d'une discussion privée. Nécessite participants (preload).
   */
  static contactInfo(conversation: Conversation, viewer: User, hidden = false) {
    const other = conversation.otherParticipant(viewer)
    if (!other) return null
    // Si cette personne m'a bloqué, je ne vois plus son profil : seulement son nom et ses initiales
    return {
      id: other.id,
      fullName: other.fullName,
      email: hidden ? null : other.email,
      initials: other.initials,
      tone: avatarTone(other.id),
      avatarUrl: hidden ? null : other.avatarUrl,
      memberSince: hidden
        ? null
        : other.createdAt.setZone(APP_ZONE).setLocale('fr').toFormat('LLLL yyyy'),
    }
  }

  private static firstNames(conversation: Conversation) {
    return conversation.participants.map((participant) => participant.fullName.split(' ')[0]).join(', ')
  }
}
