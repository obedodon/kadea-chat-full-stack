import { DateTime } from 'luxon'

/**
 * Fuseau de Kinshasa : les heures affichées sont celles des utilisateurs de Kadea Academy.
 */
export const APP_ZONE = 'Africa/Kinshasa'

/**
 * Heure affichée dans la liste des discussions (maquette 06) :
 * aujourd'hui → « 11:48 », hier → « Hier », cette semaine → « Lun. », sinon → « 22/10 ».
 */
export function formatListTime(date: DateTime | null) {
  if (!date) return ''
  const value = date.setZone(APP_ZONE).setLocale('fr')
  const today = DateTime.now().setZone(APP_ZONE).startOf('day')
  const day = value.startOf('day')
  const daysAgo = Math.round(today.diff(day, 'days').days)

  if (daysAgo <= 0) return value.toFormat('HH:mm')
  if (daysAgo === 1) return 'Hier'
  if (daysAgo < 7) {
    const name = value.toFormat('ccc') // « lun. »
    return name.charAt(0).toUpperCase() + name.slice(1)
  }
  return value.toFormat('dd/MM')
}

/** Heure d'un message : « 18:24 ». */
export function formatTime(date: DateTime) {
  return date.setZone(APP_ZONE).toFormat('HH:mm')
}

/** Séparateur de jour dans une discussion : « Aujourd'hui », « Hier », « lundi 26 octobre ». */
export function formatDayLabel(date: DateTime) {
  const value = date.setZone(APP_ZONE).setLocale('fr')
  const today = DateTime.now().setZone(APP_ZONE).startOf('day')
  const daysAgo = Math.round(today.diff(value.startOf('day'), 'days').days)
  if (daysAgo <= 0) return "Aujourd'hui"
  if (daysAgo === 1) return 'Hier'
  return value.toFormat('cccc d LLLL')
}
