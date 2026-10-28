/*
|--------------------------------------------------------------------------
| Validator file
|--------------------------------------------------------------------------
|
| The validator file is used for configuring global transforms for VineJS.
| The transform below converts all VineJS date outputs from JavaScript
| Date objects to Luxon DateTime instances, so that validated dates are
| ready to use with Lucid models and other parts of the app that expect
| Luxon DateTime.
|
*/

import { DateTime } from 'luxon'
import vine, { VineDate, SimpleMessagesProvider } from '@vinejs/vine'

declare module '@vinejs/vine/types' {
  interface VineGlobalTransforms {
    date: DateTime
  }
}

VineDate.transform((value) => DateTime.fromJSDate(value))

/**
 * Messages d'erreur des formulaires, en français.
 * {{ min }} et {{ max }} sont remplacés par les limites de chaque règle.
 */
vine.messagesProvider = new SimpleMessagesProvider({
  'required': 'Ce champ est obligatoire.',
  'string': 'Ce champ doit contenir du texte.',
  'email': 'Saisis une adresse e-mail valide.',
  'minLength': 'Saisis au moins {{ min }} caractères.',
  'maxLength': 'Saisis au plus {{ max }} caractères.',
  'sameAs': 'Les deux mots de passe ne correspondent pas.',
  'database.unique': 'Cette adresse est déjà utilisée. Connecte-toi plutôt.',
})
