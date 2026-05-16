import { Link } from 'react-router-dom'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

const sections = [
  {
    title: 'Data we collect',
    copy:
      'Account details, profile settings, GPS activity data, trail reviews, wildlife collection progress, photos you upload, purchases when enabled, and support messages you send.',
  },
  {
    title: 'Location data',
    copy:
      'GPS tracking starts only after explicit consent. Location data powers distance, safety, activity history, leaderboards, rewards, and route features.',
  },
  {
    title: 'Cookies and local storage',
    copy:
      'Essential preferences are stored locally. Analytics cookies are optional and only enabled when accepted through the consent banner.',
  },
  {
    title: 'Sharing and public content',
    copy:
      'Trail photos, reviews, leaderboards, and selected profile details may be public. Private account data is not sold.',
  },
  {
    title: 'Retention and deletion',
    copy:
      'You can export user-owned data and request account deletion from Settings. Deletion removes application data first, then the auth account when admin deletion is available.',
  },
  {
    title: 'Contact',
    copy:
      'For launch, privacy requests should be routed to the Wild Alberta operator email configured by the production team.',
  },
] as const

export function PrivacyPolicyPage() {
  return (
    <main className="wa-page">
      <section className="flex flex-col gap-2">
        <p className="text-sm font-medium text-muted-foreground">Legal</p>
        <h1 className="text-3xl font-bold tracking-normal">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground">
          Draft launch policy for Wild Alberta. Last updated April 28, 2026.
        </p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Privacy at a glance</CardTitle>
          <CardDescription>
            Wild Alberta is built around outdoor safety, family use, and transparent data controls.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {sections.map((section) => (
            <article className="flex flex-col gap-1" key={section.title}>
              <h2 className="text-base font-semibold">{section.title}</h2>
              <p className="text-sm text-muted-foreground">{section.copy}</p>
            </article>
          ))}
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">
        Account controls are available in <Link to="/settings">Settings</Link>. This draft should be
        reviewed by qualified legal counsel before production launch.
      </p>
    </main>
  )
}
