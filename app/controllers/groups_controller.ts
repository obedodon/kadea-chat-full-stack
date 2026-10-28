import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import Conversation from '#models/conversation'
import ConversationMember from '#models/conversation_member'
import User from '#models/user'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import RealtimeService from '#services/realtime_service'
import { storeAvatar } from '#services/avatar'
import {
  addMembersValidator,
  createGroupValidator,
  groupPhotoValidator,
  updateGroupValidator,
} from '#validators/group'

/**
 * Les groupes (écran 08) : création, modification, membres, départ.
 * Règles : le créateur est admin ; seul un admin modifie le groupe ou ses membres ;
 * si le dernier admin part, le membre le plus ancien devient admin ;
 * un groupe sans membres est supprimé.
 */
export default class GroupsController {
  /**
   * Crée un groupe avec ses premiers membres.
   */
  async store({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const { name, description, memberIds } = await request.validateUsing(createGroupValidator)
    const others = await this.verifiedUsers(memberIds, user)

    const group = await db.transaction(async (trx) => {
      const created = await Conversation.create(
        { type: 'group', name, description: description || null, createdBy: user.id },
        { client: trx }
      )
      await created.related('participants').attach(
        {
          [user.id]: { role: 'admin' },
          ...Object.fromEntries(others.map((other) => [other.id, { role: 'member' }])),
        },
        trx
      )
      return created
    })

    await RealtimeService.notifyMembers(group.id, { type: 'conversation', conversationId: group.id })
    return response.redirect().toRoute('conversations.show', { id: group.id })
  }

  /**
   * Modifie le nom et la description.
   */
  async update({ auth, params, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const { group, me } = await this.findGroup(user, params.id)
    if (!me.isAdmin) return this.forbidden(response, session, group.id)

    const { name, description } = await request.validateUsing(updateGroupValidator)
    group.merge({ name, description: description || null })
    await group.save()

    await RealtimeService.notifyMembers(group.id, { type: 'conversation', conversationId: group.id })
    session.flash('success', 'Le groupe a été modifié.')
    return response.redirect().toRoute('conversations.show', { id: group.id })
  }

  /**
   * Change la photo du groupe. Tous les membres en ont le droit (pas seulement les admins).
   */
  async photo({ auth, params, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const { group } = await this.findGroup(user, params.id)
    const { avatar } = await request.validateUsing(groupPhotoValidator)

    group.avatarPath = await storeAvatar(avatar, `g${group.id}`, group.avatarPath)
    await group.save()

    await RealtimeService.notifyMembers(group.id, { type: 'conversation', conversationId: group.id })
    session.flash('success', 'Photo du groupe modifiée.')
    return response.redirect().toRoute('conversations.show', { id: group.id })
  }

  /**
   * Ajoute des membres. Les personnes déjà membres sont ignorées.
   */
  async addMembers({ auth, params, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const { group, me } = await this.findGroup(user, params.id)
    if (!me.isAdmin) return this.forbidden(response, session, group.id)

    const { memberIds } = await request.validateUsing(addMembersValidator)
    const alreadyIn = new Set(group.members.map((member) => member.userId))
    const newcomers = (await this.verifiedUsers(memberIds, user)).filter((u) => !alreadyIn.has(u.id))

    if (newcomers.length > 0) {
      await group
        .related('participants')
        .attach(Object.fromEntries(newcomers.map((newcomer) => [newcomer.id, { role: 'member' }])))
      await RealtimeService.notifyMembers(group.id, { type: 'conversation', conversationId: group.id })
    }

    session.flash('success', newcomers.length > 1 ? 'Membres ajoutés.' : 'Membre ajouté.')
    return response.redirect().toRoute('conversations.show', { id: group.id })
  }

  /**
   * Retire un membre du groupe.
   */
  async removeMember({ auth, params, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const { group, me } = await this.findGroup(user, params.id)
    if (!me.isAdmin) return this.forbidden(response, session, group.id)

    const target = group.members.find((member) => member.userId === Number(params.userId))
    if (!target || target.userId === user.id) {
      session.flash('error', "Ce membre ne peut pas être retiré. Pour partir, utilise « Quitter le groupe ».")
      return response.redirect().toRoute('conversations.show', { id: group.id })
    }

    await target.delete()
    RealtimeService.notifyUser(target.userId, { type: 'removed', conversationId: group.id })
    await RealtimeService.notifyMembers(group.id, { type: 'conversation', conversationId: group.id })

    session.flash('success', 'Membre retiré du groupe.')
    return response.redirect().toRoute('conversations.show', { id: group.id })
  }

  /**
   * Quitte le groupe.
   */
  async leave({ auth, params, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const { group, me } = await this.findGroup(user, params.id)

    const deleted = await db.transaction(async (trx) => {
      me.useTransaction(trx)
      await me.delete()

      const remaining = await ConversationMember.query({ client: trx })
        .where('conversation_id', group.id)
        .orderBy('created_at', 'asc')
        .orderBy('id', 'asc')

      if (remaining.length === 0) {
        group.useTransaction(trx)
        await group.delete()
        return true
      }

      await this.ensureAnAdmin(remaining, trx)
      return false
    })

    if (!deleted) {
      await RealtimeService.notifyMembers(group.id, { type: 'conversation', conversationId: group.id })
    }

    session.flash('success', `Tu as quitté le groupe « ${group.name} ».`)
    return response.redirect().toRoute('conversations.index')
  }

  /**
   * Le groupe, seulement si l'utilisateur en est membre (sinon 404).
   */
  private async findGroup(user: User, id: string | number) {
    const group = await Conversation.visibleTo(user)
      .where('id', id)
      .where('type', 'group')
      .preload('members')
      .firstOrFail()
    const me = group.members.find((member) => member.userId === user.id)!
    return { group, me }
  }

  /**
   * Les comptes confirmés parmi les identifiants reçus, sans soi-même ni doublon.
   */
  private async verifiedUsers(ids: number[], user: User) {
    const unique = [...new Set(ids)].filter((id) => id !== user.id)
    if (unique.length === 0) return []
    return User.query().whereIn('id', unique).whereNotNull('email_verified_at')
  }

  /**
   * S'il ne reste aucun admin, le membre le plus ancien le devient.
   */
  private async ensureAnAdmin(members: ConversationMember[], trx: TransactionClientContract) {
    if (members.some((member) => member.isAdmin)) return
    const oldest = members[0]
    oldest.useTransaction(trx)
    oldest.role = 'admin'
    await oldest.save()
  }

  /**
   * Action réservée aux admins : on refuse avec un message clair.
   */
  private forbidden(
    response: HttpContext['response'],
    session: HttpContext['session'],
    groupId: number
  ) {
    session.flash('error', 'Seul un administrateur du groupe peut faire ça.')
    return response.redirect().toRoute('conversations.show', { id: groupId })
  }
}
