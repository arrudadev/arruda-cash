import { createHash, randomBytes, randomUUID } from 'node:crypto'
import { beforeCreate } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'
import { InviteSchema } from '#database/schema'

const TOKEN_BYTES = 32
const EXPIRES_IN_HOURS = 72

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

export default class Invite extends InviteSchema {
  static selfAssignPrimaryKey = true

  @beforeCreate()
  static assignUuid(invite: Invite) {
    invite.id = invite.id ?? randomUUID()
  }

  /**
   * Creates a new invite for the given email and returns the raw token
   * alongside it. Only the hash of the token is persisted, so this is the
   * only place the raw value is ever available.
   */
  static async issue(email: string, fullName?: string) {
    const token = randomBytes(TOKEN_BYTES).toString('hex')
    const invite = await Invite.create({
      email,
      fullName: fullName ?? null,
      tokenHash: hashToken(token),
      expiresAt: DateTime.now().plus({ hours: EXPIRES_IN_HOURS }),
    })

    return { invite, token }
  }

  /**
   * Resolves a raw token to a still-valid (not accepted, not expired) invite.
   */
  static async verify(token: string) {
    const invite = await Invite.query().where('token_hash', hashToken(token)).first()

    if (!invite || invite.acceptedAt || invite.expiresAt < DateTime.now()) {
      return null
    }

    return invite
  }
}
