/**
 * Phase 180 — Plan 05 Task 3: ConditionGroup.tsx tests
 *
 * Tests: operator toggle, addCondition, addGroup, depth-2 cap (D-11),
 *        item separators, nested group recursion.
 */
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { ConditionGroup } from '../ConditionGroup';
import type { UIConditionGroup } from '../types';

// ─── Empty group ─────────────────────────────────────────────────────────────

describe('ConditionGroup — empty group', () => {
  const emptyGroup: UIConditionGroup = { kind: 'group', op: 'AND', items: [] };

  it('renders "vuoto" counter when 0 items', () => {
    render(<ConditionGroup group={emptyGroup} depth={0} onChange={jest.fn()} />);
    expect(screen.getByText('vuoto')).toBeInTheDocument();
  });

  it('renders TUTTE (E) label for AND operator', () => {
    render(<ConditionGroup group={emptyGroup} depth={0} onChange={jest.fn()} />);
    expect(screen.getByText('TUTTE (E)')).toBeInTheDocument();
  });

  it('renders ALMENO UNA (O) label for OR operator', () => {
    const orGroup: UIConditionGroup = { kind: 'group', op: 'OR', items: [] };
    render(<ConditionGroup group={orGroup} depth={0} onChange={jest.fn()} />);
    expect(screen.getByText('ALMENO UNA (O)')).toBeInTheDocument();
  });

  it('renders "+ Condizione" button', () => {
    render(<ConditionGroup group={emptyGroup} depth={0} onChange={jest.fn()} />);
    expect(screen.getByText('+ Condizione')).toBeInTheDocument();
  });

  it('renders "+ Gruppo O" button at depth 0 with AND group (depth < 2, D-11)', () => {
    render(<ConditionGroup group={emptyGroup} depth={0} onChange={jest.fn()} />);
    // AND context → "+ Gruppo O"
    expect(screen.getByText('+ Gruppo O')).toBeInTheDocument();
  });

  it('renders "+ Gruppo E" button at depth 0 with OR group', () => {
    const orGroup: UIConditionGroup = { kind: 'group', op: 'OR', items: [] };
    render(<ConditionGroup group={orGroup} depth={0} onChange={jest.fn()} />);
    // OR context → "+ Gruppo E"
    expect(screen.getByText('+ Gruppo E')).toBeInTheDocument();
  });
});

// ─── Operator toggle ─────────────────────────────────────────────────────────

describe('ConditionGroup — operator toggle', () => {
  it('clicking AND toggle calls onChange with op flipped to OR', () => {
    const onChange = jest.fn();
    const andGroup: UIConditionGroup = { kind: 'group', op: 'AND', items: [] };
    render(<ConditionGroup group={andGroup} depth={0} onChange={onChange} />);
    fireEvent.click(screen.getByText('TUTTE (E)'));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ op: 'OR' }));
  });

  it('clicking OR toggle calls onChange with op flipped to AND', () => {
    const onChange = jest.fn();
    const orGroup: UIConditionGroup = { kind: 'group', op: 'OR', items: [] };
    render(<ConditionGroup group={orGroup} depth={0} onChange={onChange} />);
    fireEvent.click(screen.getByText('ALMENO UNA (O)'));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ op: 'AND' }));
  });
});

// ─── addCondition ─────────────────────────────────────────────────────────────

describe('ConditionGroup — addCondition', () => {
  it('clicking "+ Condizione" appends a time_window leaf to items', () => {
    const onChange = jest.fn();
    const group: UIConditionGroup = { kind: 'group', op: 'AND', items: [] };
    render(<ConditionGroup group={group} depth={0} onChange={onChange} />);
    fireEvent.click(screen.getByText('+ Condizione'));
    const call = onChange.mock.calls[0]?.[0] as UIConditionGroup;
    expect(call.items).toHaveLength(1);
    expect(call.items[0]).toMatchObject({ kind: 'cond', type: 'time_window' });
  });

  // WR-03 (REVIEW iteration 2): each newly-added leaf carries a stable
  // __key so React reconciles by identity (not array index). Without
  // this, removing item[0] would paint leftover state from item[0]
  // onto the new item[0] in any leaf form that holds local state.
  it('appended condition carries a stable __key (WR-03)', () => {
    const onChange = jest.fn();
    const group: UIConditionGroup = { kind: 'group', op: 'AND', items: [] };
    render(<ConditionGroup group={group} depth={0} onChange={onChange} />);
    fireEvent.click(screen.getByText('+ Condizione'));
    const newItem = (onChange.mock.calls[0]?.[0] as UIConditionGroup).items[0] as { __key?: string };
    expect(newItem.__key).toEqual(expect.any(String));
    expect(newItem.__key!.length).toBeGreaterThan(0);
  });

  it('appended group carries a stable __key (WR-03)', () => {
    const onChange = jest.fn();
    const group: UIConditionGroup = { kind: 'group', op: 'AND', items: [] };
    render(<ConditionGroup group={group} depth={0} onChange={onChange} />);
    fireEvent.click(screen.getByText('+ Gruppo O'));
    const newItem = (onChange.mock.calls[0]?.[0] as UIConditionGroup).items[0] as { __key?: string };
    expect(newItem.__key).toEqual(expect.any(String));
  });

  it('appended condition has API field names start_time and end_time', () => {
    const onChange = jest.fn();
    const group: UIConditionGroup = { kind: 'group', op: 'AND', items: [] };
    render(<ConditionGroup group={group} depth={0} onChange={onChange} />);
    fireEvent.click(screen.getByText('+ Condizione'));
    const newItem = (onChange.mock.calls[0]?.[0] as UIConditionGroup).items[0] as Record<string, unknown>;
    expect(newItem).toHaveProperty('start_time');
    expect(newItem).toHaveProperty('end_time');
    expect(newItem).not.toHaveProperty('start');
    expect(newItem).not.toHaveProperty('end');
  });
});

// ─── addGroup ────────────────────────────────────────────────────────────────

describe('ConditionGroup — addGroup', () => {
  it('clicking "+ Gruppo O" appends a nested OR group when parent is AND', () => {
    const onChange = jest.fn();
    const group: UIConditionGroup = { kind: 'group', op: 'AND', items: [] };
    render(<ConditionGroup group={group} depth={0} onChange={onChange} />);
    fireEvent.click(screen.getByText('+ Gruppo O'));
    const call = onChange.mock.calls[0]?.[0] as UIConditionGroup;
    expect(call.items).toHaveLength(1);
    expect(call.items[0]).toMatchObject({ kind: 'group', op: 'OR', items: [] });
  });

  it('clicking "+ Gruppo E" appends a nested AND group when parent is OR', () => {
    const onChange = jest.fn();
    const group: UIConditionGroup = { kind: 'group', op: 'OR', items: [] };
    render(<ConditionGroup group={group} depth={0} onChange={onChange} />);
    fireEvent.click(screen.getByText('+ Gruppo E'));
    const call = onChange.mock.calls[0]?.[0] as UIConditionGroup;
    expect(call.items).toHaveLength(1);
    expect(call.items[0]).toMatchObject({ kind: 'group', op: 'AND', items: [] });
  });
});

// ─── Depth-2 cap (D-11) ──────────────────────────────────────────────────────

describe('ConditionGroup — depth-2 cap (D-11)', () => {
  it('at depth 2 the "+ Gruppo" button is NOT rendered', () => {
    const group: UIConditionGroup = { kind: 'group', op: 'AND', items: [] };
    render(<ConditionGroup group={group} depth={2} onChange={jest.fn()} />);
    expect(screen.queryByText(/\+ Gruppo/)).toBeNull();
  });

  it('at depth 1 the "+ Gruppo" button IS rendered', () => {
    const group: UIConditionGroup = { kind: 'group', op: 'AND', items: [] };
    render(<ConditionGroup group={group} depth={1} onChange={jest.fn()} />);
    expect(screen.getByText('+ Gruppo O')).toBeInTheDocument();
  });

  it('at depth 0 the "+ Gruppo" button IS rendered', () => {
    const group: UIConditionGroup = { kind: 'group', op: 'AND', items: [] };
    render(<ConditionGroup group={group} depth={0} onChange={jest.fn()} />);
    expect(screen.getByText('+ Gruppo O')).toBeInTheDocument();
  });
});

// ─── Item counter ─────────────────────────────────────────────────────────────

describe('ConditionGroup — item counter', () => {
  it('shows "1 elemento" for 1 item', () => {
    const group: UIConditionGroup = {
      kind: 'group',
      op: 'AND',
      items: [{ kind: 'cond', type: 'always_true' }],
    };
    render(<ConditionGroup group={group} depth={0} onChange={jest.fn()} />);
    expect(screen.getByText('1 elemento')).toBeInTheDocument();
  });

  it('shows "3 elementi" for 3 items', () => {
    const group: UIConditionGroup = {
      kind: 'group',
      op: 'AND',
      items: [
        { kind: 'cond', type: 'always_true' },
        { kind: 'cond', type: 'always_true' },
        { kind: 'cond', type: 'always_true' },
      ],
    };
    render(<ConditionGroup group={group} depth={0} onChange={jest.fn()} />);
    expect(screen.getByText('3 elementi')).toBeInTheDocument();
  });
});

// ─── Remove item ──────────────────────────────────────────────────────────────

describe('ConditionGroup — remove item', () => {
  it('clicking remove on a ConditionItem updates items array', () => {
    const onChange = jest.fn();
    const group: UIConditionGroup = {
      kind: 'group',
      op: 'AND',
      items: [
        { kind: 'cond', type: 'always_true' },
        { kind: 'cond', type: 'time_window', start_time: '08:00', end_time: '20:00' },
      ],
    };
    render(<ConditionGroup group={group} depth={0} onChange={onChange} />);
    // Both "Rimuovi condizione" buttons should be present
    const removeBtns = screen.getAllByRole('button', { name: 'Rimuovi condizione' });
    expect(removeBtns).toHaveLength(2);
    // Click remove on the first item
    fireEvent.click(removeBtns[0]!);
    const call = onChange.mock.calls[0]?.[0] as UIConditionGroup;
    // Items array should now only have the second item
    expect(call.items).toHaveLength(1);
    expect(call.items[0]).toMatchObject({ kind: 'cond', type: 'time_window' });
  });
});

// ─── Nested group (recursion) ─────────────────────────────────────────────────

describe('ConditionGroup — recursion', () => {
  it('renders nested ConditionGroup for kind="group" items', () => {
    const group: UIConditionGroup = {
      kind: 'group',
      op: 'AND',
      items: [
        {
          kind: 'group',
          op: 'OR',
          items: [],
        },
      ],
    };
    render(<ConditionGroup group={group} depth={0} onChange={jest.fn()} />);
    // The nested OR group should render "ALMENO UNA (O)" toggle
    expect(screen.getByText('ALMENO UNA (O)')).toBeInTheDocument();
  });
});
