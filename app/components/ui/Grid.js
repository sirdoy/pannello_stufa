import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

/**
 * Grid Variants - CVA Configuration
 *
 * Cols: 1-6 with predefined responsive breakpoints
 * Gap: none, sm, md, lg - consistent gap spacing
 */
export const gridVariants = cva(
  'grid',
  {
    variants: {
      gap: {
        none: 'gap-0',
        sm: 'gap-3 sm:gap-4',
        md: 'gap-4 sm:gap-5 lg:gap-6',
        lg: 'gap-6 sm:gap-8 lg:gap-10',
      },
      cols: {
        1: 'grid-cols-1',
        2: 'grid-cols-1 sm:grid-cols-2',
        3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
        4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
        5: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5',
        6: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6',
      },
    },
    defaultVariants: {
      gap: 'md',
      cols: 3,
    },
  }
);

/**
 * Grid Component - Responsive grid system
 *
 * Simplified API with predefined responsive column patterns.
 * Use cols prop for auto-responsive, or pass custom className for full control.
 *
 * @example
 * // Simple: auto-responsive 3 columns
 * <Grid cols={3}>{items}</Grid>
 *
 * // Custom: manual breakpoint control
 * <Grid className="grid-cols-1 md:grid-cols-2 xl:grid-cols-4">{items}</Grid>
 */
export default function Grid({
  cols = 3,
  gap = 'md',
  children,
  className = '',
  as: Component = 'div',
  ...props
}) {
  return (
    <Component className={cn(gridVariants({ cols, gap }), className)} {...props}>
      {children}
    </Component>
  );
}

export { Grid };
