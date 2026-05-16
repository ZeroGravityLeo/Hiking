import { Link } from 'react-router-dom'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

const terms = [
  {
    title: 'Outdoor risk',
    copy:
      'Hiking involves real risk. Wild Alberta helps plan and record activities, but it does not replace official trail notices, weather warnings, emergency services, or a satellite communicator.',
  },
  {
    title: 'Wildlife safety',
    copy:
      'Educational wildlife content is informational. Follow Parks Canada, Alberta Parks, local authorities, and posted guidance around animals and restricted areas.',
  },
  {
    title: 'User content',
    copy:
      'You are responsible for photos, reviews, comments, gear reviews, and activity details you publish. Do not upload illegal, unsafe, harassing, or misleading content.',
  },
  {
    title: 'Accounts and kids mode',
    copy:
      'Parents or guardians are responsible for children using the app. Family and kids mode should be configured by an adult account holder.',
  },
  {
    title: 'Rewards and purchases',
    copy:
      'Coins, local rewards, and paid products may have separate redemption rules. Stripe payments and premium features will be governed by the terms shown at checkout.',
  },
  {
    title: 'Account termination',
    copy:
      'Accounts may be suspended for abuse, fraud, unsafe behavior, or policy violations. Users can request account deletion from Settings.',
  },
] as const

export function TermsPage() {
  return (
    <main className="wa-page">
      <section className="flex flex-col gap-2">
        <p className="text-sm font-medium text-muted-foreground">Legal</p>
        <h1 className="text-3xl font-bold tracking-normal">Terms of Service</h1>
        <p className="text-sm text-muted-foreground">
          Draft launch terms for Wild Alberta. Last updated April 28, 2026.
        </p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Terms summary</CardTitle>
          <CardDescription>
            These terms should be reviewed by counsel before accepting production users.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {terms.map((term) => (
            <article className="flex flex-col gap-1" key={term.title}>
              <h2 className="text-base font-semibold">{term.title}</h2>
              <p className="text-sm text-muted-foreground">{term.copy}</p>
            </article>
          ))}
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">
        See the <Link to="/privacy">Privacy Policy</Link> for data handling and deletion details.
      </p>
    </main>
  )
}
