'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

interface WebSocketContextData {
  isConnected: boolean;
}

const WebSocketContext = createContext<WebSocketContextData>({ isConnected: false });

export function WebSocketProvider({ children, token, apiBaseUrl }: { children: React.ReactNode, token?: string, apiBaseUrl: string }) {
  const [isConnected, setIsConnected] = useState(false);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!token) return;

    // Converte http://localhost:4001 para ws://localhost:4001
    const wsUrl = apiBaseUrl.replace(/^http/, 'ws') + `/ws?token=${token}`;

    const connect = () => {
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        setIsConnected(true);
        console.log('[WebSocket] Conectado ao servidor.');
      };

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'NOTIFICATION') {
            toast.info(data.message, {
              duration: 5000,
              position: 'bottom-right',
            });
          }
        } catch (err) {
          console.error('[WebSocket] Erro ao fazer parse da mensagem', err);
        }
      };

      ws.current.onclose = () => {
        setIsConnected(false);
        console.log('[WebSocket] Desconectado. Tentando reconectar em 5 segundos...');
        setTimeout(connect, 5000);
      };

      ws.current.onerror = (err) => {
        console.error('[WebSocket] Erro na conexão:', err);
      };
    };

    connect();

    return () => {
      if (ws.current) {
        ws.current.onclose = null; // evita reconexão no unmount
        ws.current.close();
      }
    };
  }, [token, apiBaseUrl]);

  return (
    <WebSocketContext.Provider value={{ isConnected }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export const useWebSocket = () => useContext(WebSocketContext);
