import type * as Party from "partykit/server";

interface LobbyEntry {
  id: string;
  playerCount: number;
  phase: string;
  lastSeen: number;
}

const MAX_LOBBY_AGE_MS = 2 * 60 * 60 * 1000; // 2 hours
const MAX_PLAYERS = 20;

export default class RegistryParty implements Party.Server {
  lobbies: Map<string, LobbyEntry> = new Map();

  constructor(readonly room: Party.Room) {}

  async onRequest(req: Party.Request): Promise<Response> {
    this.pruneStale();

    if (req.method === "POST") {
      let body: { action?: string; lobbyId?: string; playerCount?: number; phase?: string } = {};
      try {
        body = await req.json();
      } catch {
        // treat as lobby request
      }

      if (body.action === "UPDATE" && body.lobbyId) {
        // Game party reporting its status
        this.lobbies.set(body.lobbyId, {
          id: body.lobbyId,
          playerCount: body.playerCount ?? 0,
          phase: body.phase ?? "lobby",
          lastSeen: Date.now(),
        });
        return new Response("OK");
      }

      // Default: find or create an open lobby
      const partyId = this.findOrCreate();
      return Response.json({ partyId });
    }

    // GET: return lobby list for debugging
    const list = Array.from(this.lobbies.values());
    return Response.json(list);
  }

  onConnect() {}
  onMessage() {}
  onClose() {}

  private findOrCreate(): string {
    for (const lobby of this.lobbies.values()) {
      if (lobby.phase === "lobby" && lobby.playerCount < MAX_PLAYERS) {
        return lobby.id;
      }
    }
    const id = `pub_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    this.lobbies.set(id, { id, playerCount: 0, phase: "lobby", lastSeen: Date.now() });
    return id;
  }

  private pruneStale() {
    const cutoff = Date.now() - MAX_LOBBY_AGE_MS;
    for (const [id, entry] of this.lobbies) {
      if (entry.lastSeen < cutoff) this.lobbies.delete(id);
    }
  }
}

RegistryParty satisfies Party.Worker;
