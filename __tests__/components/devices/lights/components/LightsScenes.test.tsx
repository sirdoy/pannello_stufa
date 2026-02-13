import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LightsScenes from '@/app/components/devices/lights/components/LightsScenes';

describe('LightsScenes', () => {
  const mockOnSceneActivate = jest.fn();

  const mockScenes = [
    { id: 'scene1', metadata: { name: 'Relax' } },
    { id: 'scene2', metadata: { name: 'Concentrate' } },
    { id: 'scene3', metadata: { name: 'Energize' } },
  ];

  const defaultProps = {
    roomScenes: mockScenes,
    refreshing: false,
    onSceneActivate: mockOnSceneActivate,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders nothing when no scenes', () => {
    const { container } = render(
      <LightsScenes {...defaultProps} roomScenes={[]} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders divider with "Scene" label', () => {
    render(<LightsScenes {...defaultProps} />);
    expect(screen.getByText('Scene')).toBeInTheDocument();
  });

  it('renders all scene buttons', () => {
    render(<LightsScenes {...defaultProps} />);
    expect(screen.getByRole('button', { name: /relax/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /concentrate/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /energize/i })).toBeInTheDocument();
  });

  it('renders scene names from metadata', () => {
    render(<LightsScenes {...defaultProps} />);
    expect(screen.getByText('Relax')).toBeInTheDocument();
    expect(screen.getByText('Concentrate')).toBeInTheDocument();
    expect(screen.getByText('Energize')).toBeInTheDocument();
  });

  it('renders scene icon for each button', () => {
    const { container } = render(<LightsScenes {...defaultProps} />);
    // Query for scene icons specifically (not divider)
    const icons = container.querySelectorAll('span[aria-hidden="true"]');
    expect(icons).toHaveLength(3);
    icons.forEach(icon => {
      expect(icon.textContent).toBe('🎨');
    });
  });

  it('calls onSceneActivate with scene id when clicked', async () => {
    const user = userEvent.setup();
    render(<LightsScenes {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: /relax/i }));
    expect(mockOnSceneActivate).toHaveBeenCalledWith('scene1');
  });

  it('disables scene buttons when refreshing', () => {
    render(<LightsScenes {...defaultProps} refreshing={true} />);
    expect(screen.getByRole('button', { name: /relax/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /concentrate/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /energize/i })).toBeDisabled();
  });

  describe('Scroll Indicator', () => {
    it('shows scroll indicator when more than 3 scenes', () => {
      const manyScenes = [
        ...mockScenes,
        { id: 'scene4', metadata: { name: 'Scene 4' } },
      ];
      render(<LightsScenes {...defaultProps} roomScenes={manyScenes} />);
      expect(screen.getByText(/scorri per vedere tutte le 4 scene/i)).toBeInTheDocument();
    });

    it('does not show scroll indicator when 3 or fewer scenes', () => {
      render(<LightsScenes {...defaultProps} />);
      expect(screen.queryByText(/scorri/i)).not.toBeInTheDocument();
    });

    it('shows correct count in scroll indicator', () => {
      const manyScenes = Array.from({ length: 7 }, (_, i) => ({
        id: `scene${i + 1}`,
        metadata: { name: `Scene ${i + 1}` },
      }));
      render(<LightsScenes {...defaultProps} roomScenes={manyScenes} />);
      expect(screen.getByText(/7 scene/i)).toBeInTheDocument();
    });
  });

  describe('Fallback Names', () => {
    it('renders "Scena" when metadata.name is missing', () => {
      const scenesWithoutNames = [
        { id: 'scene1', metadata: {} },
        { id: 'scene2', metadata: { name: null } },
      ];
      render(<LightsScenes {...defaultProps} roomScenes={scenesWithoutNames} />);
      const scenaButtons = screen.getAllByText('Scena');
      expect(scenaButtons).toHaveLength(2);
    });

    it('renders aria-label with fallback name', () => {
      const sceneWithoutName = [{ id: 'scene1', metadata: {} }];
      render(<LightsScenes {...defaultProps} roomScenes={sceneWithoutName} />);
      expect(screen.getByRole('button', { name: /attiva scena scena/i })).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles single scene correctly', () => {
      const singleScene = [{ id: 'scene1', metadata: { name: 'Only Scene' } }];
      render(<LightsScenes {...defaultProps} roomScenes={singleScene} />);
      expect(screen.getByRole('button', { name: /only scene/i })).toBeInTheDocument();
      expect(screen.queryByText(/scorri/i)).not.toBeInTheDocument();
    });

    it('handles exactly 3 scenes (no indicator)', () => {
      render(<LightsScenes {...defaultProps} />);
      expect(screen.getAllByRole('button')).toHaveLength(3);
      expect(screen.queryByText(/scorri/i)).not.toBeInTheDocument();
    });

    it('handles exactly 4 scenes (shows indicator)', () => {
      const fourScenes = [
        ...mockScenes,
        { id: 'scene4', metadata: { name: 'Scene 4' } },
      ];
      render(<LightsScenes {...defaultProps} roomScenes={fourScenes} />);
      expect(screen.getByText(/4 scene/i)).toBeInTheDocument();
    });
  });
});
