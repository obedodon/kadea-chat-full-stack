/*
|--------------------------------------------------------------------------
| Canaux temps réel (Transmit)
|--------------------------------------------------------------------------
|
| Chaque utilisateur écoute un seul canal : users/<son id>.
| Le serveur y envoie « nouveau message dans telle discussion »,
| « nouvelle discussion »… Personne ne peut écouter le canal d'un autre.
|
*/

import transmit from '@adonisjs/transmit/services/main'
import type { HttpContext } from '@adonisjs/core/http'

transmit.authorize<{ id: string }>('users/:id', (ctx: HttpContext, { id }) => {
  return ctx.auth.user?.id === Number(id)
})
