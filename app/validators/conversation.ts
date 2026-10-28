import vine from '@vinejs/vine'

/**
 * 09 · Démarrer une discussion privée avec quelqu'un.
 */
export const startConversationValidator = vine.create({
  userId: vine.number().positive(),
})

/**
 * 07 · Envoyer un message texte (2000 caractères maximum).
 */
export const messageValidator = vine.create({
  body: vine.string().trim().minLength(1).maxLength(2000),
})
