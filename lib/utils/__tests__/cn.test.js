// lib/utils/__tests__/cn.test.js
import { cn } from '../cn';

describe('cn() utility', () => {
  describe('basic functionality', () => {
    it('merges string classes', () => {
      expect(cn('px-4', 'py-2')).toBe('px-4 py-2');
    });

    it('handles undefined and null', () => {
      expect(cn('px-4', undefined, null, 'py-2')).toBe('px-4 py-2');
    });

    it('handles empty strings', () => {
      expect(cn('px-4', '', 'py-2')).toBe('px-4 py-2');
    });
  });

  describe('conditional classes (clsx)', () => {
    it('includes truthy conditional classes', () => {
      expect(cn('base', true && 'active')).toBe('base active');
    });

    it('excludes falsy conditional classes', () => {
      expect(cn('base', false && 'hidden')).toBe('base');
    });

    it('handles object syntax', () => {
      expect(cn('base', { active: true, disabled: false })).toBe('base active');
    });

    it('handles array syntax', () => {
      expect(cn('base', ['flex', 'items-center'])).toBe('base flex items-center');
    });
  });

  describe('Tailwind conflict resolution (tailwind-merge)', () => {
    it('resolves padding conflicts (later wins)', () => {
      expect(cn('px-4', 'px-6')).toBe('px-6');
    });

    it('resolves background color conflicts', () => {
      expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500');
    });

    it('resolves text color conflicts', () => {
      expect(cn('text-slate-200', 'text-white')).toBe('text-white');
    });

    it('keeps non-conflicting classes', () => {
      expect(cn('px-4 py-2', 'px-6')).toBe('py-2 px-6');
    });

    it('resolves complex variant conflicts', () => {
      // Base class + override from className prop (common CVA pattern)
      expect(cn('px-4 py-2 bg-ember-500', 'bg-slate-900')).toBe('px-4 py-2 bg-slate-900');
    });
  });

  describe('real-world usage patterns', () => {
    it('handles CVA + className pattern', () => {
      const cvaOutput = 'font-semibold px-4 py-2 bg-ember-500 text-white';
      const className = 'mt-4 bg-slate-900';
      expect(cn(cvaOutput, className)).toBe('font-semibold px-4 py-2 text-white mt-4 bg-slate-900');
    });

    it('handles conditional with className override', () => {
      const isActive = true;
      const className = 'text-lg';
      expect(cn(
        'text-sm',
        isActive && 'font-bold',
        className
      )).toBe('font-bold text-lg');
    });
  });
});
