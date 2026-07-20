import vine from '@vinejs/vine'

/**
 * Shared rule for setting/confirming a password.
 */
const password = () => vine.string().minLength(8).maxLength(32)

/**
 * Validator used when an invitee accepts their invite and sets a password.
 */
export const acceptInviteValidator = vine.create({
  token: vine.string(),
  password: password().confirmed({
    confirmationField: 'passwordConfirmation',
  }),
})
