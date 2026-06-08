export function WinRateRing({ rate }: { rate: number }) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (rate / 100) * circumference;

  return (
    <div className="relative flex h-[88px] w-[88px] items-center justify-center">
      <svg className="-rotate-90" width="88" height="88" viewBox="0 0 88 88">
        <circle
          cx="44"
          cy="44"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          className="text-amber-950/50"
        />
        <circle
          cx="44"
          cy="44"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="text-emerald-500/75 transition-all duration-500"
        />
      </svg>
      <span className="absolute font-mono text-lg font-semibold tabular-nums tracking-tight text-amber-50/95">
        {rate}%
      </span>
    </div>
  );
}
