/**
 * Centralized DOM element references for the game UI.
 * All refs are resolved once at module load (script runs after DOM when bundled with defer).
 */
function getRef<T extends Element>(selector: string, assert = true): T | null {
  const el = document.querySelector<T>(selector);
  if (assert && !el) console.warn(`[dom-refs] Missing: ${selector}`);
  return el;
}

export const dom = {
  log: getRef<HTMLPreElement>("#log"),
  authOverlay: getRef<HTMLDivElement>("#auth-overlay"),
  authMessage: getRef<HTMLDivElement>("#auth-message"),
  lobbyOverlay: getRef<HTMLDivElement>("#lobby-overlay"),
  lobbyMessage: getRef<HTMLDivElement>("#lobby-message"),
  roomsList: getRef<HTMLUListElement>("#rooms-list"),
  winnersRankingList: getRef<HTMLUListElement>("#winners-ranking"),
  refreshRoomsButton: getRef<HTMLButtonElement>("#refresh-rooms"),
  tableNameInput: getRef<HTMLInputElement>("#table-name"),
  createTableButton: getRef<HTMLButtonElement>("#create-table"),
  backToAuthButton: getRef<HTMLButtonElement>("#back-to-auth"),
  joinRoomIdInput: getRef<HTMLInputElement>("#join-room-id"),
  joinByIdButton: getRef<HTMLButtonElement>("#join-by-id"),
  tournamentResultOverlay: getRef<HTMLDivElement>("#tournament-result-overlay"),
  tournamentResultTitle: getRef<HTMLHeadingElement>("#tournament-result-title"),
  tournamentResultMessage: getRef<HTMLParagraphElement>("#tournament-result-message"),
  tournamentBackToLobbyButton: getRef<HTMLButtonElement>("#tournament-back-to-lobby"),
  tokenStatus: getRef<HTMLSpanElement>("#token-status"),
  roomStatus: getRef<HTMLSpanElement>("#room-status"),
  phaseStatus: getRef<HTMLSpanElement>("#phase-status"),
  turnStatus: getRef<HTMLSpanElement>("#turn-status"),
  potStatus: getRef<HTMLSpanElement>("#pot-status"),
  betStatus: getRef<HTMLSpanElement>("#bet-status"),
  communityStatus: getRef<HTMLSpanElement>("#community-status"),
  handStatus: getRef<HTMLSpanElement>("#hand-status"),
  winningHandStatus: getRef<HTMLSpanElement>("#winning-hand"),
  winnersStatus: getRef<HTMLSpanElement>("#winners-status"),
  communityCardsEl: getRef<HTMLDivElement>("#community-cards"),
  handCardsEl: getRef<HTMLDivElement>("#hand-cards"),
  potChip: getRef<HTMLSpanElement>("#pot-chip"),
  phaseChip: getRef<HTMLSpanElement>("#phase-chip"),
  turnChip: getRef<HTMLSpanElement>("#turn-chip"),
  turnTimerChip: getRef<HTMLSpanElement>("#turn-timer"),
  winningHandChip: getRef<HTMLSpanElement>("#winning-hand-chip"),
  seatsEl: getRef<HTMLDivElement>("#seats"),
  playersList: getRef<HTMLUListElement>("#players"),
  handHistoryList: getRef<HTMLUListElement>("#hand-history"),
  mobileSeatsList: getRef<HTMLUListElement>("#mobile-seats"),
  apiUrlEl: getRef<HTMLSpanElement>("#api-url"),
  wsUrlEl: getRef<HTMLSpanElement>("#ws-url"),
  startGameButton: getRef<HTMLButtonElement>("#start-game"),
  checkButton: getRef<HTMLButtonElement>("#check"),
  callButton: getRef<HTMLButtonElement>("#call"),
  foldButton: getRef<HTMLButtonElement>("#fold"),
  allInButton: getRef<HTMLButtonElement>("#all-in"),
  betButton: getRef<HTMLButtonElement>("#bet"),
  raiseButton: getRef<HTMLButtonElement>("#raise"),
  connectionIndicator: getRef<HTMLDivElement>("#connection-indicator"),
  rttStatus: getRef<HTMLSpanElement>("#rtt-status"),
  qualityStatus: getRef<HTMLSpanElement>("#quality-status"),
  bufferStatus: getRef<HTMLSpanElement>("#buffer-status"),
  yourTurnIndicator: getRef<HTMLDivElement>("#your-turn-indicator")
} as const;
