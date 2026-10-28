import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import Conversation from '#models/conversation'
import ConversationMember from '#models/conversation_member'
import User from '#models/user'
import ConversationListService from '#services/conversation_list_service'
import MessageThreadService from '#services/message_thread_service'
import RealtimeService from '#services/realtime_service'
import { startConversationValidator } from '#validators/conversation'

/**
 * Les discussions de l'utilisateur connecté (écrans 06, 07 et 09).
 */
export default class ConversationsController {
  /**
   * 06 · La liste des discussions, avec l'écran « Choisis une discussion ».
   */
  async index({ auth, view }: HttpContext) {
    const user = auth.getUserOrFail()
    const conversations = await ConversationListService.forUser(user)
    return view.render('pages/conversations/index', { conversations })
  }

  /**
   * Morceau de page : la liste de gauche seule. Le navigateur la redemande
   * quand un événement temps réel arrive (nouveau message, nouvelle discussion).
   */
  async sidebar({ auth, request, view }: HttpContext) {
    const user = auth.getUserOrFail()
    const conversations = await ConversationListService.forUser(user)
    const activeId = Number(request.input('active')) || null
    return view.render('partials/chat_list', { conversations, activeId })
  }

  /**
   * 09 · Démarre une discussion privée, ou rouvre celle qui existe déjà
   * avec cette personne (une seule discussion privée par paire).
   */
  async store({ auth, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const { userId } = await request.validateUsing(startConversationValidator)

    const target = await User.query().where('id', userId).whereNotNull('email_verified_at').first()
    if (!target || target.id === user.id) {
      session.flash('error', "Cette personne n'est pas disponible.")
      return response.redirect().toRoute('conversations.index')
    }

    const existing = await Conversation.visibleTo(user)
      .where('type', 'private')
      .whereIn(
        'id',
        ConversationMember.query().select('conversation_id').where('user_id', target.id)
      )
      .first()
    if (existing) {
      return response.redirect().toRoute('conversations.show', { id: existing.id })
    }

    // Transaction : la conversation et ses deux membres sont créés ensemble, ou pas du tout
    const conversation = await db.transaction(async (trx) => {
      const created = await Conversation.create(
        { type: 'private', createdBy: user.id },
        { client: trx }
      )
      await created
        .related('participants')
        .attach({ [user.id]: { role: 'member' }, [target.id]: { role: 'member' } }, trx)
      return created
    })

    // Temps réel : la nouvelle discussion apparaît aussitôt dans la liste de l'autre personne
    RealtimeService.notifyUser(target.id, { type: 'conversation', conversationId: conversation.id })

    return response.redirect().toRoute('conversations.show', { id: conversation.id })
  }

  /**
   * 07 · Une discussion ouverte : ses messages et la zone d'écriture.
   * firstOrFail() sur visibleTo(user) : si l'utilisateur n'est pas membre,
   * il obtient une page 404, comme si la discussion n'existait pas.
   */
  async show({ auth, params, view }: HttpContext) {
    const user = auth.getUserOrFail()
    const conversation = await Conversation.visibleTo(user)
      .where('id', params.id)
      .preload('participants')
      .firstOrFail()

    // Les 50 derniers messages, remis du plus ancien au plus récent
    const messages = await conversation
      .related('messages')
      .query()
      .preload('sender')
      .orderBy('created_at', 'desc')
      .orderBy('id', 'desc')
      .limit(50)
    messages.reverse()

    // Ouvrir la discussion = tout lire : le compteur de non-lus retombe à zéro
    await ConversationMember.query()
      .where('conversation_id', conversation.id)
      .where('user_id', user.id)
      .update({ last_read_at: new Date() })
    // L'autre personne voit ses accusés de lecture passer à l'orange
    await RealtimeService.notifyRead(conversation.id, user.id)

    const conversations = await ConversationListService.forUser(user)
    const readUpTo = await MessageThreadService.readUpTo(conversation.id, user.id)

    return view.render('pages/conversations/show', {
      conversations,
      header: ConversationListService.header(conversation, user),
      days: MessageThreadService.group(messages, user, conversation.isGroup, readUpTo),
    })
  }
}
