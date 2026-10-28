import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import Conversation from '#models/conversation'
import ConversationMember from '#models/conversation_member'
import Message from '#models/message'
import type User from '#models/user'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import MessageThreadService from '#services/message_thread_service'
import RealtimeService from '#services/realtime_service'
import { messageValidator } from '#validators/conversation'
import BlockService from '#services/block_service'

/**
 * Les messages d'une discussion (écran 07).
 */
export default class MessagesController {
  /**
   * Envoie un message. Seuls les membres de la discussion peuvent écrire :
   * on la cherche avec visibleTo(user), sinon 404.
   * Envoyé par le script de la page → réponse JSON avec le message déjà mis en forme.
   * Envoyé sans JavaScript → simple rechargement de la page.
   */
  async store({ auth, params, request, response, session, view }: HttpContext) {
    const user = auth.getUserOrFail()
    const conversation = await Conversation.visibleTo(user).where('id', params.id).firstOrFail()

    // Blocage : celui qui a bloqué ne peut plus écrire (il doit débloquer d'abord)
    const block = await BlockService.inPrivateChat(conversation, user.id)
    if (block?.iBlocked) {
      if (request.accepts(['html', 'json']) === 'json') {
        return response.forbidden({ message: 'Débloque cette personne pour lui écrire.' })
      }
      session.flash('error', 'Débloque cette personne pour lui écrire.')
      return response.redirect().toRoute('conversations.show', { id: conversation.id })
    }
    // Celui qui est bloqué écrit normalement, mais son message ne sera jamais remis
    const silenced = Boolean(block?.blockedMe)

    const { body } = await request.validateUsing(messageValidator)

    const message = await db.transaction(async (trx) => {
      const created = await Message.create(
        { conversationId: conversation.id, senderId: user.id, body, isBlocked: silenced },
        { client: trx }
      )

      // La discussion remonte en haut de la liste (sauf message non remis : rien ne doit bouger chez l'autre)
      if (!silenced) {
        conversation.useTransaction(trx)
        conversation.lastMessageAt = created.createdAt
        await conversation.save()
      }

      // Mon propre message ne compte pas comme non lu pour moi
      await this.markAsRead(conversation.id, user, created.createdAt.toJSDate(), trx)
      return created
    })

    // Temps réel : chaque membre est prévenu (y compris mes autres onglets ouverts).
    // Message non remis : seul l'expéditeur est prévenu.
    const event = { type: 'message' as const, conversationId: conversation.id, messageId: message.id }
    if (silenced) {
      RealtimeService.notifyUser(user.id, event)
    } else {
      await RealtimeService.notifyMembers(conversation.id, event)
    }

    if (request.accepts(['html', 'json']) === 'json') {
      await message.load('sender')
      return response.json({ id: message.id, html: await this.render(view, message, user, conversation) })
    }
    return response.redirect().toRoute('conversations.show', { id: conversation.id })
  }

  /**
   * Un seul message mis en forme, demandé par le navigateur quand il arrive en temps réel.
   * L'accès est revérifié ici : seul un membre peut le lire.
   */
  async show({ auth, params, view }: HttpContext) {
    const user = auth.getUserOrFail()
    const conversation = await Conversation.visibleTo(user).where('id', params.id).firstOrFail()
    const message = await Message.query()
      .where('conversation_id', conversation.id)
      .where('id', params.messageId)
      .where(BlockService.visibleMessages(user.id))
      .preload('sender')
      .firstOrFail()

    // La discussion est ouverte à l'écran : le message est lu, et son auteur en est prévenu
    await this.markAsRead(conversation.id, user, new Date())
    await RealtimeService.notifyRead(conversation.id, user.id)
    return this.render(view, message, user, conversation)
  }

  private async render(
    view: HttpContext['view'],
    message: Message,
    viewer: User,
    conversation: Conversation
  ) {
    const readUpTo = await MessageThreadService.readUpTo(conversation.id, viewer.id)
    return view.render('partials/message', {
      message: MessageThreadService.present(message, viewer, conversation.isGroup, false, readUpTo),
    })
  }

  /**
   * Avance ma date de dernière lecture : les messages d'avant ne sont plus « non lus ».
   */
  private markAsRead(conversationId: number, user: User, at: Date, trx?: TransactionClientContract) {
    return ConversationMember.query(trx ? { client: trx } : undefined)
      .where('conversation_id', conversationId)
      .where('user_id', user.id)
      .update({ last_read_at: at })
  }
}
