/**
 * Unit tests for StoveSyncPanel Component
 * Tests stove-thermostat sync UI configuration
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import StoveSyncPanel from '@/app/components/netatmo/StoveSyncPanel';

// Mock fetch
global.fetch = jest.fn() as jest.Mock;

describe('StoveSyncPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render loading skeleton initially', () => {
    // Mock fetch to never resolve (stays in loading state)
    (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));

    const { container } = render(<StoveSyncPanel />);

    // Should show skeleton while loading - title is NOT shown during loading
    // Check that a skeleton element exists (uses animate-shimmer for the shimmer effect)
    const skeleton = container.querySelector('[class*="animate-shimmer"]');
    // Or check for skeleton base class pattern (bg-slate-700/50 on dark mode)
    const hasSkeletonStyle = container.innerHTML.includes('bg-slate-700/50');
    expect(skeleton || hasSkeletonStyle).toBeTruthy();
  });

  it('should fetch and display stove sync configuration', async () => {
    const mockConfig = {
      config: {
        enabled: true,
        rooms: [
          { id: 'room-1', name: 'Soggiorno' },
          { id: 'room-2', name: 'Camera' },
        ],
        stoveTemperature: 16,
        stoveMode: false,
      },
      availableRooms: [
        { id: 'room-1', name: 'Soggiorno', type: 'livingroom' },
        { id: 'room-2', name: 'Camera', type: 'bedroom' },
        { id: 'room-3', name: 'Cucina', type: 'kitchen' },
      ],
    };

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockConfig,
    } as any);

    render(<StoveSyncPanel />);

    await waitFor(() => {
      expect(screen.getByText('Sincronizzazione Stufa-Termostato')).toBeInTheDocument();
    });

    // Should show current config
    await waitFor(() => {
      expect(screen.getByText(/Configurazione attuale/i)).toBeInTheDocument();
    });
  });

  it('should allow enabling/disabling sync', async () => {
    const mockConfig = {
      config: {
        enabled: false,
        rooms: [],
        stoveTemperature: 16,
      },
      availableRooms: [
        { id: 'room-1', name: 'Soggiorno', type: 'livingroom' },
      ],
    };

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockConfig,
    } as any);

    render(<StoveSyncPanel />);

    await waitFor(() => {
      expect(screen.getByText('Abilita sincronizzazione')).toBeInTheDocument();
    });

    // Should show toggle for enabling
    const toggle = screen.getByLabelText('Abilita sincronizzazione');
    expect(toggle).not.toBeChecked();
  });

  it('should show room selection when enabled', async () => {
    const mockConfig = {
      config: {
        enabled: true,
        rooms: [],
        stoveTemperature: 16,
      },
      availableRooms: [
        { id: 'room-1', name: 'Soggiorno', type: 'livingroom' },
        { id: 'room-2', name: 'Camera', type: 'bedroom' },
      ],
    };

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockConfig,
    } as any);

    const { container } = render(<StoveSyncPanel />);

    await waitFor(() => {
      expect(screen.getByText(/Seleziona stanze da sincronizzare/i)).toBeInTheDocument();
    });

    // Should show available rooms as checkboxes (find within labels)
    const labels = container.querySelectorAll('label');
    const labelTexts = Array.from(labels).map(l => l.textContent);
    expect(labelTexts.some(t => t.includes('Soggiorno'))).toBe(true);
    expect(labelTexts.some(t => t.includes('Camera'))).toBe(true);
  });

  it('should show temperature controls when enabled', async () => {
    const mockConfig = {
      config: {
        enabled: true,
        rooms: [],
        stoveTemperature: 16,
      },
      availableRooms: [],
    };

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockConfig,
    } as any);

    render(<StoveSyncPanel />);

    await waitFor(() => {
      expect(screen.getByText(/Temperatura valvole quando stufa è accesa/i)).toBeInTheDocument();
    });

    // Should show temperature display
    expect(screen.getByText('16.0°C')).toBeInTheDocument();

    // Should show increment/decrement buttons
    const buttons = screen.getAllByRole('button');
    expect(buttons.some(btn => btn.textContent === '−')).toBe(true);
    expect(buttons.some(btn => btn.textContent === '+')).toBe(true);
  });

  it('should save configuration when save button is clicked', async () => {
    const mockConfig = {
      config: {
        enabled: true,
        rooms: [{ id: 'room-1', name: 'Soggiorno' }],
        stoveTemperature: 16,
      },
      availableRooms: [
        { id: 'room-1', name: 'Soggiorno', type: 'livingroom' },
      ],
    };

    // Mock all fetch calls
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockConfig,
    } as any);

    render(<StoveSyncPanel />);

    // Wait for temperature control to appear
    await waitFor(() => {
      expect(screen.getByText('16.0°C')).toBeInTheDocument();
    });

    // Click temperature + button to make a change (triggers hasChanges)
    const buttons = screen.getAllByRole('button');
    const plusButton = buttons.find(btn => btn.textContent.includes('+'));
    expect(plusButton).toBeTruthy();
    fireEvent.click(plusButton);

    // Save button should now appear
    await waitFor(() => {
      expect(screen.getByText('Salva modifiche')).toBeInTheDocument();
    });

    // Reset mock to track only POST calls
    const fetchMock = global.fetch as jest.Mock;
    const callCount = fetchMock.mock.calls.length;

    // Click save
    const saveButton = screen.getByText('Salva modifiche').closest('button');
    fireEvent.click(saveButton);

    // Wait for fetch to be called with POST
    await waitFor(() => {
      // Check that a new fetch call was made after the initial GET
      expect(fetchMock.mock.calls.length).toBeGreaterThan(callCount);
    });

    // Verify the save call was made
    const lastCall = fetchMock.mock.calls[fetchMock.mock.calls.length - 1];
    expect(lastCall[0]).toContain('/api/netatmo/stove-sync');
    expect((lastCall[1] as any).method).toBe('POST');
  });

  it('should handle errors gracefully', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

    render(<StoveSyncPanel />);

    await waitFor(() => {
      expect(screen.getByText(/Network error/i)).toBeInTheDocument();
    });
  });
});
