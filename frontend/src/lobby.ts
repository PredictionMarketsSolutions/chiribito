import type { Client, Room } from "@colyseus/sdk";

export type AvailableRoom = {
  roomId: string;
  clients: number;
  maxClients: number;
  metadata?: any;
};

export type LobbyDeps = {
  getWsClient: () => Client;
  setLobbyMessage: (message: string, type?: "success" | "error" | "info") => void;
  log: (message: string) => void;
  roomsList: HTMLUListElement;
  onJoinRoom: (roomId: string) => void;
};

export function renderLobbyRooms(
  rooms: AvailableRoom[],
  roomsList: HTMLUListElement,
  onJoinRoom: (roomId: string) => void,
  log: (message: string) => void
): void {
  roomsList.innerHTML = "";

  if (!rooms.length) {
    const li = document.createElement("li");
    li.className = "room-item room-item-empty";
    li.textContent = "Todavía no hay mesas disponibles.";
    roomsList.appendChild(li);
    return;
  }

  rooms.forEach((r, index) => {
    const li = document.createElement("li");
    li.className = "room-item";

    const meta = document.createElement("div");
    meta.className = "room-meta";

    const name = document.createElement("strong");
    name.textContent = r.metadata?.name || `Mesa ${index + 1}`;

    const sub = document.createElement("small");
    sub.textContent = `${r.clients}/${r.maxClients} jugadores · id ${r.roomId}`;

    meta.appendChild(name);
    meta.appendChild(sub);

    const btn = document.createElement("button");
    btn.className = "accent";
    btn.textContent = "Unirme";
    btn.disabled = r.clients >= r.maxClients;
    btn.addEventListener("click", () => {
      onJoinRoom(r.roomId);
    });

    li.appendChild(meta);
    li.appendChild(btn);
    roomsList.appendChild(li);
  });
}

export async function refreshLobbyRooms(
  deps: LobbyDeps,
  showLoading: boolean = true
): Promise<void> {
  const { getWsClient, setLobbyMessage, log, roomsList, onJoinRoom } = deps;
  let lobbyRoom: Room | null = null;
  try {
    if (showLoading) {
      setLobbyMessage("Cargando mesas...", "info");
    }
    const client = getWsClient();
    lobbyRoom = await client.joinOrCreate("lobby", {
      filter: { name: "mesa" }
    } as any);
    const roomsPayload = await new Promise<AvailableRoom[]>((resolve, reject) => {
      const t = setTimeout(() => reject(new Error("Lobby timeout")), 10000);
      lobbyRoom!.onMessage("rooms", (list: any) => {
        clearTimeout(t);
        const items = Array.isArray(list) ? list : [];
        resolve(
          items
            .filter((r: any) => r && typeof r?.roomId === "string" && r.roomId.length > 0)
            .map((r: any) => ({
              roomId: r.roomId,
              clients: typeof r.clients === "number" ? r.clients : 0,
              maxClients: typeof r.maxClients === "number" ? r.maxClients : 6,
              metadata: r.metadata && typeof r.metadata === "object" ? r.metadata : undefined
            }))
        );
      });
      // Request list so we get "rooms" even if the initial send was already delivered
      lobbyRoom!.send("filter", { name: "mesa" });
    });
    const sorted = [...roomsPayload].sort((a, b) => (b.clients ?? 0) - (a.clients ?? 0));
    renderLobbyRooms(sorted, roomsList, onJoinRoom, log);
    if (showLoading) {
      setLobbyMessage("", "info");
    }
  } catch (err: any) {
    setLobbyMessage("No se pudieron cargar las mesas.", "error");
    renderLobbyRooms([], roomsList, onJoinRoom, log);
    log(`Lobby rooms error: ${err?.message || err}`);
  } finally {
    if (lobbyRoom) {
      await lobbyRoom.leave().catch(() => {});
    }
  }
}

