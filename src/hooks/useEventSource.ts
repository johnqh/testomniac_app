/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useRef, useState, useCallback } from 'react';
import type { RunStreamEvent } from '@sudobility/testomniac_types';

interface UseEventSourceConfig {
  url: string | null;
  onEvent: (event: RunStreamEvent) => void;
  onError?: (error: string) => void;
  reconnectIntervalMs?: number;
}

interface UseEventSourceReturn {
  isConnected: boolean;
  error: string | null;
  disconnect: () => void;
}

export function useEventSource(config: UseEventSourceConfig): UseEventSourceReturn {
  const { url, onEvent, onError, reconnectIntervalMs = 3000 } = config;
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const esRef = useRef<EventSource | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onEventRef = useRef(onEvent);
  const onErrorRef = useRef(onError);
  onEventRef.current = onEvent;
  onErrorRef.current = onError;

  const disconnect = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }
    setIsConnected(false);
  }, []);

  useEffect(() => {
    if (!url) {
      disconnect();
      return;
    }

    function connect() {
      const es = new EventSource(url!);
      esRef.current = es;

      es.onopen = () => {
        setIsConnected(true);
        setError(null);
      };

      es.onmessage = event => {
        try {
          const data = JSON.parse(event.data) as RunStreamEvent;
          onEventRef.current(data);
        } catch {
          // Ignore unparseable messages
        }
      };

      es.onerror = () => {
        setIsConnected(false);
        setError('Connection lost');
        onErrorRef.current?.('Connection lost');
        es.close();
        esRef.current = null;
        reconnectTimerRef.current = setTimeout(connect, reconnectIntervalMs);
      };
    }

    connect();

    return () => {
      disconnect();
    };
  }, [url, reconnectIntervalMs, disconnect]);

  return { isConnected, error, disconnect };
}
