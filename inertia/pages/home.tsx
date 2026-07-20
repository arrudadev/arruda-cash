import { Link } from '@adonisjs/inertia/react'
import { Button } from '~/components/ui/button'
import { Card, CardDescription, CardTitle } from '~/components/ui/card'

export default function Home() {
  return (
    <>
      <div className="max-w-2xl py-24">
        <h1 className="mb-4 text-5xl font-semibold tracking-tight text-balance">
          It works — welcome to the power of a full-stack React app
        </h1>
        <p className="text-xl text-muted-foreground">
          Powered by Inertia and React, this setup blends server-driven routing with rich
          client-side interactivity — seamless, fast, and cohesive.
        </p>
        <Button asChild className="mt-8">
          <Link route="session.create">Login</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 border-t py-10 sm:grid-cols-3">
        <a href="https://docs.adonisjs.com/introduction" target="_blank" rel="noreferrer">
          <Card className="h-full transition-colors hover:bg-accent">
            <CardTitle className="px-6">Official Docs &nbsp;›</CardTitle>
            <CardDescription className="px-6">
              Comprehensive reference for building with AdonisJS
            </CardDescription>
          </Card>
        </a>

        <a href="https://adocasts.com/" target="_blank" rel="noreferrer">
          <Card className="h-full transition-colors hover:bg-accent">
            <CardTitle className="px-6">Adocasts &nbsp;›</CardTitle>
            <CardDescription className="px-6">
              Guided video tutorials for everyday development
            </CardDescription>
          </Card>
        </a>

        <a href="https://discord.gg/vDcEjq6" target="_blank" rel="noreferrer">
          <Card className="h-full transition-colors hover:bg-accent">
            <CardTitle className="px-6">Discord &nbsp;›</CardTitle>
            <CardDescription className="px-6">
              Connect with developers building with AdonisJS every day
            </CardDescription>
          </Card>
        </a>
      </div>
    </>
  )
}
