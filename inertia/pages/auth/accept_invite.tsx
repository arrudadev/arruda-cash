import { Form } from '@adonisjs/inertia/react'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'

type Props = {
  invalid: boolean
  token?: string
  email?: string
}

export default function AcceptInvite(props: Props) {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
      <Card className="w-full max-w-sm">
        {props.invalid ? (
          <CardHeader>
            <CardTitle className="text-2xl">Invite not found</CardTitle>
            <CardDescription>
              This invite link is invalid, expired, or has already been used. Ask whoever invited
              you to send a new one.
            </CardDescription>
          </CardHeader>
        ) : (
          <>
            <CardHeader>
              <CardTitle className="text-2xl">Welcome</CardTitle>
              <CardDescription>
                Set a password for <span className="font-medium">{props.email}</span> to activate
                your account.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form route="invite.store">
                {({ errors }) => (
                  <div className="flex flex-col gap-6">
                    <input type="hidden" name="token" value={props.token} />

                    <div className="grid gap-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        type="password"
                        name="password"
                        id="password"
                        autoComplete="new-password"
                        aria-invalid={errors.password ? true : undefined}
                      />
                      {errors.password && (
                        <p className="text-sm text-destructive">{errors.password}</p>
                      )}
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="passwordConfirmation">Confirm password</Label>
                      <Input
                        type="password"
                        name="passwordConfirmation"
                        id="passwordConfirmation"
                        autoComplete="new-password"
                        aria-invalid={errors.passwordConfirmation ? true : undefined}
                      />
                      {errors.passwordConfirmation && (
                        <p className="text-sm text-destructive">{errors.passwordConfirmation}</p>
                      )}
                    </div>

                    <Button type="submit" className="w-full">
                      Activate account
                    </Button>
                  </div>
                )}
              </Form>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  )
}
