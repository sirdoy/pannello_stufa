import { render, act } from '@testing-library/react';
import AmbientBg from '../AmbientBg';

describe('AmbientBg (Phase 174 — DS-05)', () => {
  beforeEach(() => {
    delete document.documentElement.dataset.ambient;
  });

  it('renders nothing when data-ambient is unset (D-14 default OFF)', () => {
    const { container } = render(<AmbientBg />);
    expect(container.firstChild).toBeNull();
  });

  it('renders 3 blob divs when data-ambient="on" at mount', () => {
    document.documentElement.dataset.ambient = 'on';
    const { container } = render(<AmbientBg />);
    const wrapper = container.querySelector('[aria-hidden="true"]');
    expect(wrapper).not.toBeNull();
    const blobs = container.querySelectorAll('.ember-ambient-blob');
    expect(blobs.length).toBe(3);
  });

  it('responds to ember-glass-ambient-change event with detail=true', () => {
    const { container } = render(<AmbientBg />);
    expect(container.firstChild).toBeNull();
    act(() => {
      window.dispatchEvent(new CustomEvent<boolean>('ember-glass-ambient-change', { detail: true }));
    });
    const blobs = container.querySelectorAll('.ember-ambient-blob');
    expect(blobs.length).toBe(3);
  });

  it('responds to ember-glass-ambient-change event with detail=false', () => {
    document.documentElement.dataset.ambient = 'on';
    const { container } = render(<AmbientBg />);
    expect(container.querySelectorAll('.ember-ambient-blob').length).toBe(3);
    act(() => {
      window.dispatchEvent(new CustomEvent<boolean>('ember-glass-ambient-change', { detail: false }));
    });
    expect(container.firstChild).toBeNull();
  });

  it('wrapper has aria-hidden="true" (decorative)', () => {
    document.documentElement.dataset.ambient = 'on';
    const { container } = render(<AmbientBg />);
    const wrapper = container.querySelector('[aria-hidden="true"]');
    expect(wrapper).not.toBeNull();
  });

  it('cleans up event listener on unmount', () => {
    const removeSpy = jest.spyOn(window, 'removeEventListener');
    const { unmount } = render(<AmbientBg />);
    unmount();
    expect(removeSpy).toHaveBeenCalledWith('ember-glass-ambient-change', expect.any(Function));
    removeSpy.mockRestore();
  });

  it('mounts without console errors', () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    document.documentElement.dataset.ambient = 'on';
    render(<AmbientBg />);
    act(() => {
      window.dispatchEvent(new CustomEvent<boolean>('ember-glass-ambient-change', { detail: false }));
    });
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
