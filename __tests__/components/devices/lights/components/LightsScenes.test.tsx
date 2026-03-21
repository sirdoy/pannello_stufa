import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LightsScenes from '@/app/components/devices/lights/components/LightsScenes';
import type { HueScene } from '@/types/hueProxy';

describe('LightsScenes', () => {
  const mockOnSceneActivate = jest.fn();

  const mockScenes: HueScene[] = [
    { scene_id: 'scene1', name: 'Relax', group_id: '1', group_name: 'Soggiorno', lights: ['1'], type: 'GroupScene' },
    { scene_id: 'scene2', name: 'Concentrate', group_id: '1', group_name: 'Soggiorno', lights: ['1'], type: 'GroupScene' },
    { scene_id: 'scene3', name: 'Energize', group_id: '1', group_name: 'Soggiorno', lights: ['1'], type: 'GroupScene' },
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

  it('renders scene names', () => {
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

  it('calls onSceneActivate with sceneId and groupId when clicked', async () => {
    const user = userEvent.setup();
    render(<LightsScenes {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: /relax/i }));
    expect(mockOnSceneActivate).toHaveBeenCalledWith('scene1', '1');
  });

  it('disables scene buttons when refreshing', () => {
    render(<LightsScenes {...defaultProps} refreshing={true} />);
    expect(screen.getByRole('button', { name: /relax/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /concentrate/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /energize/i })).toBeDisabled();
  });

  describe('Scroll Indicator', () => {
    it('shows scroll indicator when more than 3 scenes', () => {
      const manyScenes: HueScene[] = [
        ...mockScenes,
        { scene_id: 'scene4', name: 'Scene 4', group_id: '1', group_name: 'Soggiorno', lights: ['1'], type: 'GroupScene' },
      ];
      render(<LightsScenes {...defaultProps} roomScenes={manyScenes} />);
      expect(screen.getByText(/scorri per vedere tutte le 4 scene/i)).toBeInTheDocument();
    });

    it('does not show scroll indicator when 3 or fewer scenes', () => {
      render(<LightsScenes {...defaultProps} />);
      expect(screen.queryByText(/scorri/i)).not.toBeInTheDocument();
    });

    it('shows correct count in scroll indicator', () => {
      const manyScenes: HueScene[] = Array.from({ length: 7 }, (_, i) => ({
        scene_id: `scene${i + 1}`,
        name: `Scene ${i + 1}`,
        group_id: '1',
        group_name: 'Soggiorno',
        lights: ['1'],
        type: 'GroupScene',
      }));
      render(<LightsScenes {...defaultProps} roomScenes={manyScenes} />);
      expect(screen.getByText(/7 scene/i)).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles single scene correctly', () => {
      const singleScene: HueScene[] = [
        { scene_id: 'scene1', name: 'Only Scene', group_id: '1', group_name: 'Soggiorno', lights: ['1'], type: 'GroupScene' },
      ];
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
      const fourScenes: HueScene[] = [
        ...mockScenes,
        { scene_id: 'scene4', name: 'Scene 4', group_id: '1', group_name: 'Soggiorno', lights: ['1'], type: 'GroupScene' },
      ];
      render(<LightsScenes {...defaultProps} roomScenes={fourScenes} />);
      expect(screen.getByText(/4 scene/i)).toBeInTheDocument();
    });
  });
});
