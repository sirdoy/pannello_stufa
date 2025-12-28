/**
 * Grid Component
 *
 * Responsive grid system with configurable columns per breakpoint and gap spacing.
 * Gap increases automatically on larger screens for better spacing.
 *
 * @example
 * <Grid cols={{ mobile: 1, desktop: 2 }} gap="large">
 *   {items.map(item => <div key={item.id}>{item}</div>)}
 * </Grid>
 */
export default function Grid({
  cols = { mobile: 1, tablet: 2, desktop: 3, wide: 4 },
  gap = 'medium',
  children,
  className = ''
}) {
  // Responsive gap mapping: mobile → tablet → desktop → wide
  const gapClasses = {
    small: 'gap-3 md:gap-4 lg:gap-5',           // 12px → 16px → 20px
    medium: 'gap-4 md:gap-5 lg:gap-6',          // 16px → 20px → 24px
    large: 'gap-6 md:gap-8 lg:gap-12',          // 24px → 32px → 48px
  };

  // Responsive column classes
  const colClasses = `
    grid-cols-${cols.mobile || 1}
    md:grid-cols-${cols.tablet || 2}
    lg:grid-cols-${cols.desktop || 3}
    xl:grid-cols-${cols.wide || 4}
  `.trim().replace(/\s+/g, ' ');

  return (
    <div className={`grid ${gapClasses[gap]} ${colClasses} ${className}`.trim()}>
      {children}
    </div>
  );
}
