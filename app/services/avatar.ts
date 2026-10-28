import app from '@adonisjs/core/services/app'
import type { MultipartFile } from '@adonisjs/core/bodyparser'
import { randomUUID } from 'node:crypto'
import { unlink } from 'node:fs/promises'

/** Couleurs pastel des avatars (maquettes 06 et 09), choisies selon l'identifiant. */
const AVATAR_TONES = ['amber', 'green', 'blue', 'purple', 'sand'] as const

export function avatarTone(id: number) {
  return AVATAR_TONES[id % AVATAR_TONES.length]
}

/** Dossier des photos (hors de public/ : elles ne sont servies qu'aux connectés). */
export const AVATARS_DIR = 'storage/avatars'

/**
 * Enregistre une photo (profil ou groupe) sous un nom imprévisible,
 * supprime l'ancienne s'il y en avait une, et renvoie le nouveau nom.
 */
export async function storeAvatar(file: MultipartFile, prefix: string, previous: string | null) {
  const fileName = `${prefix}-${randomUUID()}.${file.extname}`
  await file.move(app.makePath(AVATARS_DIR), { name: fileName })
  if (previous) {
    await unlink(app.makePath(AVATARS_DIR, previous)).catch(() => {})
  }
  return fileName
}
