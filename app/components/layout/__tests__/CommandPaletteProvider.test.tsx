import { render } from '@testing-library/react';
import CommandPaletteProvider, {
  CommandPaletteContext,
} from '../CommandPaletteProvider';
import { useContext } from 'react';

const pushMock = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));

type CommandItem = {
  id: string;
  label: string;
  onSelect?: () => void;
};

type CommandGroup = {
  heading?: string;
  items: CommandItem[];
};

function TestHarness({
  onCommands,
}: {
  onCommands: (commands: CommandGroup[]) => void;
}) {
  const ctx = useContext(CommandPaletteContext);
  if (ctx) onCommands(ctx.commands as CommandGroup[]);
  return null;
}

describe('CommandPaletteProvider — nav-telephony entry (D-17)', () => {
  beforeEach(() => {
    pushMock.mockClear();
  });

  it('exposes nav-telephony entry in the Navigazione heading', () => {
    let captured: CommandGroup[] = [];
    render(
      <CommandPaletteProvider>
        <TestHarness onCommands={(c) => (captured = c)} />
      </CommandPaletteProvider>
    );

    const nav = captured.find((g) => g.heading === 'Navigazione');
    expect(nav).toBeDefined();
    const telephony = nav?.items.find((i) => i.id === 'nav-telephony');
    expect(telephony).toBeDefined();
    expect(telephony?.label).toBe('Telefonia');
  });

  it('nav-telephony onSelect routes to /telefonia', () => {
    let captured: CommandGroup[] = [];
    render(
      <CommandPaletteProvider>
        <TestHarness onCommands={(c) => (captured = c)} />
      </CommandPaletteProvider>
    );

    const nav = captured.find((g) => g.heading === 'Navigazione');
    const telephony = nav?.items.find((i) => i.id === 'nav-telephony');
    expect(telephony?.onSelect).toBeDefined();

    telephony?.onSelect?.();

    expect(pushMock).toHaveBeenCalledWith('/telefonia');
  });

  it('mounts provider without console errors', () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation();
    render(
      <CommandPaletteProvider>
        <div>child</div>
      </CommandPaletteProvider>
    );
    const productionErrors = errorSpy.mock.calls.filter((args) => {
      const first = String(args[0] ?? '');
      return !first.includes('not wrapped in act');
    });
    expect(productionErrors).toEqual([]);
    errorSpy.mockRestore();
  });
});
