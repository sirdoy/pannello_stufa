/**
 * Unit tests for StoveSyncPanel Component
 * Tests stove-thermostat sync UI configuration
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import StoveSyncPanel from '@/app/components/netatmo/StoveSyncPanel';

// Mock fetch
global.fetch = jest.fn();

describe('StoveSyncPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render loading skeleton initially', () => {
    // Mock fetch to never resolve (stays in loading state)
    global.fetch.mockImplementation(() => new Promise(() => {}));

    render(<StoveSyncPanel />);

    // Should show skeleton while loading
    expect(screen.getByText(/Sincronizzazione Stufa-Termostato/i)).toBeInTheDocument();
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

    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => mockConfig,
    });

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

    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => mockConfig,
    });

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

    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => mockConfig,
    });

    render(<StoveSyncPanel />);

    await waitFor(() => {
      expect(screen.getByText(/Seleziona stanze da sincronizzare/i)).toBeInTheDocument();
    });

    // Should show available rooms as checkboxes
    expect(screen.getByText('Soggiorno')).toBeInTheDocument();
    expect(screen.getByText('Camera')).toBeInTheDocument();
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

    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => mockConfig,
    });

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

    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockConfig,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ config: mockConfig.config }),
      });

    render(<StoveSyncPanel />);

    await waitFor(() => {
      expect(screen.getByText('Soggiorno')).toBeInTheDocument();
    });

    // Click room checkbox to make a change
    const checkbox = screen.getByRole('checkbox', { name: /Soggiorno/i });
    fireEvent.click(checkbox);

    await waitFor(() => {
      expect(screen.getByText('Salva modifiche')).toBeInTheDocument();
    });

    // Click save
    const saveButton = screen.getByText('Salva modifiche');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/netatmo/stove-sync'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });
  });

  it('should handle errors gracefully', async () => {
    global.fetch.mockRejectedValue(new Error('Network error'));

    render(<StoveSyncPanel />);

    await waitFor(() => {
      expect(screen.getByText(/Network error/i)).toBeInTheDocument();
    });
  });
});
