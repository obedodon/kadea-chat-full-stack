import app from '@adonisjs/core/services/app'
import db from '@adonisjs/lucid/services/db'
import env from '#start/env'
import type { MultipartFile } from '@adonisjs/core/bodyparser'
import { randomUUID } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

/** Couleurs pastel des avatars (maquettes 06 et 09), choisies selon l'identifiant. */
const AVATAR_TONES = ['amber', 'green', 'blue', 'purple', 'sand'] as const

export function avatarTone(id: number) {
  return AVATAR_TONES[id % AVATAR_TONES.length]
}

const MIME_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
}

/**
 * Ancien dossier des photos (avant leur passage dans la base) :
 * on le garde seulement pour relire les photos déjà envoyées en local.
 */
function legacyPath(fileName: string) {
  return join(env.get('UPLOADS_PATH') || app.makePath('storage/avatars'), fileName)
}

/**
 * Enregistre une photo (profil ou groupe) dans la table avatars, sous un nom imprévisible,
 * supprime l'ancienne s'il y en avait une, et renvoie le nouveau nom.
 */
export async function storeAvatar(file: MultipartFile, prefix: string, previous: string | null) {
  const extension = (file.extname || 'jpg').toLowerCase()
  const name = `${prefix}-${randomUUID()}.${extension}`
  const data = await readFile(file.tmpPath!)

  await db.table('avatars').insert({
    name,
    mime_type: MIME_TYPES[extension] ?? 'application/octet-stream',
    data,
  })
  if (previous) {
    await db.from('avatars').where('name', previous).delete()
  }
  return name
}

/**
 * Lit une photo : d'abord dans la base, sinon (anciennes photos locales) sur le disque.
 */
export async function findAvatar(name: string) {
  const row = await db.from('avatars').where('name', name).first()
  if (row) {
    return { data: row.data as Buffer, mimeType: row.mime_type as string }
  }
  try {
    const extension = name.split('.').pop() ?? ''
    return { data: await readFile(legacyPath(name)), mimeType: MIME_TYPES[extension] ?? 'image/jpeg' }
  } catch {
    return null
  }
}
