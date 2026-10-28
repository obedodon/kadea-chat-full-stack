import { ConversationSchema } from '#database/schema'
import { belongsTo, hasMany, manyToMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import ConversationMember from '#models/conversation_member'
import Message from '#models/message'

/**
 * Modèle Conversation : une discussion privée (2 personnes) ou un groupe.
 */
export default class Conversation extends ConversationSchema {
  /** Les lignes d'adhésion (avec rôle et date de dernière lecture). */
  @hasMany(() => ConversationMember)
  declare members: HasMany<typeof ConversationMember>

  /** Les personnes de la conversation, directement (via la table conversation_members). */
  @manyToMany(() => User, {
    pivotTable: 'conversation_members',
    pivotColumns: ['role', 'last_read_at'],
    pivotTimestamps: { createdAt: 'created_at', updatedAt: false },
  })
  declare participants: ManyToMany<typeof User>

  @hasMany(() => Message)
  declare messages: HasMany<typeof Message>

  /** Celui qui a créé le groupe (null si son compte a été supprimé). */
  @belongsTo(() => User, { foreignKey: 'createdBy' })
  declare creator: BelongsTo<typeof User>

  /**
   * Les conversations dont l'utilisateur est membre, et seulement celles-là.
   * C'est la base du contrôle d'accès : on ne cherche jamais en dehors.
   * Utilisation : await Conversation.visibleTo(user).where('id', 12).first()
   */
  static visibleTo(user: User) {
    return Conversation.query().whereIn(
      'id',
      ConversationMember.query().select('conversation_id').where('user_id', user.id)
    )
  }

  get isGroup() {
    return this.type === 'group'
  }

  /**
   * Dans une discussion privée, l'autre personne.
   * Nécessite d'avoir chargé participants (preload).
   */
  otherParticipant(viewer: User) {
    return this.participants.find((participant) => participant.id !== viewer.id) ?? null
  }

  /**
   * Le nom affiché dans la liste : nom du groupe, ou nom de l'autre personne.
   */
  titleFor(viewer: User) {
    if (this.isGroup) {
      return this.name ?? 'Groupe sans nom'
    }
    return this.otherParticipant(viewer)?.fullName ?? 'Utilisateur supprimé'
  }
}
