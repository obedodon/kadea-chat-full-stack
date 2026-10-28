import app from '@adonisjs/core/services/app'
import env from '#start/env'
import { join } from 'node:path'
import type { MultipartFile } from '@adonisjs/core/bodyparser'
import { randomUUID } from 'node:crypto'
import { unlink } from 'node:fs/promises'

/** Couleurs pastel des avatars (maquettes 06 et 09), choisies selon l'identifiant. */
const AVATAR_TONES = ['amber', 'green', 'blue', 'purple', 'sand'] as const

export function avatarTone(id: number) {
  return AVATAR_TONES[id % AVATAR_TONES.length]
}

/**
 * Chemin d'une photo, ou du dossier des photos s'il n'y a pas de nom.
 * Hors de public/ : elles ne sont servies qu'aux connectés.
 * En production, UPLOADS_PATH pointe vers un volume persistant.
 */
export function avatarPath(fileName?: string) {
  const directory = env.get('UPLOADS_PATH') || app.makePath('storage/avatars')
  return fileName ? join(directory, fileName) : directory
}

/**
 * Enregistre une photo (profil ou groupe) sous un nom imprévisible,
 * supprime l'ancienne s'il y en avait une, et renvoie le nouveau nom.
 */
export async function storeAvatar(file: MultipartFile, prefix: string, previous: string | null) {
  const fileName = `${prefix}-${randomUUID()}.${file.extname}`
  await file.move(avatarPath(), { name: fileName })
  if (previous) {
    await unlink(avatarPath(previous)).catch(() => {})
  }
  return fileName
}
