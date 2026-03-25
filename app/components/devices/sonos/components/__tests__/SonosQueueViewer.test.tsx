import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SonosQueueViewer from '../SonosQueueViewer';

// Mock useSonosQueue at module level
const mockFetchInitial = jest.fn();
const mockLoadMore = jest.fn();

const defaultMockReturn = {
  items: [],
  total: 0,
  loading: false,
  error: null,
  hasMore: false,
  fetchInitial: mockFetchInitial,
  loadMore: mockLoadMore,
};

let mockReturnValue = { ...defaultMockReturn };

jest.mock('@/app/components/devices/sonos/hooks/useSonosQueue', () => ({
  useSonosQueue: () => mockReturnValue,
}));

describe('SonosQueueViewer', () => {
  beforeEach(() => {
    mockReturnValue = { ...defaultMockReturn };
    mockFetchInitial.mockClear();
    mockLoadMore.mockClear();
  });

  it('renders collapsed state with Coda button', () => {
    render(<SonosQueueViewer groupId="zone-1" />);
    const button = screen.getByRole('button');
    expect(button.textContent).toContain('Coda');
    // Queue items should not be visible
    expect(screen.queryByText('Coda vuota')).not.toBeInTheDocument();
  });

  it('calls fetchInitial on expand', () => {
    render(<SonosQueueViewer groupId="zone-1" />);
    fireEvent.click(screen.getByRole('button'));
    expect(mockFetchInitial).toHaveBeenCalledTimes(1);
  });

  it('shows queue items when expanded', () => {
    mockReturnValue = {
      ...defaultMockReturn,
      items: [
        { position: 1, title: 'Song One', artist: 'Artist A', album: 'Album X', album_art_url: null },
        { position: 2, title: 'Song Two', artist: 'Artist B', album: 'Album Y', album_art_url: null },
      ],
      total: 2,
    };
    render(<SonosQueueViewer groupId="zone-1" />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText('Song One')).toBeInTheDocument();
    expect(screen.getByText('Song Two')).toBeInTheDocument();
  });

  it('shows Coda vuota when items empty and not loading', () => {
    mockReturnValue = { ...defaultMockReturn, items: [], total: 0, loading: false };
    render(<SonosQueueViewer groupId="zone-1" />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText('Coda vuota')).toBeInTheDocument();
  });

  it('shows Carica altri button when hasMore', () => {
    mockReturnValue = {
      ...defaultMockReturn,
      items: [
        { position: 1, title: 'Track', artist: 'Artist', album: null, album_art_url: null },
      ],
      total: 25,
      hasMore: true,
    };
    render(<SonosQueueViewer groupId="zone-1" />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText('Carica altri')).toBeInTheDocument();
  });

  it('clicking Carica altri calls loadMore', () => {
    mockReturnValue = {
      ...defaultMockReturn,
      items: [
        { position: 1, title: 'Track', artist: 'Artist', album: null, album_art_url: null },
      ],
      total: 25,
      hasMore: true,
    };
    render(<SonosQueueViewer groupId="zone-1" />);
    fireEvent.click(screen.getByRole('button'));
    fireEvent.click(screen.getByText('Carica altri'));
    expect(mockLoadMore).toHaveBeenCalledTimes(1);
  });

  it('shows total count in header when expanded', () => {
    mockReturnValue = {
      ...defaultMockReturn,
      items: [
        { position: 1, title: 'Track', artist: 'Artist', album: null, album_art_url: null },
      ],
      total: 12,
    };
    render(<SonosQueueViewer groupId="zone-1" />);
    // Toggle to expand — after expansion, total is set
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText(/Coda \(12 brani\)/)).toBeInTheDocument();
  });
});
