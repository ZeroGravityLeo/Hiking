interface PageHeaderProps {
  eyebrow: string
  title: string
  description: string
}

export function PageHeader({ eyebrow, title, description }: PageHeaderProps) {
  return (
    <section className="flex flex-col gap-2">
      <p className="text-xs font-semibold uppercase text-muted-foreground">{eyebrow}</p>
      <h1 className="text-3xl font-bold leading-tight tracking-normal text-foreground">{title}</h1>
      <p className="max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
    </section>
  )
}
