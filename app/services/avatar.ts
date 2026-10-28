/** Couleurs pastel des avatars (maquettes 06 et 09), choisies selon l'identifiant. */
const AVATAR_TONES = ['amber', 'green', 'blue', 'purple', 'sand'] as const

export function avatarTone(id: number) {
  return AVATAR_TONES[id % AVATAR_TONES.length]
}
