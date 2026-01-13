import { render, screen } from '@testing-library/react';
import {
  DropdownContainer,
  DropdownItem,
  DropdownInfoCard,
  MenuSection,
  MenuItem,
  UserInfoCard
} from '../DropdownComponents';
import { User, LogOut } from 'lucide-react';

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href, onClick, className, style }) => (
    <a href={href} onClick={onClick} className={className} style={style}>
      {children}
    </a>
  );
});

describe('DropdownComponents', () => {
  describe('DropdownContainer', () => {
    it('renders children correctly', () => {
      render(
        <DropdownContainer>
          <div>Test Content</div>
        </DropdownContainer>
      );
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('applies alignment correctly', () => {
      const { container } = render(
        <DropdownContainer align="right">
          <div>Test</div>
        </DropdownContainer>
      );
      expect(container.firstChild).toHaveClass('right-0');
    });
  });

  describe('DropdownItem', () => {
    it('renders with label and icon', () => {
      render(
        <DropdownItem
          href="/test"
          label="Test Item"
          icon="🔥"
        />
      );
      expect(screen.getByText('Test Item')).toBeInTheDocument();
      expect(screen.getByText('🔥')).toBeInTheDocument();
    });

    it('renders with description', () => {
      render(
        <DropdownItem
          href="/test"
          label="Test Item"
          description="Test Description"
        />
      );
      expect(screen.getByText('Test Description')).toBeInTheDocument();
    });

    it('applies active state correctly', () => {
      const { container } = render(
        <DropdownItem
          href="/test"
          label="Active Item"
          isActive={true}
        />
      );
      expect(container.querySelector('a')).toHaveClass('bg-primary-500/20');
    });
  });

  describe('DropdownInfoCard', () => {
    it('renders all information correctly', () => {
      render(
        <DropdownInfoCard
          title="Connected as"
          subtitle="John Doe"
          details="john@example.com"
        />
      );
      expect(screen.getByText('Connected as')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
    });
  });

  describe('MenuSection', () => {
    it('renders section with title and children', () => {
      render(
        <MenuSection title="Device Settings" icon="⚙️">
          <div>Child Content</div>
        </MenuSection>
      );
      expect(screen.getByText('Device Settings')).toBeInTheDocument();
      expect(screen.getByText('⚙️')).toBeInTheDocument();
      expect(screen.getByText('Child Content')).toBeInTheDocument();
    });

    it('hides header when title is empty', () => {
      render(
        <MenuSection title="">
          <div>Child Content</div>
        </MenuSection>
      );
      expect(screen.queryByRole('heading')).not.toBeInTheDocument();
      expect(screen.getByText('Child Content')).toBeInTheDocument();
    });
  });

  describe('MenuItem', () => {
    it('renders standard menu item', () => {
      render(
        <MenuItem
          href="/test"
          label="Test Menu"
          icon="🏠"
        />
      );
      expect(screen.getByText('Test Menu')).toBeInTheDocument();
      expect(screen.getByText('🏠')).toBeInTheDocument();
    });

    it('applies prominent variant correctly', () => {
      const { container } = render(
        <MenuItem
          href="/logout"
          label="Logout"
          variant="prominent"
        />
      );
      expect(container.querySelector('a')).toHaveClass('bg-gradient-to-br');
    });
  });

  describe('UserInfoCard', () => {
    it('renders user information with icon', () => {
      render(
        <UserInfoCard
          icon={User}
          name="Jane Doe"
          email="jane@example.com"
        />
      );
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
      expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    });

    it('renders without email', () => {
      render(
        <UserInfoCard
          icon={User}
          name="Jane Doe"
        />
      );
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
      expect(screen.queryByText(/@/)).not.toBeInTheDocument();
    });
  });
});
