import Link from 'next/link';
import {
  ArrowRight,
  BarChart3,
  Building2,
  Kanban,
  Layers,
  Sparkles,
  Users,
  Zap,
} from 'lucide-react';

const features = [
  {
    icon: Kanban,
    title: 'Pipeline that breathes',
    description:
      'Drag opportunities across stages. See value, velocity, and stale deals — without spreadsheet archaeology.',
  },
  {
    icon: Users,
    title: 'Clients & contacts, linked',
    description:
      'Companies, people, and history in one thread. Context travels with every conversation.',
  },
  {
    icon: Zap,
    title: 'Tasks that stick',
    description:
      'Due dates, reminders, and overdue digests. Nothing slips when the week gets loud.',
  },
  {
    icon: Layers,
    title: 'Multi-tenant workspaces',
    description:
      'Separate brands, separate pipelines. Switch workspaces in one click — no tab chaos.',
  },
  {
    icon: BarChart3,
    title: 'Metrics that matter',
    description:
      'Win rate, pipeline value, activity pulse. Numbers for decisions, not decoration.',
  },
  {
    icon: Building2,
    title: 'Built for service teams',
    description:
      'Agencies, studios, consultants. The CRM shape that matches how you actually work.',
  },
];

const pipelineStages = [
  { name: 'Lead', count: 12, value: '$48k' },
  { name: 'Qualified', count: 8, value: '$92k' },
  { name: 'Proposal', count: 5, value: '$156k' },
  { name: 'Won', count: 3, value: '$74k' },
];

export default function LandingPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden px-6 pb-24 pt-16 md:pb-32 md:pt-24">
        <div className="mkt-flow-grid pointer-events-none absolute inset-0 opacity-60" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-16 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="mkt-label mkt-animate-rise mb-6 flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-[#ff5c38]" />
              CRM for teams that move
            </p>
            <h1 className="mkt-display mkt-animate-rise mkt-animate-rise-delay-1 text-[2.75rem] font-semibold leading-[1.05] tracking-tight text-[#f4f0e8] md:text-[3.75rem]">
              Relationships at the{' '}
              <span className="italic text-[#ff5c38]">speed of work</span>
            </h1>
            <p className="mkt-animate-rise mkt-animate-rise-delay-2 mt-6 max-w-lg text-base leading-relaxed text-[#8b8f9a] md:text-lg">
              Pipeline, clients, tasks, and activity — one workspace that stays out of your way. No enterprise bloat.
              Just the rhythm of closing deals.
            </p>
            <div className="mkt-animate-rise mkt-animate-rise-delay-3 mt-10 flex flex-wrap items-center gap-4">
              <Link href="/register" className="mkt-btn-primary">
                Start free
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/pricing" className="mkt-btn-ghost">
                View pricing
              </Link>
            </div>
            <p className="mkt-animate-rise mkt-animate-rise-delay-4 mt-6 text-xs text-[#8b8f9a]">
              Free for solo · No credit card · Setup in 2 minutes
            </p>
          </div>

          {/* Hero visual — pipeline preview */}
          <div className="mkt-animate-rise mkt-animate-rise-delay-2 mkt-float relative">
            <div className="absolute -inset-4 rounded-3xl bg-[#ff5c38]/8 blur-3xl" />
            <div className="mkt-card relative overflow-hidden p-6">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="mkt-label">Pipeline</p>
                  <p className="mkt-display mt-1 text-2xl font-semibold text-[#f4f0e8]">$370k</p>
                </div>
                <div className="rounded-full bg-[#ff5c3820] px-3 py-1 text-xs font-medium text-[#ff5c38]">
                  +18% this month
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {pipelineStages.map((stage, i) => (
                  <div
                    key={stage.name}
                    className="rounded-lg border border-white/6 bg-[#0c0e14] p-3"
                    style={{ marginTop: i % 2 === 0 ? 0 : 12 }}
                  >
                    <p className="text-[10px] font-medium uppercase tracking-wider text-[#8b8f9a]">{stage.name}</p>
                    <p className="mt-2 font-mono text-lg font-semibold tabular-nums text-[#f4f0e8]">{stage.count}</p>
                    <p className="font-mono text-xs tabular-nums text-[#ff5c38]">{stage.value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 h-px w-full bg-gradient-to-r from-transparent via-[#ff5c38]/40 to-transparent" />
              <div className="mt-4 flex items-center gap-3">
                <div className="flex -space-x-2">
                  {['AC', 'MR', 'JL'].map((initials) => (
                    <div
                      key={initials}
                      className="flex h-7 w-7 items-center justify-center rounded-full border border-[#08090d] bg-[#161820] text-[10px] font-medium text-[#8b8f9a]"
                    >
                      {initials}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-[#8b8f9a]">3 team members active now</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social proof strip */}
      <section className="border-y border-white/6 bg-[#0c0e14]/50 px-6 py-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-12 gap-y-4">
          {['Studios', 'Agencies', 'Consultants', 'Freelancers'].map((segment) => (
            <p key={segment} className="mkt-label">
              Trusted by {segment}
            </p>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-6 py-24 md:py-32">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <p className="mkt-label mb-4">Everything connected</p>
            <h2 className="mkt-display text-3xl font-semibold tracking-tight text-[#f4f0e8] md:text-4xl">
              One desk for the whole client journey
            </h2>
            <p className="mt-4 text-[#8b8f9a]">
              From first lead to signed contract — Vibe keeps context, tasks, and pipeline in sync so your team never
              asks &ldquo;where were we?&rdquo;
            </p>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.title} className="mkt-card group p-6">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg border border-[#ff5c3825] bg-[#ff5c3810] text-[#ff5c38] transition-colors group-hover:bg-[#ff5c3820]">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-[#f4f0e8]">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#8b8f9a]">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-white/6 px-6 py-24 md:py-32">
        <div className="mx-auto max-w-6xl">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            <div>
              <p className="mkt-label mb-4">How it flows</p>
              <h2 className="mkt-display text-3xl font-semibold tracking-tight text-[#f4f0e8] md:text-4xl">
                See the whole picture, act on one thing
              </h2>
              <ul className="mt-8 space-y-6">
                {[
                  'Capture leads and link them to companies instantly',
                  'Move deals through your custom pipeline stages',
                  'Assign tasks with due dates — get reminded before they slip',
                  'Log calls, emails, and notes against any record',
                ].map((step, i) => (
                  <li key={step} className="flex gap-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#ff5c3820] font-mono text-xs font-semibold text-[#ff5c38]">
                      {i + 1}
                    </span>
                    <p className="text-sm leading-relaxed text-[#8b8f9a]">{step}</p>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mkt-card p-6">
              <div className="space-y-3">
                {[
                  { label: 'New lead — Acme Studio', time: '2m ago', type: 'activity' },
                  { label: 'Proposal sent — $24k', time: '1h ago', type: 'deal' },
                  { label: 'Follow-up task due tomorrow', time: 'Today', type: 'task' },
                  { label: 'Win rate up 12% this quarter', time: 'Insight', type: 'metric' },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between rounded-lg border border-white/6 bg-[#0c0e14] px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-2 w-2 rounded-full ${
                          item.type === 'deal'
                            ? 'bg-[#ff5c38]'
                            : item.type === 'task'
                              ? 'bg-amber-400'
                              : item.type === 'metric'
                                ? 'bg-emerald-400'
                                : 'bg-[#8b8f9a]'
                        }`}
                      />
                      <span className="text-sm text-[#f4f0e8]">{item.label}</span>
                    </div>
                    <span className="text-xs text-[#8b8f9a]">{item.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="relative overflow-hidden rounded-2xl border border-[#ff5c3830] bg-gradient-to-br from-[#12141c] to-[#0c0e14] px-8 py-16 text-center md:px-16">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,#ff5c3815,transparent_70%)]" />
            <p className="mkt-label relative mb-4">Ready when you are</p>
            <h2 className="mkt-display relative text-3xl font-semibold tracking-tight text-[#f4f0e8] md:text-4xl">
              Start closing with clarity
            </h2>
            <p className="relative mx-auto mt-4 max-w-md text-[#8b8f9a]">
              Join teams who replaced scattered spreadsheets with one calm workspace.
            </p>
            <div className="relative mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link href="/register" className="mkt-btn-primary">
                Create free workspace
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/contact" className="mkt-btn-ghost">
                Talk to us
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
