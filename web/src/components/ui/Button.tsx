import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const variantesBoton = cva(
  'inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variante: {
        primario: 'bg-[var(--color-primario)] text-white hover:opacity-90',
        contorno: 'border border-[var(--color-borde)] bg-[var(--color-superficie)] hover:bg-[var(--color-fondo)]',
      },
      tamano: {
        normal: 'h-9 px-4',
        pequeno: 'h-8 px-3 text-xs',
      },
    },
    defaultVariants: { variante: 'primario', tamano: 'normal' },
  },
);

export interface BotonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof variantesBoton> {}

export const Button = forwardRef<HTMLButtonElement, BotonProps>(
  ({ className, variante, tamano, ...props }, ref) => (
    <button ref={ref} className={cn(variantesBoton({ variante, tamano }), className)} {...props} />
  ),
);
Button.displayName = 'Button';
