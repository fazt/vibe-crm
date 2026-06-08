import { LogoMark } from '@/components/brand/logo-mark';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <div className="relative hidden w-[42%] flex-col justify-between overflow-hidden border-r studio-divider bg-stone-950/50 p-10 lg:flex">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,hsl(32_70%_35%/0.18),transparent_55%)]" />
        <div className="relative space-y-6">
          <LogoMark size="lg" />
          <div className="space-y-3">
            <h2 className="text-2xl font-semibold tracking-tight text-amber-50/95">
              Your pipeline,
              <br />
              on the desk.
            </h2>
            <p className="max-w-xs text-[13px] leading-relaxed text-muted-foreground">
              Track clients, deals, and follow-ups between calls — without the cold corporate feel.
            </p>
          </div>
        </div>
        <p className="relative studio-label">Freelancers & small agencies</p>
      </div>
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
