/**
 * Jest mock for react-use-websocket.
 *
 * Provides test helpers to control sendJsonMessage, lastMessage, readyState,
 * and to trigger the onOpen callback (simulating reconnect).
 */

import { jest } from '@jest/globals';

export enum ReadyState {
  CONNECTING = 0,
  OPEN = 1,
  CLOSING = 2,
  CLOSED = 3,
}

const mockSendJsonMessage = jest.fn();

let mockReadyState = ReadyState.OPEN;
let mockLastMessage: { data: string } | null = null;
let mockOnOpen: (() => void) | null = null;
let mockOnMessage: ((event: { data: string }) => void) | null = null;

export const useWebSocket = jest.fn(
  (
    _url: string | null,
    options?: {
      onOpen?: () => void;
      onMessage?: (event: { data: string }) => void;
      shouldReconnect?: (event: { code: number }) => boolean;
      reconnectAttempts?: number;
      reconnectInterval?: (attempt: number) => number;
    },
    _connect?: boolean,
  ) => {
    if (options?.onOpen) {
      mockOnOpen = options.onOpen;
    }
    if (options?.onMessage) {
      mockOnMessage = options.onMessage;
    }
    return {
      sendJsonMessage: mockSendJsonMessage,
      lastMessage: mockLastMessage,
      readyState: mockReadyState,
    };
  },
);

/** Test helpers — exported for test control */
export const __mockHelpers = {
  getSendJsonMessage: () => mockSendJsonMessage,
  setReadyState: (state: ReadyState) => {
    mockReadyState = state;
  },
  setLastMessage: (msg: { data: string } | null) => {
    mockLastMessage = msg;
  },
  triggerOnOpen: () => {
    mockOnOpen?.();
  },
  /** Simulate a frame from the server (react-use-websocket calls onMessage per frame) */
  emitMessage: (data: string) => {
    mockOnMessage?.({ data });
  },
  reset: () => {
    mockSendJsonMessage.mockClear();
    mockReadyState = ReadyState.OPEN;
    mockLastMessage = null;
    mockOnOpen = null;
    mockOnMessage = null;
    (useWebSocket as jest.Mock).mockClear();
    (useWebSocket as jest.Mock).mockImplementation(
      (...args: unknown[]) => {
        const options = args[1] as
          | { onOpen?: () => void; onMessage?: (event: { data: string }) => void }
          | undefined;
        if (options?.onOpen) {
          mockOnOpen = options.onOpen;
        }
        if (options?.onMessage) {
          mockOnMessage = options.onMessage;
        }
        return {
          sendJsonMessage: mockSendJsonMessage,
          lastMessage: mockLastMessage,
          readyState: mockReadyState,
        };
      },
    );
  },
};

export default useWebSocket;
