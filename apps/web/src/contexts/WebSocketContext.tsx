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
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!token) return;

    // Constrói a URL do WebSocket de forma robusta
    const base = apiBaseUrl?.replace(/\/+$/, '') || '';
    let wsUrl = '';
    
    if (base.startsWith('https://')) {
      wsUrl = base.replace('https://', 'wss://');
    } else if (base.startsWith('http://')) {
      wsUrl = base.replace('http://', 'ws://');
    } else {
      // Caso não possua http/https, define wss ou ws
      wsUrl = base.includes('localhost') || base.includes('127.0.0.1')
        ? `ws://${base}`
        : `wss://${base}`;
    }
    
    // Anexa o caminho e o token
    wsUrl += `/ws?token=${token}`;

    const connect = () => {
      try {
        const socket = new WebSocket(wsUrl);
        ws.current = socket;

        socket.onopen = () => {
          setIsConnected(true);
          console.log('[WebSocket] Conectado ao servidor.');
        };

        socket.onmessage = (event) => {
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

        socket.onclose = () => {
          setIsConnected(false);
          console.log('[WebSocket] Desconectado. Tentando reconectar em 5 segundos...');
          reconnectTimeout.current = setTimeout(connect, 5000);
        };

        socket.onerror = (err) => {
          console.error('[WebSocket] Erro na conexão:', err);
        };
      } catch (err) {
        console.error('[WebSocket] Erro síncrono ao criar WebSocket:', err);
        // Tenta reconectar mais tarde mesmo se falhar a criação (ex: erro temporário de DNS/URL)
        reconnectTimeout.current = setTimeout(connect, 5000);
      }
    };

    connect();

    return () => {
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
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

