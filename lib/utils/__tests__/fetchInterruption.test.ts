import {
  __resetPageUnloadForTests,
  isFetchInterrupted,
  isPageUnloading,
  trackPageUnload,
} from '../fetchInterruption';

describe('fetchInterruption', () => {
  beforeEach(() => {
    __resetPageUnloadForTests();
    jest.useRealTimers();
  });

  it('treats AbortError as interrupted', () => {
    expect(isFetchInterrupted(new DOMException('aborted', 'AbortError'))).toBe(true);
  });

  it('treats "Failed to fetch" as a real error while the page is alive', () => {
    trackPageUnload();
    expect(isFetchInterrupted(new TypeError('Failed to fetch'))).toBe(false);
  });

  it('treats "Failed to fetch" as interrupted after pagehide', () => {
    trackPageUnload();
    window.dispatchEvent(new Event('pagehide'));
    expect(isPageUnloading()).toBe(true);
    expect(isFetchInterrupted(new TypeError('Failed to fetch'))).toBe(true);
  });

  it('treats "Failed to fetch" as interrupted after beforeunload', () => {
    trackPageUnload();
    window.dispatchEvent(new Event('beforeunload'));
    expect(isFetchInterrupted(new TypeError('Failed to fetch'))).toBe(true);
  });

  it('does not swallow non-network errors during unload', () => {
    trackPageUnload();
    window.dispatchEvent(new Event('pagehide'));
    expect(isFetchInterrupted(new Error('Status fetch failed: 500'))).toBe(false);
  });

  it('clears the unload state on pageshow', () => {
    trackPageUnload();
    window.dispatchEvent(new Event('beforeunload'));
    window.dispatchEvent(new Event('pageshow'));
    expect(isPageUnloading()).toBe(false);
  });

  it('expires the unload window when the navigation never happens', () => {
    jest.useFakeTimers();
    trackPageUnload();
    window.dispatchEvent(new Event('beforeunload'));
    jest.advanceTimersByTime(6000);
    expect(isFetchInterrupted(new TypeError('Failed to fetch'))).toBe(false);
  });
});
