import { act } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import ApiDebugPage from '../page';

jest.mock('@/app/debug/components/tabs/StoveTab', () => () => null);
jest.mock('@/app/debug/components/tabs/NetatmoTab', () => () => null);
jest.mock('@/app/debug/components/tabs/HueTab', () => () => null);
jest.mock('@/app/debug/components/tabs/WeatherTab', () => () => null);
jest.mock('@/app/debug/components/tabs/FirebaseTab', () => () => null);
jest.mock('@/app/debug/components/tabs/SchedulerTab', () => () => null);

describe('ApiDebugPage', () => {
  // jsdom runs on localhost: the client sees DEV, the server snapshot is always PROD (workspace ROADMAP T12)
  it('hydrates without a server/client text mismatch', async () => {
    const html = renderToString(<ApiDebugPage />);
    expect(html).toContain('PROD');

    const container = document.createElement('div');
    container.innerHTML = html;
    document.body.appendChild(container);
    const recoverable: unknown[] = [];
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

    await act(async () => {
      hydrateRoot(container, <ApiDebugPage />, { onRecoverableError: (e) => recoverable.push(e) });
    });

    expect(recoverable).toEqual([]);
    const hydrationLogs = consoleError.mock.calls.filter((c) => /hydrat/i.test(String(c[0])));
    expect(hydrationLogs).toEqual([]);
    expect(container.textContent).toContain('DEV');
    consoleError.mockRestore();
    container.remove();
  });

  it('opens the tab named in the URL hash', async () => {
    window.location.hash = '#hue';
    const container = document.createElement('div');
    container.innerHTML = renderToString(<ApiDebugPage />);
    document.body.appendChild(container);

    await act(async () => {
      hydrateRoot(container, <ApiDebugPage />);
    });

    expect(window.location.hash).toBe('#hue');
    expect(container.querySelector('[role="tab"][data-state="active"]')).toHaveTextContent('Hue');
    container.remove();
    window.location.hash = '';
  });
});
