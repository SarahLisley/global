import { FastifyInstance, FastifyRequest } from 'fastify';
import { activeConnections } from '../utils/websocketManager';
import { verifyToken } from '../utils/token';
import { env } from '../utils/env';

export default async function websocketRoutes(app: FastifyInstance) {
  // Configurando a rota WebSocket
  app.get('/', { websocket: true }, (connection: any, req: FastifyRequest) => {
    // Pegar o token da query string: ws://localhost:4001/ws?token=XYZ
    const token = (req.query as any)?.token;
    if (!token) {
      connection.socket.send(JSON.stringify({ error: 'Missing token' }));
      return connection.socket.close();
    }

    try {
      const decoded = verifyToken(token, env.JWT_SECRET);
      if (!decoded.ok || !decoded.payload?.codcli) {
        throw new Error('Invalid token or missing codcli');
      }

      const codcli = String(decoded.payload.codcli);
      
      // Armazena a conexão do cliente
      activeConnections.set(codcli, connection);
      
      connection.socket.send(JSON.stringify({ type: 'CONNECTED', message: 'WebSocket Connected Successfully' }));

      connection.socket.on('message', (message: any) => {
        // Handle incoming messages from client se necessário (ex: PING)
        try {
          const msg = JSON.parse(message.toString());
          if (msg.type === 'PING') {
            connection.socket.send(JSON.stringify({ type: 'PONG' }));
          }
        } catch {
          // ignora JSON inválido
        }
      });

      connection.socket.on('close', () => {
        // Remover a conexão quando fechar
        if (activeConnections.get(codcli) === connection) {
          activeConnections.delete(codcli);
        }
      });

    } catch (err: any) {
      connection.socket.send(JSON.stringify({ error: 'Authentication failed', details: err.message }));
      connection.socket.close();
    }
  });

  // Rota de Teste para simular notificação (apenas para debug)
  app.post('/test-broadcast', async (req, reply) => {
    const { codcli, message } = req.body as any;
    const { sendToUser, broadcast } = await import('../utils/websocketManager');
    
    if (codcli) {
      const sent = sendToUser(codcli, { type: 'NOTIFICATION', message });
      return reply.send({ success: sent, message: sent ? 'Sent to user' : 'User offline' });
    } else {
      const count = broadcast({ type: 'NOTIFICATION', message });
      return reply.send({ success: true, broadcastCount: count });
    }
  });
}
