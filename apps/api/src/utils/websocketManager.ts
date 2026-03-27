export const activeConnections = new Map<string, any>(); // Map de CODCLI -> connection

export function sendToUser(codcli: number | string, data: any) {
  const conn = activeConnections.get(String(codcli));
  if (conn) {
    conn.socket.send(JSON.stringify(data));
    return true;
  }
  return false;
}

export function broadcast(data: any) {
  let count = 0;
  for (const conn of activeConnections.values()) {
    conn.socket.send(JSON.stringify(data));
    count++;
  }
  return count;
}
