/**
 * Phase 180 — Plan 05 Task 3: ConditionsSection.tsx tests
 *
 * Tests: intro copy, ConditionGroup rendering at depth 0, empty/populated states.
 */
import { render, screen } from '@testing-library/react';
import React from 'react';
import { ConditionsSection } from '../../sections/ConditionsSection';
import type { UIConditionGroup } from '../../types';

describe('ConditionsSection', () => {
  const emptyGroup: UIConditionGroup = { kind: 'group', op: 'AND', items: [] };

  it('renders the intro copy verbatim', () => {
    render(<ConditionsSection group={emptyGroup} onChange={jest.fn()} />);
    expect(
      screen.getByText(
        /Le condizioni devono essere soddisfatte affinché le azioni vengano eseguite/
      )
    ).toBeInTheDocument();
  });

  it('renders "Puoi combinarle con E/O e annidare gruppi" part of the intro copy', () => {
    render(<ConditionsSection group={emptyGroup} onChange={jest.fn()} />);
    expect(screen.getByText(/Puoi combinarle con E\/O e annidare gruppi/)).toBeInTheDocument();
  });

  it('renders ConditionGroup at depth 0 — shows "vuoto" for empty group', () => {
    render(<ConditionsSection group={emptyGroup} onChange={jest.fn()} />);
    expect(screen.getByText('vuoto')).toBeInTheDocument();
  });

  it('renders TUTTE (E) toggle for AND root group', () => {
    render(<ConditionsSection group={emptyGroup} onChange={jest.fn()} />);
    expect(screen.getByText('TUTTE (E)')).toBeInTheDocument();
  });

  it('renders the item count for a populated group', () => {
    const populatedGroup: UIConditionGroup = {
      kind: 'group',
      op: 'AND',
      items: [
        { kind: 'cond', type: 'always_true' },
        { kind: 'cond', type: 'always_true' },
      ],
    };
    render(<ConditionsSection group={populatedGroup} onChange={jest.fn()} />);
    expect(screen.getByText('2 elementi')).toBeInTheDocument();
  });

  it('renders "+ Condizione" and "+ Gruppo O" at depth 0', () => {
    render(<ConditionsSection group={emptyGroup} onChange={jest.fn()} />);
    expect(screen.getByText('+ Condizione')).toBeInTheDocument();
    expect(screen.getByText('+ Gruppo O')).toBeInTheDocument();
  });
});
