/**
 * Splits an array of cards into left/right columns by index parity.
 * Even-indexed items go left, odd-indexed items go right.
 * Each entry includes the original flatIndex for animation stagger delay.
 */
export function splitIntoColumns<T>(
  cards: T[]
): { left: Array<{ card: T; flatIndex: number }>; right: Array<{ card: T; flatIndex: number }> } {
  const left: Array<{ card: T; flatIndex: number }> = [];
  const right: Array<{ card: T; flatIndex: number }> = [];
  cards.forEach((card, i) => {
    if (i % 2 === 0) left.push({ card, flatIndex: i });
    else right.push({ card, flatIndex: i });
  });
  return { left, right };
}
