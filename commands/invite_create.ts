import { args, BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'

export default class InviteCreate extends BaseCommand {
  static commandName = 'invite:create'
  static description = 'Invite someone to create an account by emailing them a signup link'

  static options: CommandOptions = {
    startApp: true,
  }

  @args.string({ description: 'Email address to invite' })
  declare email: string

  @args.string({ description: 'Full name of the invitee', required: false })
  declare fullName?: string

  async run() {
    const vine = (await import('@vinejs/vine')).default
    const { default: User } = await import('#models/user')
    const { default: Invite } = await import('#models/invite')
    const mail = (await import('@adonisjs/mail/services/main')).default
    const env = (await import('#start/env')).default

    const email = await vine
      .compile(vine.string().trim().email().maxLength(254))
      .validate(this.email)
      .catch(() => null)

    if (!email) {
      this.logger.error(`"${this.email}" is not a valid email address.`)
      this.exitCode = 1
      return
    }

    const existingUser = await User.findBy('email', email)
    if (existingUser) {
      this.logger.error(`A user with email "${email}" already exists.`)
      this.exitCode = 1
      return
    }

    // Replace any still-pending invite for this email so only the latest link works.
    await Invite.query().where('email', email).whereNull('accepted_at').delete()

    const { token } = await Invite.issue(email, this.fullName)
    const acceptUrl = `${env.get('APP_URL')}/invite/accept?token=${token}`

    await mail.send((message) => {
      message
        .to(email)
        .subject("You've been invited")
        .htmlView('emails/invite', { acceptUrl, fullName: this.fullName })
    })

    this.logger.success(`Invite created for ${email}`)
    this.logger.info(`Accept link: ${acceptUrl}`)
  }
}
