/**
 * AutomationsTab — Phase 180 Plan 08 Task 3
 *
 * Verifies: list rendering, Nuova button, sheet open/close,
 * editor callbacks (create/patch/delete), empty state, counter copy.
 *
 * Hook and heavy sub-components are mocked; AutomationRow is also mocked
 * to avoid re-testing its own logic here.
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// ── Mock hook ─────────────────────────────────────────────────────────────────
const mockCreate = jest.fn();
const mockUpdate = jest.fn();
const mockRemove = jest.fn();
const mockToggle = jest.fn();

const defaultHookReturn = {
  rules: [],
  totalCount: 0,
  loading: false,
  error: null,
  refetch: jest.fn(),
  page: 0,
  setPage: jest.fn(),
  create: mockCreate,
  update: mockUpdate,
  remove: mockRemove,
  toggle: mockToggle,
};

jest.mock('@/app/hooks/useAutomationsList', () => ({
  useAutomationsList: jest.fn(() => defaultHookReturn),
}));

// ── Mock AutomationRow (prevents deep rendering) ───────────────────────────────
jest.mock('../AutomationRow', () => ({
  AutomationRow: ({ rule, onOpen }: { rule: { id: number; name: string; enabled: boolean }; onOpen: (r: typeof rule) => void }) => (
    <div
      data-testid={`automation-row-${rule.id}`}
      onClick={() => onOpen(rule)}
    >
      {rule.name}
    </div>
  ),
}));

// ── Mock Sheet (renders children when open=true) ───────────────────────────────
jest.mock('../../Sheet', () => ({
  Sheet: ({
    open,
    title,
    children,
  }: {
    open: boolean;
    title: string;
    onClose: () => void;
    children: React.ReactNode;
  }) => (
    open ? (
      <div data-testid="sheet">
        <div data-testid="sheet-title">{title}</div>
        {children}
      </div>
    ) : null
  ),
}));

// ── Mock AutomationEditor (calls callbacks via test buttons) ──────────────────
jest.mock('../AutomationEditor', () => ({
  AutomationEditor: ({
    isNew,
    rule,
    onSaveCreate,
    onSavePatch,
    onDelete,
    onClose,
  }: {
    isNew: boolean;
    rule: { id: number } | null;
    onSaveCreate: (body: Record<string, unknown>) => Promise<void>;
    onSavePatch: (id: number, patch: Record<string, unknown>) => Promise<void>;
    onDelete: (id: number) => Promise<void>;
    onClose: () => void;
  }) => (
    <div data-testid="automation-editor">
      <div data-testid="editor-mode">{isNew ? 'new' : 'edit'}</div>
      <button
        data-testid="btn-save-create"
        onClick={() => void onSaveCreate({ name: 'New' })}
      >
        Save Create
      </button>
      <button
        data-testid="btn-save-patch"
        onClick={() => void onSavePatch(rule?.id ?? 0, { name: 'Patched' })}
      >
        Save Patch
      </button>
      <button
        data-testid="btn-delete"
        onClick={() => void onDelete(rule?.id ?? 0)}
      >
        Delete
      </button>
      <button data-testid="btn-close" onClick={onClose}>
        Close
      </button>
    </div>
  ),
}));

import { useAutomationsList } from '@/app/hooks/useAutomationsList';
import { AutomationsTab } from '../AutomationsTab';
import type { AutomationRule } from '@/types/automations';

const mockUseAutomationsList = useAutomationsList as jest.MockedFunction<
  typeof useAutomationsList
>;

function makeRule(overrides: Partial<AutomationRule> = {}): AutomationRule {
  return {
    id: 1,
    name: 'Test Rule',
    description: null,
    enabled: true,
    trigger: { type: 'manual_api_call' },
    condition: { type: 'always_true' },
    actions: [{ type: 'log_event', message: 'ok' }],
    min_interval_seconds: 0,
    max_triggers_per_hour: 0,
    last_triggered_at: null,
    active_hours_start: null,
    active_hours_end: null,
    created_at: 1000,
    updated_at: 1000,
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockUseAutomationsList.mockReturnValue({ ...defaultHookReturn });
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('AutomationsTab', () => {
  describe('page chrome', () => {
    it('renders "Automazioni" headline', () => {
      render(<AutomationsTab />);
      expect(screen.getByText('Automazioni')).toBeInTheDocument();
    });

    it('renders "{enabledCount} di {totalCount} attive" counter', () => {
      const rules = [
        makeRule({ id: 1, enabled: true }),
        makeRule({ id: 2, enabled: false }),
      ];
      mockUseAutomationsList.mockReturnValue({
        ...defaultHookReturn,
        rules,
        totalCount: 2,
      });

      render(<AutomationsTab />);
      expect(screen.getByText('1 di 2 attive')).toBeInTheDocument();
    });

    it('renders "Nuova" button', () => {
      render(<AutomationsTab />);
      expect(screen.getByLabelText('Nuova automazione')).toBeInTheDocument();
    });
  });

  describe('rule list', () => {
    it('renders AutomationRow for each rule', () => {
      const rules = [
        makeRule({ id: 1, name: 'Rule 1' }),
        makeRule({ id: 2, name: 'Rule 2' }),
      ];
      mockUseAutomationsList.mockReturnValue({
        ...defaultHookReturn,
        rules,
        totalCount: 2,
      });

      render(<AutomationsTab />);
      expect(screen.getByTestId('automation-row-1')).toBeInTheDocument();
      expect(screen.getByTestId('automation-row-2')).toBeInTheDocument();
    });

    it('shows empty state when rules=[] and loading=false', () => {
      render(<AutomationsTab />);
      expect(screen.getByText(/Nessuna automazione/i)).toBeInTheDocument();
      // "Nuova" appears both in the button and in the empty state prose — both are present
      expect(screen.getAllByText(/Nuova/).length).toBeGreaterThanOrEqual(1);
    });

    it('does NOT show empty state when loading=true', () => {
      mockUseAutomationsList.mockReturnValue({
        ...defaultHookReturn,
        loading: true,
      });

      render(<AutomationsTab />);
      expect(screen.queryByText(/Nessuna automazione/i)).not.toBeInTheDocument();
    });
  });

  describe('Sheet for new automation', () => {
    it('opens Sheet with "Nuova automazione" title when Nuova is clicked', async () => {
      const user = userEvent.setup();
      render(<AutomationsTab />);

      // Sheet should not be open initially
      expect(screen.queryByTestId('sheet')).not.toBeInTheDocument();

      await user.click(screen.getByLabelText('Nuova automazione'));

      expect(screen.getByTestId('sheet')).toBeInTheDocument();
      expect(screen.getByTestId('sheet-title')).toHaveTextContent('Nuova automazione');
      expect(screen.getByTestId('editor-mode')).toHaveTextContent('new');
    });
  });

  describe('Sheet for edit automation', () => {
    it('opens Sheet with "Modifica automazione" title when row is clicked', async () => {
      const user = userEvent.setup();
      const rule = makeRule({ id: 99, name: 'Edit me' });
      mockUseAutomationsList.mockReturnValue({
        ...defaultHookReturn,
        rules: [rule],
        totalCount: 1,
      });

      render(<AutomationsTab />);

      await user.click(screen.getByTestId('automation-row-99'));

      expect(screen.getByTestId('sheet')).toBeInTheDocument();
      expect(screen.getByTestId('sheet-title')).toHaveTextContent('Modifica automazione');
      expect(screen.getByTestId('editor-mode')).toHaveTextContent('edit');
    });
  });

  describe('editor callbacks', () => {
    it('onSaveCreate triggers hook.create and closes sheet', async () => {
      const user = userEvent.setup();
      mockCreate.mockResolvedValueOnce(undefined);

      render(<AutomationsTab />);

      // Open sheet for new automation
      await user.click(screen.getByLabelText('Nuova automazione'));
      expect(screen.getByTestId('automation-editor')).toBeInTheDocument();

      // Click "Save Create" in the stub editor
      await user.click(screen.getByTestId('btn-save-create'));

      await waitFor(() => expect(mockCreate).toHaveBeenCalledWith({ name: 'New' }));
      // Sheet should close after save
      await waitFor(() => expect(screen.queryByTestId('sheet')).not.toBeInTheDocument());
    });

    it('onSavePatch triggers hook.update and closes sheet', async () => {
      const user = userEvent.setup();
      const rule = makeRule({ id: 5 });
      mockUseAutomationsList.mockReturnValue({
        ...defaultHookReturn,
        rules: [rule],
        totalCount: 1,
      });
      mockUpdate.mockResolvedValueOnce(undefined);

      render(<AutomationsTab />);

      // Open sheet for edit
      await user.click(screen.getByTestId('automation-row-5'));
      await user.click(screen.getByTestId('btn-save-patch'));

      await waitFor(() => expect(mockUpdate).toHaveBeenCalledWith(5, { name: 'Patched' }));
      await waitFor(() => expect(screen.queryByTestId('sheet')).not.toBeInTheDocument());
    });

    it('onDelete triggers hook.remove and closes sheet', async () => {
      const user = userEvent.setup();
      const rule = makeRule({ id: 8 });
      mockUseAutomationsList.mockReturnValue({
        ...defaultHookReturn,
        rules: [rule],
        totalCount: 1,
      });
      mockRemove.mockResolvedValueOnce(undefined);

      render(<AutomationsTab />);

      await user.click(screen.getByTestId('automation-row-8'));
      await user.click(screen.getByTestId('btn-delete'));

      await waitFor(() => expect(mockRemove).toHaveBeenCalledWith(8));
      await waitFor(() => expect(screen.queryByTestId('sheet')).not.toBeInTheDocument());
    });

    it('close button closes the sheet', async () => {
      const user = userEvent.setup();
      render(<AutomationsTab />);

      await user.click(screen.getByLabelText('Nuova automazione'));
      expect(screen.getByTestId('sheet')).toBeInTheDocument();

      await user.click(screen.getByTestId('btn-close'));
      expect(screen.queryByTestId('sheet')).not.toBeInTheDocument();
    });
  });
});
