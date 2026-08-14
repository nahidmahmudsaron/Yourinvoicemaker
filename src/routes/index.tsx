import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, FileText, Palette, Share2, Sparkles, Users } from "lucide-react";

import { Logo } from "@/components/AppShell";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "InvoicePro — Professional invoices in minutes" },
      {
        name: "description",
        content:
          "Create, send and track beautiful invoices. Four templates, custom accent colors, PDF download, share links and customer management.",
      },
      { property: "og:title", content: "InvoicePro — Professional invoices in minutes" },
      {
        property: "og:description",
        content: "Create, send and track beautiful invoices with templates, PDF download and share links.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  { icon: FileText, title: "4 polished templates", body: "Modern, classic, minimal and bold layouts, ready to send." },
  { icon: Palette, title: "Your brand colors", body: "Pick any accent color and add your logo in seconds." },
  { icon: Share2, title: "Share & download", body: "Public share links, one-click print and PDF download." },
  { icon: Users, title: "Customers & profile", body: "Reusable customer records and saved business defaults." },
  { icon: CheckCircle2, title: "Status tracking", body: "Draft, pending, paid and overdue at a glance." },
  { icon: Sparkles, title: "Instant preview", body: "See every change live as you build the invoice." },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Logo />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button asChild size="sm" variant="outline">
              <Link to="/auth">Sign in</Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/auth">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6 lg:py-24">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1 text-xs font-semibold text-muted-foreground">
            <Sparkles className="size-3.5" /> Invoicing made effortless
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
            Professional invoices, <span className="text-primary">ready in minutes</span>
          </h1>
          <p className="mx-auto mt-3 inline-flex items-center gap-2 rounded-full border border-border/60 bg-secondary/60 px-3 py-1 text-xs font-medium text-muted-foreground">
            <span className="inline-block size-1.5 rounded-full bg-primary" /> Created with care by Nahid Mahmud Saron
          </p>
          <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
            InvoicePro gives freelancers and small teams beautiful branded invoices, live previews, PDF downloads and
            shareable payment links — all in one clean workspace.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg">
              <Link to="/auth">Create your first invoice</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/auth">I already have an account</Link>
            </Button>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
          <h2 className="text-center text-2xl font-bold tracking-tight">Everything you need to get paid</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <article key={feature.title} className="surface-card p-6">
                <span className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
                  <feature.icon className="size-5" />
                </span>
                <h3 className="mt-4 text-base font-bold">{feature.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{feature.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="border-t border-border bg-secondary/40">
          <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Start invoicing today</h2>
            <p className="mt-3 text-sm text-muted-foreground sm:text-base">
              Free to set up. Your business profile and customers are saved for every future invoice.
            </p>
            <Button asChild size="lg" className="mt-6">
              <Link to="/auth">Get started free</Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:px-6">
          <Logo />
          <div className="flex flex-col items-center gap-1 sm:flex-row sm:gap-3">
            <p>© {new Date().getFullYear()} InvoicePro. All rights reserved.</p>
            <span className="hidden sm:inline">•</span>
            <p>Created by Nahid Mahmud Saron</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
