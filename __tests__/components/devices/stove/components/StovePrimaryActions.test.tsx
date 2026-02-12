import { render, screen, fireEvent } from '@testing-library/react';
import StovePrimaryActions from '@/app/components/devices/stove/components/StovePrimaryActions';

describe('StovePrimaryActions', () => {
  const mockOnIgnite = jest.fn();
  const mockOnShutdown = jest.fn();

  const defaultProps = {
    isAccesa: false,
    isSpenta: true,
    isOnline: true,
    needsMaintenance: false,
    loading: false,
    igniteCmd: { isExecuting: false },
    shutdownCmd: { isExecuting: false },
    onIgnite: mockOnIgnite,
    onShutdown: mockOnShutdown,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows ACCENDI button when stove is OFF', () => {
    render(<StovePrimaryActions {...defaultProps} isSpenta={true} />);
    expect(screen.getByText('ACCENDI')).toBeInTheDocument();
    expect(screen.queryByText('SPEGNI')).not.toBeInTheDocument();
  });

  it('shows SPEGNI button when stove is ON', () => {
    render(<StovePrimaryActions {...defaultProps} isAccesa={true} isSpenta={false} />);
    expect(screen.getByText('SPEGNI')).toBeInTheDocument();
    expect(screen.queryByText('ACCENDI')).not.toBeInTheDocument();
  });

  it('shows both buttons in transitional state', () => {
    render(<StovePrimaryActions {...defaultProps} isAccesa={false} isSpenta={false} />);
    expect(screen.getByText('ACCENDI')).toBeInTheDocument();
    expect(screen.getByText('SPEGNI')).toBeInTheDocument();
  });

  it('shows offline message when isOnline is false', () => {
    render(<StovePrimaryActions {...defaultProps} isOnline={false} />);
    expect(screen.getByText('Controlli non disponibili offline')).toBeInTheDocument();
    expect(screen.queryByText('ACCENDI')).not.toBeInTheDocument();
  });

  it('disables ACCENDI when needsMaintenance is true', () => {
    render(<StovePrimaryActions {...defaultProps} needsMaintenance={true} isSpenta={true} />);
    const button = screen.getByText('ACCENDI');
    expect(button).toBeDisabled();
  });

  it('disables buttons when loading is true', () => {
    render(<StovePrimaryActions {...defaultProps} loading={true} isSpenta={true} />);
    const button = screen.getByText('ACCENDI');
    expect(button).toBeDisabled();
  });

  it('disables buttons when command is executing', () => {
    render(<StovePrimaryActions {...defaultProps} igniteCmd={{ isExecuting: true }} isSpenta={true} />);
    const button = screen.getByText('ACCENDI');
    expect(button).toBeDisabled();
  });

  it('calls onIgnite when ACCENDI button is clicked', () => {
    render(<StovePrimaryActions {...defaultProps} isSpenta={true} />);
    const button = screen.getByText('ACCENDI');
    fireEvent.click(button);
    expect(mockOnIgnite).toHaveBeenCalledTimes(1);
  });

  it('calls onShutdown when SPEGNI button is clicked', () => {
    render(<StovePrimaryActions {...defaultProps} isAccesa={true} isSpenta={false} />);
    const button = screen.getByText('SPEGNI');
    fireEvent.click(button);
    expect(mockOnShutdown).toHaveBeenCalledTimes(1);
  });
});
