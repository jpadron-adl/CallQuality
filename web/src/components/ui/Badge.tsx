import type { HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const variantesBadge = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
  {
    variants: {
      tono: {
        neutro: 'bg-[var(--color-fondo)] text-[var(--color-tenue)] border border-[var(--color-borde)]',
        exito: 'bg-[var(--color-exito)]/15 text-[var(--color-exito)]',
        aviso: 'bg-[var(--color-aviso)]/20 text-[var(--color-aviso)]',
        peligro: 'bg-[var(--color-peligro)]/15 text-[var(--color-peligro)]',
      },
    },
    defaultVariants: { tono: 'neutro' },
  },
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof variantesBadge> {}

export function Badge({ className, tono, ...props }: BadgeProps): React.JSX.Element {
  return <span className={cn(variantesBadge({ tono }), className)} {...props} />;
}
