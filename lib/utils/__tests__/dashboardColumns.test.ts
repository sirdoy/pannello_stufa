import { splitIntoColumns } from '../dashboardColumns';

describe('splitIntoColumns', () => {
  // Helper to create card array
  const makeCards = (n: number) =>
    Array.from({ length: n }, (_, i) => ({ id: `card-${i}` }));

  describe('0 cards', () => {
    it('returns both columns empty', () => {
      const { left, right } = splitIntoColumns([]);
      expect(left).toHaveLength(0);
      expect(right).toHaveLength(0);
    });
  });

  describe('1 card (EDGE-01 precondition)', () => {
    it('places the single card in left, right is empty', () => {
      const { left, right } = splitIntoColumns(makeCards(1));
      expect(left).toHaveLength(1);
      expect(right).toHaveLength(0);
      expect(left[0]!.flatIndex).toBe(0);
      expect(left[0]!.card).toEqual({ id: 'card-0' });
    });
  });

  describe('2 cards', () => {
    it('splits evenly: left=[0], right=[1]', () => {
      const { left, right } = splitIntoColumns(makeCards(2));
      expect(left).toHaveLength(1);
      expect(right).toHaveLength(1);
      expect(left[0]!.flatIndex).toBe(0);
      expect(right[0]!.flatIndex).toBe(1);
    });
  });

  describe('3 cards (EDGE-02 odd)', () => {
    it('left has one more than right: left=[0,2], right=[1]', () => {
      const { left, right } = splitIntoColumns(makeCards(3));
      expect(left).toHaveLength(2);
      expect(right).toHaveLength(1);
      expect(left.length).toBe(right.length + 1);
      expect(left.map(e => e.flatIndex)).toEqual([0, 2]);
      expect(right.map(e => e.flatIndex)).toEqual([1]);
    });
  });

  describe('5 cards (EDGE-02 odd)', () => {
    it('left=[0,2,4], right=[1,3]', () => {
      const { left, right } = splitIntoColumns(makeCards(5));
      expect(left).toHaveLength(3);
      expect(right).toHaveLength(2);
      expect(left.length).toBe(right.length + 1);
      expect(left.map(e => e.flatIndex)).toEqual([0, 2, 4]);
      expect(right.map(e => e.flatIndex)).toEqual([1, 3]);
    });
  });

  describe('6 cards (even)', () => {
    it('equal columns: left=[0,2,4], right=[1,3,5]', () => {
      const { left, right } = splitIntoColumns(makeCards(6));
      expect(left).toHaveLength(3);
      expect(right).toHaveLength(3);
      expect(left.length).toBe(right.length);
      expect(left.map(e => e.flatIndex)).toEqual([0, 2, 4]);
      expect(right.map(e => e.flatIndex)).toEqual([1, 3, 5]);
    });
  });

  describe('card content preservation', () => {
    it('preserves original card objects in entries', () => {
      const cards = [{ id: 'stove', extra: 42 }, { id: 'thermostat', extra: 99 }];
      const { left, right } = splitIntoColumns(cards);
      expect(left[0]!.card).toBe(cards[0]);
      expect(right[0]!.card).toBe(cards[1]);
    });
  });
});
