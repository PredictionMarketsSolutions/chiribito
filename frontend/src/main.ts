import { Client, Room } from "colyseus.js";
import type * as PixiModule from "pixi.js";

const API_URL = import.meta.env.VITE_API_URL || "https://chiri-backend.onrender.com";
const WS_URL = import.meta.env.VITE_WS_URL || "wss://chiri-backend-colyseus.onrender.com";

const logEl = document.querySelector<HTMLPreElement>("#log")!;
const tokenStatus = document.querySelector<HTMLSpanElement>("#token-status")!;
const roomStatus = document.querySelector<HTMLSpanElement>("#room-status")!;
const phaseStatus = document.querySelector<HTMLSpanElement>("#phase-status")!;
const turnStatus = document.querySelector<HTMLSpanElement>("#turn-status")!;
const potStatus = document.querySelector<HTMLSpanElement>("#pot-status")!;
const betStatus = document.querySelector<HTMLSpanElement>("#bet-status")!;
const communityStatus = document.querySelector<HTMLSpanElement>("#community-status")!;
const handStatus = document.querySelector<HTMLSpanElement>("#hand-status")!;
const winningHandStatus = document.querySelector<HTMLSpanElement>("#winning-hand")!;
const winnersStatus = document.querySelector<HTMLSpanElement>("#winners-status")!;
const communityCardsEl = document.querySelector<HTMLDivElement>("#community-cards")!;
const handCardsEl = document.querySelector<HTMLDivElement>("#hand-cards")!;
const potChip = document.querySelector<HTMLSpanElement>("#pot-chip")!;
const phaseChip = document.querySelector<HTMLSpanElement>("#phase-chip")!;
const turnChip = document.querySelector<HTMLSpanElement>("#turn-chip")!;
const winningHandChip = document.querySelector<HTMLSpanElement>("#winning-hand-chip")!;
const seatsEl = document.querySelector<HTMLDivElement>("#seats")!;
const playersList = document.querySelector<HTMLUListElement>("#players")!;
const apiUrlEl = document.querySelector<HTMLSpanElement>("#api-url")!;
const wsUrlEl = document.querySelector<HTMLSpanElement>("#ws-url")!;
const startGameButton = document.querySelector<HTMLButtonElement>("#start-game")!;
const checkButton = document.querySelector<HTMLButtonElement>("#check")!;
const callButton = document.querySelector<HTMLButtonElement>("#call")!;
const foldButton = document.querySelector<HTMLButtonElement>("#fold")!;
const betButton = document.querySelector<HTMLButtonElement>("#bet")!;
const raiseButton = document.querySelector<HTMLButtonElement>("#raise")!;

apiUrlEl.textContent = API_URL;
wsUrlEl.textContent = WS_URL;
void initPixiLayer();

function log(message: string) {
  const ts = new Date().toLocaleTimeString();
  logEl.textContent = `[${ts}] ${message}\n` + logEl.textContent;
}

async function request(path: string, body: unknown) {
  const response = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(text || response.statusText);
  }
  return JSON.parse(text);
}

function getFormValues() {
  const username = (document.querySelector("#username") as HTMLInputElement).value.trim() || "test1";
  const email = (document.querySelector("#email") as HTMLInputElement).value.trim() || "test1@example.com";
  const password = (document.querySelector("#password") as HTMLInputElement).value || "123456";
  return { username, email, password };
}

let token: string | null = null;
let room: Room | null = null;
let currentSessionId: string | null = null;
let lastWinningHand = "-";
let lastWinners: string[] = [];
let tokenMonitorId: number | null = null;
let tokenInvalidNotified = false;
let pixiApp: PixiModule.Application | null = null;
let pixiLayer: HTMLDivElement | null = null;
let pixiTableSurface: HTMLDivElement | null = null;
let previousCommunityCards: string[] = [];
let previousHandCards: string[] = [];
let pixiLib: typeof PixiModule | null = null;

type PlayerState = {
  sessionId: string;
  name: string;
  chips: number;
  currentBet: number;
  isFolded: boolean;
  hand?: string[];
};

type RoomState = {
  users?: Map<string, PlayerState> | Record<string, PlayerState>;
  dealerIndex?: number;
  currentTurn?: string;
  phase?: string;
  pot?: number;
  currentBet?: number;
  roundStarted?: boolean;
  communityCards?: string[];
};

function getUserEntries(state: RoomState): PlayerState[] {
  const users = state?.users;
  if (!users) return [];
  if (users instanceof Map) return Array.from(users.values());
  const iterableUsers = users as unknown as { values?: () => Iterable<PlayerState> };
  if (typeof iterableUsers.values === "function") {
    return Array.from(iterableUsers.values());
  }
  return Object.values(users);
}

async function initPixiLayer() {
  pixiTableSurface = document.querySelector<HTMLDivElement>(".table-surface");
  if (!pixiTableSurface) return;

  if (!pixiLib) {
    pixiLib = await import("pixi.js");
  }

  pixiLayer = document.createElement("div");
  pixiLayer.id = "pixi-layer";
  pixiTableSurface.appendChild(pixiLayer);

  pixiApp = new pixiLib.Application({
    width: pixiTableSurface.clientWidth,
    height: pixiTableSurface.clientHeight,
    backgroundAlpha: 0,
    antialias: true
  });

  const canvas = (pixiApp as unknown as { view?: HTMLCanvasElement; canvas?: HTMLCanvasElement }).view
    ?? (pixiApp as unknown as { canvas?: HTMLCanvasElement }).canvas;
  if (canvas) {
    pixiLayer.appendChild(canvas);
  }

  window.addEventListener("resize", () => {
    if (!pixiApp || !pixiTableSurface) return;
    pixiApp.renderer.resize(pixiTableSurface.clientWidth, pixiTableSurface.clientHeight);
  });
}

function getElementCenterInTable(element: HTMLElement) {
  if (!pixiTableSurface) return { x: 0, y: 0 };
  const tableRect = pixiTableSurface.getBoundingClientRect();
  const rect = element.getBoundingClientRect();
  return {
    x: rect.left - tableRect.left + rect.width / 2,
    y: rect.top - tableRect.top + rect.height / 2
  };
}

function getDeckPosition() {
  if (!pixiTableSurface) return { x: 0, y: 0 };
  return {
    x: pixiTableSurface.clientWidth / 2,
    y: 80
  };
}

function getCardTexture(card: string) {
  if (!pixiLib) return null;
  const suit = card.slice(-1);
  const rank = card.slice(0, -1);
  return pixiLib.Texture.from(`/cards/${suit}_${rank}.jpg`);
}

function createCardSprite(targetEl: HTMLElement) {
  if (!pixiLib) return null;
  const rect = targetEl.getBoundingClientRect();
  const sprite = new pixiLib.Sprite(pixiLib.Texture.from("/cards/back.svg"));
  sprite.anchor.set(0.5);
  sprite.width = rect.width;
  sprite.height = rect.height;
  return sprite;
}

function tweenSprite(
  sprite: PixiModule.Sprite,
  from: { x: number; y: number },
  to: { x: number; y: number },
  durationMs: number,
  delayMs: number,
  onComplete?: () => void
) {
  if (!pixiApp) return;
  const startAt = performance.now() + delayMs;
  const endAt = startAt + durationMs;
  const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

  const update = () => {
    const now = performance.now();
    if (now < startAt) return;
    const t = Math.min((now - startAt) / durationMs, 1);
    const eased = easeOut(t);
    sprite.x = from.x + (to.x - from.x) * eased;
    sprite.y = from.y + (to.y - from.y) * eased;
    if (t >= 1) {
      pixiApp?.ticker.remove(update);
      onComplete?.();
    }
  };

  pixiApp.ticker.add(update);
}

function flipSprite(sprite: PixiModule.Sprite, frontTexture: PixiModule.Texture, durationMs = 280) {
  if (!pixiApp) return;
  const half = durationMs / 2;
  const startAt = performance.now();
  const update = () => {
    const now = performance.now();
    const elapsed = now - startAt;
    if (elapsed <= half) {
      const t = Math.min(elapsed / half, 1);
      sprite.scale.x = 1 - t;
    } else {
      if (sprite.texture !== frontTexture) {
        sprite.texture = frontTexture;
      }
      const t = Math.min((elapsed - half) / half, 1);
      sprite.scale.x = t;
      if (t >= 1) {
        pixiApp?.ticker.remove(update);
      }
    }
  };
  pixiApp.ticker.add(update);
}

function animateCardDeals(
  containerEl: HTMLElement,
  cards: string[],
  previousCards: string[]
) {
  const app = pixiApp;
  if (!app || !pixiLayer || !pixiTableSurface || !pixiLib) return;
  const cardEls = Array.from(containerEl.querySelectorAll<HTMLElement>(".card"));
  const deckPos = getDeckPosition();

  cards.forEach((card, index) => {
    if (!card) return;
    if (previousCards[index] === card) return;
    const targetEl = cardEls[index];
    if (!targetEl) return;

    const target = getElementCenterInTable(targetEl);
    const sprite = createCardSprite(targetEl);
    if (!sprite) return;
    sprite.x = deckPos.x;
    sprite.y = deckPos.y;
    sprite.rotation = -0.08;
    app.stage.addChild(sprite);

    tweenSprite(sprite, deckPos, target, 420, index * 90, () => {
      sprite.rotation = 0;
      const texture = getCardTexture(card);
      if (texture) {
        flipSprite(sprite, texture);
      }
      window.setTimeout(() => {
        app.stage.removeChild(sprite);
        sprite.destroy();
      }, 420);
    });
  });
}

function resetRoomUi(message?: string) {
  room = null;
  currentSessionId = null;
  lastWinningHand = "-";
  lastWinners = [];
  roomStatus.textContent = message || "not joined";
  phaseStatus.textContent = "waiting";
  turnStatus.textContent = "-";
  potStatus.textContent = "0";
  betStatus.textContent = "0";
  communityStatus.textContent = "-";
  handStatus.textContent = "-";
  winningHandStatus.textContent = "-";
  winnersStatus.textContent = "-";
  potChip.textContent = "0";
  phaseChip.textContent = "waiting";
  turnChip.textContent = "-";
  winningHandChip.textContent = "-";
  renderCardRow(communityCardsEl, [], 5);
  renderCardRow(handCardsEl, [], 2);
  playersList.innerHTML = "";
  renderSeats({ users: new Map(), dealerIndex: -1, currentTurn: "" });
  updateActionButtons(null);
}

function clearAuthToken() {
  token = null;
  tokenStatus.textContent = "none";
  stopTokenMonitor();
  tokenInvalidNotified = false;
}

function stopTokenMonitor() {
  if (tokenMonitorId !== null) {
    window.clearInterval(tokenMonitorId);
    tokenMonitorId = null;
  }
}

function handleTokenInvalidated() {
  if (tokenInvalidNotified) return;
  tokenInvalidNotified = true;
  clearAuthToken();
  resetRoomUi("logged out");
  alert("Se ha iniciado sesion en otro dispositivo. Por favor, vuelve a iniciar sesion.");
}

function startTokenMonitor() {
  stopTokenMonitor();
  if (!token) return;
  tokenMonitorId = window.setInterval(async () => {
    if (!token) return;
    try {
      const response = await fetch(`${API_URL}/api/auth/validate`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!response.ok) {
        handleTokenInvalidated();
      }
    } catch {
      // Ignore transient network errors
    }
  }, 15000);
}

function preloadCardImages() {
  const suits = ["O", "C", "E", "B"];
  const ranks = ["1", "8", "9", "10", "11", "12"];
  const sources = ["/cards/back.svg"];

  suits.forEach(suit => {
    ranks.forEach(rank => {
      sources.push(`/cards/${suit}_${rank}.jpg`);
    });
  });

  sources.forEach(src => {
    const img = new Image();
    img.decoding = "async";
    img.src = src;
  });
}

function createCardElement(card: string | undefined) {
  const el = document.createElement("div");
  el.classList.add("card");

  const img = document.createElement("img");
  img.alt = card ? `Carta ${card}` : "Carta oculta";
  img.decoding = "async";
  img.loading = "eager";

  if (!card) {
    img.src = "/cards/back.svg";
    img.addEventListener("load", () => el.classList.add("has-image"));
    img.addEventListener("error", () => {
      el.classList.add("back");
      el.innerHTML = "<span class=\"rank\">?</span><span class=\"suit\">?</span>";
    });
    el.appendChild(img);
    return el;
  }

  const suit = card.slice(-1);
  const rank = card.slice(0, -1);
  img.src = `/cards/${suit}_${rank}.jpg`;
  img.addEventListener("load", () => el.classList.add("has-image"));
  img.addEventListener("error", () => {
    const suitMap: Record<string, { symbol: string; color: string }> = {
      O: { symbol: "◆", color: "red" },
      C: { symbol: "♥", color: "red" },
      E: { symbol: "♠", color: "black" },
      B: { symbol: "♣", color: "black" }
    };

    const rankMap: Record<string, string> = {
      "1": "1",
      "10": "S",
      "11": "C",
      "12": "R"
    };

    const suitInfo = suitMap[suit] ?? { symbol: suit, color: "black" };
    el.classList.add(suitInfo.color);
    const displayRank = rankMap[rank] ?? rank;
    el.innerHTML = `<span class="rank">${displayRank}</span><span class="suit">${suitInfo.symbol}</span>`;
  });
  el.appendChild(img);
  return el;
}

function renderCardRow(el: HTMLElement, cards: string[], slots: number) {
  el.innerHTML = "";
  for (let i = 0; i < slots; i += 1) {
    const card = cards[i];
    const cardEl = createCardElement(card);
    cardEl.classList.add("deal");
    cardEl.style.animationDelay = `${i * 0.08}s`;
    el.appendChild(cardEl);
  }
}


function renderSeats(state: RoomState) {
  const entries = getUserEntries(state);
  const dealerIndex = typeof state?.dealerIndex === "number" ? state.dealerIndex : -1;
  const currentTurn = state?.currentTurn ?? "";

  const seats = Array.from(seatsEl.querySelectorAll<HTMLDivElement>(".seat"));
  seats.forEach((seat, index) => {
    const nameEl = seat.querySelector<HTMLDivElement>(".seat-name");
    const metaEl = seat.querySelector<HTMLDivElement>(".seat-meta");
    const player = entries[index];

    if (!nameEl || !metaEl) return;

    if (!player) {
      seat.classList.remove("active", "you", "folded");
      seat.classList.remove("dealer", "turn", "winner");
      nameEl.textContent = "Libre";
      metaEl.textContent = "";
      return;
    }

    const isYou = currentSessionId && player.sessionId === currentSessionId;
    seat.classList.toggle("active", true);
    seat.classList.toggle("you", Boolean(isYou));
    seat.classList.toggle("folded", Boolean(player.isFolded));
    seat.classList.toggle("dealer", index === dealerIndex);
    seat.classList.toggle("turn", player.sessionId === currentTurn);
    seat.classList.toggle("winner", lastWinners.includes(player.sessionId));
    nameEl.textContent = `${player.name}${isYou ? " (tu)" : ""}`;
    metaEl.textContent = `Chips ${player.chips} | Bet ${player.currentBet}`;
  });
}

function renderPlayers(state: RoomState) {
  playersList.innerHTML = "";
  if (!state || !state.users) return;

  const entries = getUserEntries(state);

  entries.forEach((player: any) => {
    const li = document.createElement("li");
    const isYou = currentSessionId && player.sessionId === currentSessionId ? " (you)" : "";
    li.textContent = `${player.name}${isYou} | chips: ${player.chips} | bet: ${player.currentBet}${player.isFolded ? " | folded" : ""}`;
    playersList.appendChild(li);
  });
}

function renderState(state: RoomState) {
  if (!state) return;
  phaseStatus.textContent = state.phase ?? "-";
  const entries = getUserEntries(state);
  const currentTurnId = state.currentTurn ?? "";
  const turnPlayer = entries.find((player: any) => player.sessionId === currentTurnId);
  turnStatus.textContent = turnPlayer?.name ?? (state.currentTurn ?? "-");
  potStatus.textContent = String(state.pot ?? 0);
  betStatus.textContent = String(state.currentBet ?? 0);
  potChip.textContent = String(state.pot ?? 0);
  phaseChip.textContent = state.phase ?? "waiting";
  turnChip.textContent = turnPlayer?.name ?? (state.currentTurn ?? "-");
  winningHandStatus.textContent = lastWinningHand;
  winningHandChip.textContent = lastWinningHand;
  winnersStatus.textContent = lastWinners.join(", ") || "-";
  const community = state.communityCards ? Array.from(state.communityCards) : [];
  communityStatus.textContent = community.length ? community.join(" ") : "-";
  renderCardRow(communityCardsEl, community, 5);
  animateCardDeals(communityCardsEl, community, previousCommunityCards);
  previousCommunityCards = [...community];
  if (currentSessionId) {
    const me = entries.find((player: any) => player.sessionId === currentSessionId);
    const hand = me?.hand ? Array.from(me.hand) : [];
    handStatus.textContent = hand.length ? hand.join(" ") : "-";
    renderCardRow(handCardsEl, hand, 2);
    animateCardDeals(handCardsEl, hand, previousHandCards);
    previousHandCards = [...hand];
  } else {
    handStatus.textContent = "-";
    renderCardRow(handCardsEl, [], 2);
    previousHandCards = [];
  }
  renderSeats(state);
  renderPlayers(state);
  updateActionButtons(state);
}

function updateActionButtons(state: RoomState | null) {
  if (!state || !currentSessionId) {
    setActionButtonsEnabled(false, false, false, false, false, false);
    return;
  }

  const entries = getUserEntries(state);
  const me = entries.find((player: any) => player.sessionId === currentSessionId);
  const isMyTurn = Boolean(me) && state.currentTurn === currentSessionId;
  const isActive = Boolean(me) && !me?.isFolded && Boolean(state.roundStarted);
  const canAct = isMyTurn && isActive;
  const currentBet = Number(state.currentBet ?? 0);
  const myBet = Number(me?.currentBet ?? 0);
  const myChips = Number(me?.chips ?? 0);

  const canCheck = canAct && currentBet === myBet;
  const canCall = canAct && currentBet > myBet && myChips > 0;
  const canFold = canAct;
  const canBet = canAct && currentBet === 0 && myChips > 0;
  const canRaise = canAct && currentBet > 0 && myChips > 0;

  const canStart = Boolean(currentSessionId) && !state.roundStarted;

  setActionButtonsEnabled(
    canStart,
    canCheck,
    canCall,
    canFold,
    canBet,
    canRaise
  );
}

function setActionButtonsEnabled(
  canStart: boolean,
  canCheck: boolean,
  canCall: boolean,
  canFold: boolean,
  canBet: boolean,
  canRaise: boolean
) {
  startGameButton.disabled = !canStart;
  checkButton.disabled = !canCheck;
  callButton.disabled = !canCall;
  foldButton.disabled = !canFold;
  betButton.disabled = !canBet;
  raiseButton.disabled = !canRaise;
}

async function register() {
  const { username, email, password } = getFormValues();
  log("Registering...");
  const data = await request("/api/auth/register", { username, email, password });
  token = data.token;
  tokenStatus.textContent = token ? "set" : "none";
  tokenInvalidNotified = false;
  startTokenMonitor();
  log("Registered and token received.");
}

async function login() {
  const { email, password } = getFormValues();
  log("Logging in...");
  const data = await request("/api/auth/login", { email, password });
  token = data.token;
  tokenStatus.textContent = token ? "set" : "none";
  tokenInvalidNotified = false;
  startTokenMonitor();
  log("Logged in and token received.");
}

async function joinRoom(forceReplace = false) {
  if (!token) {
    log("No token. Login or register first.");
    return;
  }

  const { username } = getFormValues();
  log("Connecting to Colyseus...");

  const client = new Client(WS_URL);
  (client as any).auth = { token };

  let joinedRoom: Room;
  try {
    joinedRoom = await client.joinOrCreate("my_room", {
      token,
      auth: { token },
      name: username,
      forceReplace
    });
  } catch (err: any) {
    const message = err?.message || String(err);
    if (message.includes("SESSION_EXISTS")) {
      const shouldReplace = window.confirm("Ya hay una sesion activa en la mesa con este usuario. Quieres reemplazarla?");
      if (shouldReplace) {
        await joinRoom(true);
      }
      return;
    }
    if (message.includes("INVALID_TOKEN")) {
      handleTokenInvalidated();
      return;
    }
    log(`Join error: ${message}`);
    return;
  }

  room = joinedRoom;
  currentSessionId = joinedRoom.sessionId;
  lastWinningHand = "-";
  lastWinners = [];
  winningHandStatus.textContent = lastWinningHand;
  winningHandChip.textContent = lastWinningHand;
  winnersStatus.textContent = "-";
  preloadCardImages();
  const roomId = (joinedRoom as { id?: string; roomId?: string }).id
    ?? (joinedRoom as { roomId?: string }).roomId
    ?? "joined";
  roomStatus.textContent = roomId;
  log("Joined room.");

  joinedRoom.onLeave((code) => {
    if (code === 4001) {
      alert("Tu sesion fue reemplazada por otro ingreso.");
      clearAuthToken();
      resetRoomUi("replaced");
      return;
    }
    resetRoomUi("left");
  });

  joinedRoom.onMessage("joined", (payload) => {
    log(`Joined payload: ${JSON.stringify(payload)}`);
  });

  joinedRoom.onMessage("playerJoined", (payload) => {
    log(`Player joined: ${JSON.stringify(payload)}`);
  });

  joinedRoom.onMessage("bettingRoundStarted", (payload) => {
    log(`Betting round: ${JSON.stringify(payload)}`);
  });

  joinedRoom.onMessage("blindsPosted", (payload) => {
    lastWinners = [];
    winnersStatus.textContent = "-";
    log(`Blinds posted: ${JSON.stringify(payload)}`);
  });

  joinedRoom.onMessage("playerAction", (payload) => {
    log(`Player action: ${JSON.stringify(payload)}`);
  });

  room.onMessage("roundEnded", (payload) => {
    if (payload?.winningHand) {
      lastWinningHand = payload.winningHand;
      winningHandStatus.textContent = lastWinningHand;
      winningHandChip.textContent = lastWinningHand;
    }
    if (Array.isArray(payload?.winners)) {
      lastWinners = payload.winners.map((winner: any) => winner.playerId);
      winnersStatus.textContent = lastWinners.join(", ") || "-";
    }
    log(`Round ended: ${JSON.stringify(payload)}`);
  });

  room.onMessage("error", (payload) => {
    log(`Server error: ${JSON.stringify(payload)}`);
  });

  room.onStateChange((state) => {
    renderState(state);
  });
}

(document.querySelector("#register") as HTMLButtonElement).addEventListener("click", () => {
  register().catch((err) => log(`Register error: ${err.message || err}`));
});

(document.querySelector("#login") as HTMLButtonElement).addEventListener("click", () => {
  login().catch((err) => log(`Login error: ${err.message || err}`));
});

(document.querySelector("#join") as HTMLButtonElement).addEventListener("click", () => {
  joinRoom().catch((err) => log(`Join error: ${err.message || err}`));
});

function requireRoom(): Room | null {
  if (!room) {
    log("Not joined. Join a room first.");
    return null;
  }
  return room;
}

(document.querySelector("#start-game") as HTMLButtonElement).addEventListener("click", () => {
  const active = requireRoom();
  active?.send("startGame");
});

(document.querySelector("#check") as HTMLButtonElement).addEventListener("click", () => {
  const active = requireRoom();
  active?.send("check");
});

(document.querySelector("#call") as HTMLButtonElement).addEventListener("click", () => {
  const active = requireRoom();
  active?.send("call");
});

(document.querySelector("#fold") as HTMLButtonElement).addEventListener("click", () => {
  const active = requireRoom();
  active?.send("fold");
});

function getBetAmount() {
  const amount = parseInt((document.querySelector("#bet-amount") as HTMLInputElement).value, 10);
  return Number.isFinite(amount) ? amount : 0;
}

(document.querySelector("#bet") as HTMLButtonElement).addEventListener("click", () => {
  const active = requireRoom();
  const amount = getBetAmount();
  if (!active || amount <= 0) {
    log("Invalid bet amount.");
    return;
  }
  active.send("bet", amount);
});

(document.querySelector("#raise") as HTMLButtonElement).addEventListener("click", () => {
  const active = requireRoom();
  const amount = getBetAmount();
  if (!active || amount <= 0) {
    log("Invalid raise amount.");
    return;
  }
  active.send("raise", amount);
});
