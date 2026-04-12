import type { WsMessage, WsEventType } from "./types.js";

type Client = { send(data: string): void };

const clients = new Set<Client>();

export function addClient(client: Client): void {
  clients.add(client);
}

export function removeClient(client: Client): void {
  clients.delete(client);
}

export function getClientCount(): number {
  return clients.size;
}

export function broadcast(type: WsEventType, payload: unknown): void {
  const message: WsMessage = {
    type,
    payload,
    timestamp: new Date().toISOString(),
  };

  const data = JSON.stringify(message);

  for (const client of clients) {
    client.send(data);
  }
}
