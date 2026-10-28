/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| Chaque route relie une adresse (URL) à la méthode d'un contrôleur.
|
*/

import { middleware } from '#start/kernel'
import { controllers } from '#generated/controllers'
import router from '@adonisjs/core/services/router'
import transmit from '@adonisjs/transmit/services/main'

/**
 * Routes de Transmit (temps réel). Pour s'abonner à un canal,
 * il faut être connecté : le canal users/<id> est vérifié dans start/transmit.ts.
 */
transmit.registerRoutes((route) => {
  if (route.getPattern() === '__transmit/subscribe') {
    route.middleware(middleware.auth())
  }
})

/**
 * Accueil : les discussions si on est connecté, sinon la page de connexion.
 */
router
  .get('/', ({ auth, response }) => {
    return response.redirect(auth.isAuthenticated ? '/conversations' : '/login')
  })
  .as('home')

/**
 * Pages réservées aux visiteurs non connectés (écrans 01 à 05)
 */
router
  .group(() => {
    // 01 · Inscription
    router.get('signup', [controllers.NewAccount, 'create'])
    router.post('signup', [controllers.NewAccount, 'store'])

    // 02 · Connexion
    router.get('login', [controllers.Session, 'create'])
    router.post('login', [controllers.Session, 'store'])

    // 03 · Vérifie ta boîte mail, lien de confirmation et renvoi
    router.get('verify-email', [controllers.EmailVerification, 'notice']).as('verification.notice')
    router.get('verify-email/:token', [controllers.EmailVerification, 'verify']).as('verification.verify')
    router.post('verify-email/resend', [controllers.EmailVerification, 'resend']).as('verification.resend')

    // 04 · Mot de passe oublié
    router.get('forgot-password', [controllers.PasswordReset, 'create']).as('password.forgot')
    router.post('forgot-password', [controllers.PasswordReset, 'store']).as('password.email')

    // 05 · Nouveau mot de passe
    router.get('reset-password/:token', [controllers.PasswordReset, 'edit']).as('password.reset')
    router.post('reset-password', [controllers.PasswordReset, 'update']).as('password.update')
  })
  .use(middleware.guest())

/**
 * Pages réservées aux utilisateurs connectés
 */
router
  .group(() => {
    // 06 · Discussions
    router.get('conversations', [controllers.Conversations, 'index']).as('conversations.index')
    // Morceau de page : la liste de gauche, rechargée en temps réel
    router.get('conversations/sidebar', [controllers.Conversations, 'sidebar']).as('conversations.sidebar')

    // 09 · Nouvelle discussion : recherche de personnes, puis création
    router.get('users/search', [controllers.Users, 'search']).as('users.search')
    router.post('conversations', [controllers.Conversations, 'store']).as('conversations.store')

    // 07 · Une discussion et ses messages (l'identifiant doit être un nombre)
    router
      .get('conversations/:id', [controllers.Conversations, 'show'])
      .as('conversations.show')
      .where('id', router.matchers.number())
    router
      .post('conversations/:id/messages', [controllers.Messages, 'store'])
      .as('messages.store')
      .where('id', router.matchers.number())
    // Morceau de page : un seul message, affiché quand il arrive en temps réel
    router
      .get('conversations/:id/messages/:messageId', [controllers.Messages, 'show'])
      .as('messages.show')
      .where('id', router.matchers.number())
      .where('messageId', router.matchers.number())

    // 08 · Groupes : création, modification, membres et départ
    router.post('groups', [controllers.Groups, 'store']).as('groups.store')
    router
      .group(() => {
        router.post('/', [controllers.Groups, 'update']).as('groups.update')
        router.post('photo', [controllers.Groups, 'photo']).as('groups.photo')
        router.post('members', [controllers.Groups, 'addMembers']).as('groups.members.add')
        router
          .post('members/:userId/remove', [controllers.Groups, 'removeMember'])
          .as('groups.members.remove')
          .where('userId', router.matchers.number())
        router.post('leave', [controllers.Groups, 'leave']).as('groups.leave')
      })
      .prefix('groups/:id')
      .where('id', router.matchers.number())

    // Bloquer / débloquer une personne
    router
      .post('users/:id/block', [controllers.Blocks, 'store'])
      .as('blocks.store')
      .where('id', router.matchers.number())
    router
      .post('users/:id/unblock', [controllers.Blocks, 'destroy'])
      .as('blocks.destroy')
      .where('id', router.matchers.number())

    // 10 · Ton profil
    router.get('profile', [controllers.Profile, 'show']).as('profile.show')
    router.post('profile', [controllers.Profile, 'update']).as('profile.update')
    router.post('profile/password', [controllers.Profile, 'password']).as('profile.password')
    router
      .get('avatars/:file', [controllers.Profile, 'avatar'])
      .as('avatars.show')
      .where('file', /^[\w-]+\.(jpg|jpeg|png)$/)

    router.post('logout', [controllers.Session, 'destroy'])
  })
  .use(middleware.auth())
