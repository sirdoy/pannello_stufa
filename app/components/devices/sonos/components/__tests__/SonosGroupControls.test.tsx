import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SonosGroupControls from '../SonosGroupControls';

const mockAvailableZones = [
  { group_id: 'RINCON_B', label: 'Cucina', coordinator_uid: 'RINCON_B' },
  { group_id: 'RINCON_C', label: 'Camera', coordinator_uid: 'RINCON_C' },
];

describe('SonosGroupControls', () => {
  const onJoinGroup = jest.fn();
  const onUnjoinGroup = jest.fn();

  beforeEach(() => {
    onJoinGroup.mockClear();
    onUnjoinGroup.mockClear();
  });

  it('renders Separa button for non-coordinator in multi-member zone', () => {
    render(
      <SonosGroupControls
        uid="RINCON_A"
        isCoordinator={false}
        zoneMemberCount={2}
        availableZones={mockAvailableZones}
        onJoinGroup={onJoinGroup}
        onUnjoinGroup={onUnjoinGroup}
      />
    );
    expect(screen.getByText('Separa')).toBeInTheDocument();
  });

  it('calls onUnjoinGroup when Separa is clicked', () => {
    render(
      <SonosGroupControls
        uid="RINCON_A"
        isCoordinator={false}
        zoneMemberCount={3}
        availableZones={mockAvailableZones}
        onJoinGroup={onJoinGroup}
        onUnjoinGroup={onUnjoinGroup}
      />
    );
    fireEvent.click(screen.getByText('Separa'));
    expect(onUnjoinGroup).toHaveBeenCalledWith('RINCON_A');
  });

  it('renders join select dropdown for standalone coordinator', () => {
    render(
      <SonosGroupControls
        uid="RINCON_A"
        isCoordinator={true}
        zoneMemberCount={1}
        availableZones={mockAvailableZones}
        onJoinGroup={onJoinGroup}
        onUnjoinGroup={onUnjoinGroup}
      />
    );
    const select = screen.getByLabelText('Unisci a un gruppo');
    expect(select).toBeInTheDocument();
    expect(screen.getByText('Unisci a...')).toBeInTheDocument();
    expect(screen.getByText('Cucina')).toBeInTheDocument();
    expect(screen.getByText('Camera')).toBeInTheDocument();
  });

  it('renders nothing for coordinator in multi-member zone', () => {
    const { container } = render(
      <SonosGroupControls
        uid="RINCON_A"
        isCoordinator={true}
        zoneMemberCount={3}
        availableZones={mockAvailableZones}
        onJoinGroup={onJoinGroup}
        onUnjoinGroup={onUnjoinGroup}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing for non-coordinator in single-member zone', () => {
    const { container } = render(
      <SonosGroupControls
        uid="RINCON_A"
        isCoordinator={false}
        zoneMemberCount={1}
        availableZones={mockAvailableZones}
        onJoinGroup={onJoinGroup}
        onUnjoinGroup={onUnjoinGroup}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('excludes own zone from join dropdown', () => {
    const zonesIncludingSelf = [
      ...mockAvailableZones,
      { group_id: 'RINCON_A', label: 'Salotto', coordinator_uid: 'RINCON_A' },
    ];
    render(
      <SonosGroupControls
        uid="RINCON_A"
        isCoordinator={true}
        zoneMemberCount={1}
        availableZones={zonesIncludingSelf}
        onJoinGroup={onJoinGroup}
        onUnjoinGroup={onUnjoinGroup}
      />
    );
    expect(screen.queryByText('Salotto')).not.toBeInTheDocument();
    expect(screen.getByText('Cucina')).toBeInTheDocument();
  });
});
