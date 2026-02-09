import { Client, Room } from "colyseus.js";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:2567";

const logEl = document.querySelector<HTMLPreElement>("#log")!;
const tokenStatus = document.querySelector<HTMLSpanElement>("#token-status")!;
const roomStatus = document.querySelector<HTMLSpanElement>("#room-status")!;
const phaseStatus = document.querySelector<HTMLSpanElement>("#phase-status")!;
const turnStatus = document.querySelector<HTMLSpanElement>("#turn-status")!;
const potStatus = document.querySelector<HTMLSpanElement>("#pot-status")!;
const betStatus = document.querySelector<HTMLSpanElement>("#bet-status")!;
const communityStatus = document.querySelector<HTMLSpanElement>("#community-status")!;
const handStatus = document.querySelector<HTMLSpanElement>("#hand-status")!;
const communityCardsEl = document.querySelector<HTMLDivElement>("#community-cards")!;
const handCardsEl = document.querySelector<HTMLDivElement>("#hand-cards")!;
const potChip = document.querySelector<HTMLSpanElement>("#pot-chip")!;
const phaseChip = document.querySelector<HTMLSpanElement>("#phase-chip")!;
const turnChip = document.querySelector<HTMLSpanElement>("#turn-chip")!;
const potStackEl = document.querySelector<HTMLDivElement>("#pot-stack")!;
const seatsEl = document.querySelector<HTMLDivElement>("#seats")!;
const playersList = document.querySelector<HTMLUListElement>("#players")!;
const apiUrlEl = document.querySelector<HTMLSpanElement>("#api-url")!;
const wsUrlEl = document.querySelector<HTMLSpanElement>("#ws-url")!;

apiUrlEl.textContent = API_URL;
wsUrlEl.textContent = WS_URL;

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

function createCardElement(card: string | undefined) {
  const el = document.createElement("div");
  el.classList.add("card");

  if (!card) {
    el.classList.add("back");
    el.innerHTML = "<span class=\"rank\">?</span><span class=\"suit\">?</span>";
    return el;
  }

  const suit = card.slice(-1);
  const rank = card.slice(0, -1);
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

function renderPotStack(potValue: number) {
  const maxChips = 10;
  const denominations = [100, 25, 10, 5, 1];
  const palette: Record<number, string> = {
    100: "black",
    25: "green",
    10: "blue",
    5: "red",
    1: "white"
  };

  let remaining = Math.max(0, potValue);
  const chips: number[] = [];

  denominations.forEach(value => {
    while (remaining >= value && chips.length < maxChips) {
      chips.push(value);
      remaining -= value;
    }
  });

  potStackEl.innerHTML = "";
  chips.forEach((value, index) => {
    const chip = document.createElement("div");
    chip.classList.add("pot-chip", `chip-${palette[value] ?? "white"}`);
    chip.style.transform = `translateY(${-index * 4}px)`;
    chip.style.zIndex = String(10 + index);
    potStackEl.appendChild(chip);
  });
}

function renderSeats(state: any) {
  const entries = state?.users
    ? Array.from(state.users.values())
    : [];
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
      seat.classList.remove("dealer", "turn");
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
    nameEl.textContent = `${player.name}${isYou ? " (tu)" : ""}`;
    metaEl.textContent = `Chips ${player.chips} | Bet ${player.currentBet}`;
  });
}

function renderPlayers(state: any) {
  playersList.innerHTML = "";
  if (!state || !state.users) return;

  const entries = state.users instanceof Map
    ? Array.from(state.users.values())
    : Array.from(state.users.values());

  entries.forEach((player: any) => {
    const li = document.createElement("li");
    const isYou = currentSessionId && player.sessionId === currentSessionId ? " (you)" : "";
    li.textContent = `${player.name}${isYou} | chips: ${player.chips} | bet: ${player.currentBet}${player.isFolded ? " | folded" : ""}`;
    playersList.appendChild(li);
  });
}

function renderState(state: any) {
  if (!state) return;
  phaseStatus.textContent = state.phase ?? "-";
  const entries = state.users instanceof Map
    ? Array.from(state.users.values())
    : Array.from(state.users.values());
  const currentTurnId = state.currentTurn ?? "";
  const turnPlayer = entries.find((player: any) => player.sessionId === currentTurnId);
  turnStatus.textContent = turnPlayer?.name ?? (state.currentTurn ?? "-");
  potStatus.textContent = String(state.pot ?? 0);
  betStatus.textContent = String(state.currentBet ?? 0);
  potChip.textContent = String(state.pot ?? 0);
  phaseChip.textContent = state.phase ?? "waiting";
  turnChip.textContent = turnPlayer?.name ?? (state.currentTurn ?? "-");
  renderPotStack(state.pot ?? 0);
  const community = state.communityCards ? Array.from(state.communityCards) : [];
  communityStatus.textContent = community.length ? community.join(" ") : "-";
  renderCardRow(communityCardsEl, community, 5);
  if (currentSessionId) {
    const me = entries.find((player: any) => player.sessionId === currentSessionId);
    const hand = me?.hand ? Array.from(me.hand) : [];
    handStatus.textContent = hand.length ? hand.join(" ") : "-";
    renderCardRow(handCardsEl, hand, 2);
  } else {
    handStatus.textContent = "-";
    renderCardRow(handCardsEl, [], 2);
  }
  renderSeats(state);
  renderPlayers(state);
}

async function register() {
  const { username, email, password } = getFormValues();
  log("Registering...");
  const data = await request("/api/auth/register", { username, email, password });
  token = data.token;
  tokenStatus.textContent = token ? "set" : "none";
  log("Registered and token received.");
}

async function login() {
  const { email, password } = getFormValues();
  log("Logging in...");
  const data = await request("/api/auth/login", { email, password });
  token = data.token;
  tokenStatus.textContent = token ? "set" : "none";
  log("Logged in and token received.");
}

async function joinRoom() {
  if (!token) {
    log("No token. Login or register first.");
    return;
  }

  const { username } = getFormValues();
  log("Connecting to Colyseus...");

  const client = new Client(WS_URL);
  (client as any).auth = { token };

  room = await client.joinOrCreate("my_room", {
    token,
    auth: { token },
    name: username
  });

  currentSessionId = room.sessionId;
  roomStatus.textContent = room.id || "joined";
  log("Joined room.");

  room.onMessage("joined", (payload) => {
    log(`Joined payload: ${JSON.stringify(payload)}`);
  });

  room.onMessage("playerJoined", (payload) => {
    log(`Player joined: ${JSON.stringify(payload)}`);
  });

  room.onMessage("bettingRoundStarted", (payload) => {
    log(`Betting round: ${JSON.stringify(payload)}`);
  });

  room.onMessage("blindsPosted", (payload) => {
    log(`Blinds posted: ${JSON.stringify(payload)}`);
  });

  room.onMessage("playerAction", (payload) => {
    log(`Player action: ${JSON.stringify(payload)}`);
  });

  room.onMessage("roundEnded", (payload) => {
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
