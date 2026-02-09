import { Application, Text, TextStyle, Container } from "pixi.js";
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

function renderPlayers(state: any) {
  playersList.innerHTML = "";
  if (!state || !state.users) return;

  const entries = state.users instanceof Map
    ? Array.from(state.users.values())
    : Array.from(state.users.values());

  entries.forEach((player: any) => {
    const li = document.createElement("li");
    li.textContent = `${player.name} | chips: ${player.chips} | bet: ${player.currentBet}${player.isFolded ? " | folded" : ""}`;
    playersList.appendChild(li);
  });
}

function renderState(state: any) {
  if (!state) return;
  phaseStatus.textContent = state.phase ?? "-";
  turnStatus.textContent = state.currentTurn ?? "-";
  potStatus.textContent = String(state.pot ?? 0);
  betStatus.textContent = String(state.currentBet ?? 0);
  const community = state.communityCards ? Array.from(state.communityCards) : [];
  communityStatus.textContent = community.length ? community.join(" ") : "-";
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

const app = new Application({
  width: 800,
  height: 500,
  background: "#1b4332",
  antialias: true
});

const container = new Container();
const title = new Text(
  "Casino Table (Test)",
  new TextStyle({
    fontFamily: "Trebuchet MS",
    fontSize: 32,
    fill: "#f1e3c5"
  })
);

title.anchor.set(0.5, 0.5);

title.x = 400;

title.y = 80;

container.addChild(title);
app.stage.addChild(container);

const canvasHost = document.querySelector<HTMLDivElement>("#canvas")!;
canvasHost.appendChild(app.view as HTMLCanvasElement);
