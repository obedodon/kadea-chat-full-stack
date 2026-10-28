import vine from '@vinejs/vine'

const name = vine.string().trim().minLength(2).maxLength(80)
const description = vine.string().trim().maxLength(500).optional()
const memberIds = vine.array(vine.number().positive()).minLength(1).maxLength(50)

/** Nouveau groupe : un nom, une description facultative et au moins une autre personne. */
export const createGroupValidator = vine.create({ name, description, memberIds })

/** Modifier le nom et la description (admin uniquement). */
export const updateGroupValidator = vine.create({ name, description })

/** Ajouter des membres (admin uniquement). */
export const addMembersValidator = vine.create({ memberIds })

/** Photo du groupe (tous les membres peuvent la changer) : JPG ou PNG, 2 Mo maximum. */
export const groupPhotoValidator = vine.create({
  avatar: vine.file({ size: '2mb', extnames: ['jpg', 'jpeg', 'png'] }),
})
