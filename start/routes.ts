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

    router.post('logout', [controllers.Session, 'destroy'])
  })
  .use(middleware.auth())
