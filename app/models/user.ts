import { UserSchema } from '#database/schema'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { hasMany, manyToMany } from '@adonisjs/lucid/orm'
import type { HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'
import Conversation from '#models/conversation'
import ConversationMember from '#models/conversation_member'

/**
 * Modèle User : un compte Kadea Chat.
 * withAuthFinder ajoute verifyCredentials() et hache le mot de passe
 * automatiquement avant chaque enregistrement (RG3).
 */
export default class User extends compose(UserSchema, withAuthFinder(hash)) {
  /** Ses adhésions (une ligne par conversation dont il est membre). */
  @hasMany(() => ConversationMember)
  declare memberships: HasMany<typeof ConversationMember>

  /** Ses conversations, directement. */
  @manyToMany(() => Conversation, {
    pivotTable: 'conversation_members',
    pivotColumns: ['role', 'last_read_at'],
    pivotTimestamps: { createdAt: 'created_at', updatedAt: false },
  })
  declare conversations: ManyToMany<typeof Conversation>

  /**
   * Vrai quand l'adresse e-mail a été confirmée (RG4).
   */
  get isVerified() {
    return this.emailVerifiedAt !== null
  }

  /**
   * Adresse de la photo de profil, ou null s'il n'y en a pas (on affiche alors les initiales).
   */
  get avatarUrl() {
    return this.avatarPath ? `/avatars/${this.avatarPath}` : null
  }

  /**
   * Initiales affichées quand il n'y a pas de photo de profil.
   */
  get initials() {
    const [first, last] = this.fullName.trim().split(/\s+/)
    if (first && last) {
      return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase()
    }
    return first.slice(0, 2).toUpperCase()
  }
}
