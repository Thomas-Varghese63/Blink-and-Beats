// src/hooks/useWebSocket.ts

import { useEffect, useRef, useState, useCallback } from 'react';
import { AudioData, LevelState, WebSocketMessage } from '../shared/schema';

interface UseWebSocketReturn {
  audioData: AudioData | null;
  levelState: LevelState | null;
  isConnected: boolean;
  connectionError: string | null;
  sendMessage: (message: any) => void;
}

export function useWebSocket(): UseWebSocketReturn {
  const [audioData, setAudioData] = useState<AudioData | null>(null);
  const [levelState, setLevelState] = useState<LevelState | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);
  const reconnectAttempts = useRef(0);

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify(message));
      } catch (error) {
        console.error('Error sending message:', error);
      }
    }
  }, []);

  const connect = useCallback(() => {
    try {
      const wsUrl = `ws://localhost:3001/ws`;

      console.log('Connecting to WebSocket:', wsUrl);

      // Close existing connection if any before creating a new one
      if (wsRef.current) {
        wsRef.current.onopen = null;
        wsRef.current.onmessage = null;
        wsRef.current.onclose = null;
        wsRef.current.onerror = null;
        wsRef.current.close();
        wsRef.current = null;
      }

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setConnectionError(null);
        reconnectAttempts.current = 0;

        // Send initial ping
        sendMessage({ type: 'ping', timestamp: Date.now() });
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);

          switch (message.type) {
            case 'audio_data':
              setAudioData(message.data);
              break;
            case 'level_state':
              setLevelState(message.data);
              break;
            case 'iot_data':
              console.log('IoT data received:', message.data);
              break;
            case 'configuration':
              console.log('Configuration update:', message.data);
              break;
            case 'status':
              console.log('Status message:', message.data);
              break;
            default:
              console.log('Unknown message type:', message.type);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

     ws.onclose = (event) => {
  // Ignore harmless early closes (React StrictMode, hot reload, etc.)
  if (event.code === 1006 && !event.wasClean && !isConnected) {
    return;
  }

  console.log('WebSocket disconnected:', event.code, event.reason);
  setIsConnected(false);
  wsRef.current = null;

        // Attempt to reconnect with exponential backoff
        if (reconnectAttempts.current < 10) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          reconnectAttempts.current++;

          reconnectTimeoutRef.current = setTimeout(() => {
            console.log(`Reconnecting (attempt ${reconnectAttempts.current})...`);
            connect();
          }, delay);
        } else {
          setConnectionError('Failed to connect after multiple attempts');
        }
      };

      ws.onerror = (event) => {
        console.error("WebSocket error:", event);
      };
    } catch (error) {
      console.error("WebSocket connection failed:", error);
    }
  }, [sendMessage]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  return {
    audioData,
    levelState,
    isConnected,
    connectionError,
    sendMessage,
  };
}
