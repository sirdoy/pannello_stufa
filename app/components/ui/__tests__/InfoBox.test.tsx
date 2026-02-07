import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import InfoBox from '../InfoBox';

describe('InfoBox Component', () => {
  describe('Rendering', () => {
    test('renders with label and value', () => {
      render(<InfoBox label="Test Label" value="Test Value" />);
      expect(screen.getByText('Test Label')).toBeInTheDocument();
      expect(screen.getByText('Test Value')).toBeInTheDocument();
    });

    test('renders with icon', () => {
      render(<InfoBox icon="🏠" label="Casa" value="Home" />);
      expect(screen.getByText('🏠')).toBeInTheDocument();
    });
  });

  describe('Variants', () => {
    test('neutral variant applies slate text color', () => {
      const { container } = render(
        <InfoBox label="Test" value="Value" variant="neutral" />
      );
      const valueEl = container.querySelector('.text-slate-100');
      expect(valueEl).toBeInTheDocument();
    });

    test('ember variant applies ember text color', () => {
      const { container } = render(
        <InfoBox label="Test" value="Value" variant="ember" />
      );
      const valueEl = container.querySelector('.text-ember-400');
      expect(valueEl).toBeInTheDocument();
    });

    test('sage variant applies sage text color', () => {
      const { container } = render(
        <InfoBox label="Test" value="Value" variant="sage" />
      );
      const valueEl = container.querySelector('.text-sage-400');
      expect(valueEl).toBeInTheDocument();
    });

    test('ocean variant applies ocean text color', () => {
      const { container } = render(
        <InfoBox label="Test" value="Value" variant="ocean" />
      );
      const valueEl = container.querySelector('.text-ocean-400');
      expect(valueEl).toBeInTheDocument();
    });

    test('warning variant applies warning text color', () => {
      const { container } = render(
        <InfoBox label="Test" value="Value" variant="warning" />
      );
      const valueEl = container.querySelector('.text-warning-400');
      expect(valueEl).toBeInTheDocument();
    });

    test('danger variant applies danger text color', () => {
      const { container } = render(
        <InfoBox label="Test" value="Value" variant="danger" />
      );
      const valueEl = container.querySelector('.text-danger-400');
      expect(valueEl).toBeInTheDocument();
    });

    test('default variant is neutral', () => {
      const { container } = render(
        <InfoBox label="Test" value="Value" />
      );
      const valueEl = container.querySelector('.text-slate-100');
      expect(valueEl).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('has no accessibility violations', async () => {
      const { container } = render(
        <InfoBox icon="🏠" label="Casa" value="My Home" variant="neutral" />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('ember variant has no accessibility violations', async () => {
      const { container } = render(
        <InfoBox label="Status" value="Active" variant="ember" />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Custom className', () => {
    test('applies custom className', () => {
      const { container } = render(
        <InfoBox label="Test" value="Value" className="custom-class" />
      );
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });
});
