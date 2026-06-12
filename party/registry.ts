import type * as Party from "partykit/server";

interface LobbyEntry {
  id: string;
  playerCount: number;
  maxPlayers: number;
  phase: string;
  roundSeconds: number;
  abilitiesEnabled: boolean;
  listedPublicly?: boolean;
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
      let body: {
        action?: string;
        lobbyId?: string;
        playerCount?: number;
        maxPlayers?: number;
        phase?: string;
        roundSeconds?: number;
        abilitiesEnabled?: boolean;
        listedPublicly?: boolean;
      } = {};
      try {
        body = await req.json();
      } catch {
        // treat as lobby request
      }

      if (body.action === "REMOVE" && body.lobbyId) {
        this.lobbies.delete(body.lobbyId);
        return new Response("OK");
      }

      if (body.action === "UPDATE" && body.lobbyId) {
        const existing = this.lobbies.get(body.lobbyId);
        this.lobbies.set(body.lobbyId, {
          id: body.lobbyId,
          playerCount: body.playerCount ?? existing?.playerCount ?? 0,
          maxPlayers: body.maxPlayers ?? existing?.maxPlayers ?? 20,
          phase: body.phase ?? existing?.phase ?? "lobby",
          roundSeconds: body.roundSeconds ?? existing?.roundSeconds ?? 30,
          abilitiesEnabled: body.abilitiesEnabled ?? existing?.abilitiesEnabled ?? true,
          listedPublicly: body.listedPublicly ?? existing?.listedPublicly,
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
    this.lobbies.set(id, {
      id, playerCount: 0, maxPlayers: MAX_PLAYERS,
      phase: "lobby", roundSeconds: 30, abilitiesEnabled: true, lastSeen: Date.now(),
    });
    return id;
  }

  private pruneStale() {
    const cutoff = Date.now() - MAX_LOBBY_AGE_MS;
    const emptyCutoff = Date.now() - 5 * 60 * 1000;
    for (const [id, entry] of this.lobbies) {
      if (entry.lastSeen < cutoff) { this.lobbies.delete(id); continue; }
      if (entry.phase === "ended") { this.lobbies.delete(id); continue; }
      if (entry.playerCount === 0 && entry.lastSeen < emptyCutoff) this.lobbies.delete(id);
    }
  }
}

RegistryParty satisfies Party.Worker;
