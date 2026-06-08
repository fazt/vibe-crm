import { cn } from '@/lib/utils';

interface LogoMarkProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = {
  sm: 'h-6 w-6 text-[10px] rounded-md',
  md: 'h-9 w-9 text-sm rounded-lg',
  lg: 'h-12 w-12 text-lg rounded-xl',
};

export function LogoMark({ size = 'sm', className }: LogoMarkProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-center bg-gradient-to-br from-amber-400 to-amber-700 font-bold text-stone-950 shadow-[0_0_20px_hsl(32_82%_52%/0.25)]',
        sizeMap[size],
        className,
      )}
    >
      V
    </div>
  );
}
