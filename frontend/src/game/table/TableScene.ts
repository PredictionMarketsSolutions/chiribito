/**
 * Pixi + GSAP table layer: cards, pot label, dealer marker. Seat positions from DOM measurement.
 */

import gsap from "gsap";
import {
  Application,
  Container,
  Graphics,
  Sprite,
  Text,
  Texture,
} from "pixi.js";

import { getCardTextureUrl } from "../../card-texture-url";
import { cardsEqual } from "../../ui-cards";
import type { RoomState } from "../../types";
import type { GameUiTableSyncContext, TableSceneController } from "../game-ui-types";
import { computeVisualSeatLayout, TOTAL_SEATS } from "../visual-layout";
import { getUserEntries, isPlayerState, schemaArrayToCards } from "../room-state";
import { isInWinnerPhase } from "../winner-display";

const CARD_W = 52;
const CARD_H = 78;
const BOARD_SPREAD = 58;
const HOLE_SPREAD = 20;
const DEFAULT_ALL_IN_STEP_MS = 2000;

export type TableSceneOptions = {
  app: Application;
  surfaceEl: HTMLElement;
  seatsEl: HTMLElement;
};

function textureForUrl(url: string): Texture {
  return Texture.from(url);
}

export class TableScene implements TableSceneController {
  private readonly app: Application;
  private readonly surfaceEl: HTMLElement;
  private readonly seatsEl: HTMLElement;

  private readonly root: Container;
  private readonly holesContainer: Container;
  private readonly boardContainer: Container;
  private readonly uiContainer: Container;

  private readonly holeSprites: Sprite[][] = [];
  private readonly boardSprites: Sprite[] = [];
  private readonly potText: Text;
  private readonly dealerMarker: Graphics;

  private active = false;
  private isRoundEndAnimating = false;
  private potTweenObj = { v: 0 };
  private potNumberTween: gsap.core.Tween | null = null;
  private resizeObserver: ResizeObserver | null = null;

  private slotCenters: { x: number; y: number }[] = [];
  private boardCenter = { x: 0, y: 0 };
  private deckPos = { x: 0, y: 0 };

  private prevCommunity: string[] = [];
  private prevHoles: (string | undefined)[][] = Array.from({ length: TOTAL_SEATS }, () => [undefined, undefined]);
  private allInRevealTween: gsap.core.Tween | null = null;

  constructor(opts: TableSceneOptions) {
    this.app = opts.app;
    this.surfaceEl = opts.surfaceEl;
    this.seatsEl = opts.seatsEl;

    this.root = new Container();
    this.holesContainer = new Container();
    this.boardContainer = new Container();
    this.uiContainer = new Container();

    this.app.stage.addChild(this.root);
    this.root.addChild(this.holesContainer);
    this.root.addChild(this.boardContainer);
    this.root.addChild(this.uiContainer);

    for (let v = 0; v < TOTAL_SEATS; v += 1) {
      const pair: Sprite[] = [];
      for (let c = 0; c < 2; c += 1) {
        const s = new Sprite(textureForUrl(getCardTextureUrl(undefined)));
        s.anchor.set(0.5);
        s.width = CARD_W;
        s.height = CARD_H;
        s.visible = false;
        s.alpha = 0;
        this.holesContainer.addChild(s);
        pair.push(s);
      }
      this.holeSprites.push(pair);
    }

    for (let i = 0; i < 5; i += 1) {
      const s = new Sprite(textureForUrl(getCardTextureUrl(undefined)));
      s.anchor.set(0.5);
      s.width = CARD_W;
      s.height = CARD_H;
      s.visible = false;
      s.alpha = 0;
      this.boardContainer.addChild(s);
      this.boardSprites.push(s);
    }

    this.potText = new Text("Pot: 0", { fill: 0xfff8dc, fontSize: 20, fontWeight: "bold" });
    this.potText.anchor.set(0.5);
    // A1.2 — DOM #pot-chip is the single visible pot. The Pixi text stays
    // wired (position, updatePot, scale tweens, destroy refs) so scene
    // continuity is unaffected — only the rendering is suppressed.
    this.potText.visible = false;
    this.uiContainer.addChild(this.potText);

    this.dealerMarker = new Graphics();
    this.dealerMarker.beginFill(0xf4c430);
    this.dealerMarker.lineStyle(2, 0x1a1a1a);
    this.dealerMarker.drawCircle(0, 0, 14);
    this.dealerMarker.endFill();
    const dLabel = new Text("D", { fill: 0x1a1a1a, fontSize: 16, fontWeight: "bold" });
    dLabel.anchor.set(0.5);
    this.dealerMarker.addChild(dLabel);
    this.dealerMarker.visible = false;
    this.uiContainer.addChild(this.dealerMarker);

    this.measureLayout();
    this.setupResizeObserver();
  }

  isActive(): boolean {
    return this.active;
  }

  setActive(value: boolean): void {
    this.active = value;
    if (!value) {
      this.reset();
    }
  }

  private setupResizeObserver(): void {
    if (typeof ResizeObserver === "undefined") return;
    this.resizeObserver = new ResizeObserver(() => {
      this.measureLayout();
      this.app.renderer.resize(this.surfaceEl.clientWidth, this.surfaceEl.clientHeight);
    });
    this.resizeObserver.observe(this.surfaceEl);
  }

  destroy(): void {
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    gsap.killTweensOf([...this.collectAllCardSprites(), this.potText.scale]);
    this.app.stage.removeChild(this.root);
    this.root.destroy({ children: true });
  }

  private collectAllCardSprites(): Sprite[] {
    const out: Sprite[] = [];
    this.holeSprites.forEach((pair) => pair.forEach((s) => out.push(s)));
    this.boardSprites.forEach((s) => out.push(s));
    return out;
  }

  measureLayout(): void {
    const surfaceRect = this.surfaceEl.getBoundingClientRect();
    const w = Math.max(1, surfaceRect.width);
    const h = Math.max(1, surfaceRect.height);

    const seats = Array.from(this.seatsEl.querySelectorAll<HTMLElement>(".seat"));
    this.slotCenters = [];
    for (let i = 0; i < TOTAL_SEATS; i += 1) {
      const el = seats[i];
      if (!el) {
        this.slotCenters.push({ x: w / 2, y: h / 2 });
        continue;
      }
      const r = el.getBoundingClientRect();
      this.slotCenters.push({
        x: r.left + r.width / 2 - surfaceRect.left,
        y: r.top + r.height / 2 - surfaceRect.top,
      });
    }

    this.boardCenter = { x: w * 0.5, y: h * 0.44 };
    this.deckPos = { x: w * 0.5, y: h * 0.36 };

    this.layoutStaticUi();
    this.applyBoardPositions();
    this.applyHolePositions();
  }

  private layoutStaticUi(): void {
    this.potText.position.set(this.boardCenter.x, this.boardCenter.y - CARD_H * 0.85);
  }

  private applyBoardPositions(): void {
    const cx = this.boardCenter.x;
    const cy = this.boardCenter.y;
    for (let i = 0; i < 5; i += 1) {
      const spr = this.boardSprites[i];
      spr.position.set(cx + (i - 2) * BOARD_SPREAD, cy);
    }
  }

  private holePosFor(visualSlot: number, cardIndex: number): { x: number; y: number } {
    const base = this.slotCenters[visualSlot] ?? this.boardCenter;
    const dx = cardIndex === 0 ? -HOLE_SPREAD : HOLE_SPREAD;
    return { x: base.x + dx, y: base.y };
  }

  private applyHolePositions(): void {
    for (let v = 0; v < TOTAL_SEATS; v += 1) {
      for (let c = 0; c < 2; c += 1) {
        const p = this.holePosFor(v, c);
        this.holeSprites[v][c].position.set(p.x, p.y);
      }
    }
  }

  private dealerPosForVisualSlot(visualSlot: number): { x: number; y: number } {
    const base = this.slotCenters[visualSlot] ?? this.boardCenter;
    const vx = this.boardCenter.x - base.x;
    const vy = this.boardCenter.y - base.y;
    const len = Math.hypot(vx, vy) || 1;
    const pull = 36;
    return { x: base.x + (vx / len) * pull, y: base.y + (vy / len) * pull };
  }

  updatePotDisplay(value: number, previous: number | null): void {
    const from = previous ?? value;
    const to = value;

    if (from === to) {
      this.potText.text = `Pot: ${Math.round(to)}`;
      return;
    }

    // Inicia en el valor anterior y hace conteo rápido al nuevo.
    this.potText.text = `Pot: ${Math.round(from)}`;
    this.potTweenObj.v = from;

    // Cancelar tweens anteriores para evitar carreras cuando llegan muchos state updates.
    this.potNumberTween?.kill();
    this.potNumberTween = null;
    gsap.killTweensOf(this.potText.scale);

    this.potNumberTween = gsap.to(this.potTweenObj, {
      v: to,
      duration: 0.5,
      ease: "power2.out",
      onUpdate: () => {
        this.potText.text = `Pot: ${Math.round(this.potTweenObj.v)}`;
      },
    });

    // Refuerzo visual en escala.
    gsap.fromTo(
      this.potText.scale,
      { x: 1.35, y: 1.35 },
      { x: 1, y: 1, duration: 0.4, ease: "power2.out" }
    );
  }

  syncCommunityFromServer(cards: string[]): void {
    if (!this.active || this.isRoundEndAnimating) return;
    this.setBoardCards(cards, false);
    this.prevCommunity = [...cards];
  }

  syncFromState(state: RoomState, ctx: GameUiTableSyncContext): void {
    if (!this.active) return;
    if (this.isRoundEndAnimating) return;

    this.measureLayout();

    const community = ctx.allInRevealInProgress
      ? [...ctx.previousCommunityCards]
      : schemaArrayToCards(state.communityCards);

    if (!ctx.allInRevealInProgress) {
      const dealBoard = !cardsEqual(community, this.prevCommunity);
      this.setBoardCards(community, dealBoard);
      this.prevCommunity = [...community];
    } else {
      this.setBoardCards(community, false);
    }

    const entries = getUserEntries(state).filter(isPlayerState);
    const me = ctx.currentSessionId ? entries.find((p) => p.sessionId === ctx.currentSessionId) : undefined;
    const { visualSeats, dealerIndex } = computeVisualSeatLayout(state, ctx.currentSessionId);

    let dealerVisual: number | null = null;
    if (dealerIndex >= 0) {
      for (let v = 0; v < TOTAL_SEATS; v += 1) {
        const p = visualSeats[v];
        if (p && p.seatIndex === dealerIndex) {
          dealerVisual = v;
          break;
        }
      }
    }
    if (dealerVisual !== null) {
      const dp = this.dealerPosForVisualSlot(dealerVisual);
      this.dealerMarker.position.set(dp.x, dp.y);
      this.dealerMarker.visible = true;
    } else {
      this.dealerMarker.visible = false;
    }

    for (let v = 0; v < TOTAL_SEATS; v += 1) {
      const player = visualSeats[v];
      const prevPair = this.prevHoles[v];
      if (!player) {
        this.hideHoleSlot(v);
        this.prevHoles[v] = [undefined, undefined];
        continue;
      }

      const isYou = Boolean(ctx.currentSessionId && player.sessionId === ctx.currentSessionId);
      let cards: string[] =
        isYou ? schemaArrayToCards(me?.hand) : (ctx.revealedHands?.[player.sessionId] ?? []);
      if (
        !isYou &&
        ctx.winnerDisplayState.lastWinners.includes(player.sessionId) &&
        ctx.winnerDisplayState.lastWinningHand === "Gana por fold"
      ) {
        cards = [];
      }

      const faceUp: (string | undefined)[] = [cards[0], cards[1]];
      const inWinner = isInWinnerPhase(ctx.winnerDisplayState);
      const showBack = !isYou && faceUp.filter(Boolean).length < 2 && !inWinner;

      for (let c = 0; c < 2; c += 1) {
        const spr = this.holeSprites[v][c];
        const nextId = showBack ? undefined : faceUp[c];
        const prevSlot = prevPair[c];
        const url = getCardTextureUrl(nextId);
        spr.texture = textureForUrl(url);
        const hasCard = Boolean(nextId) || showBack;
        if (!hasCard) {
          spr.visible = false;
          spr.alpha = 0;
          gsap.killTweensOf(spr);
          this.prevHoles[v][c] = undefined;
        } else {
          const pos = this.holePosFor(v, c);
          const isNew = prevSlot === undefined && hasCard && Boolean(state.roundStarted);
          if (isNew) {
            spr.visible = true;
            spr.alpha = 1;
            spr.position.set(this.deckPos.x, this.deckPos.y);
            gsap.to(spr, { x: pos.x, y: pos.y, duration: 0.45, ease: "power2.out", delay: c * 0.08 });
          } else {
            gsap.killTweensOf(spr);
            spr.position.set(pos.x, pos.y);
            spr.visible = true;
            spr.alpha = 1;
          }
          this.prevHoles[v][c] = nextId ?? "BACK";
        }
      }
    }
  }

  private hideHoleSlot(visualSlot: number): void {
    for (let c = 0; c < 2; c += 1) {
      const spr = this.holeSprites[visualSlot][c];
      gsap.killTweensOf(spr);
      spr.visible = false;
      spr.alpha = 0;
    }
  }

  private setBoardCards(cards: string[], animateNew: boolean): void {
    for (let i = 0; i < 5; i += 1) {
      const spr = this.boardSprites[i];
      const id = cards[i];
      const had = Boolean(this.prevCommunity[i]);
      const has = Boolean(id);
      spr.texture = textureForUrl(getCardTextureUrl(id));
      if (!has) {
        gsap.killTweensOf(spr);
        spr.visible = false;
        spr.alpha = 0;
        continue;
      }
      const pos = { x: this.boardCenter.x + (i - 2) * BOARD_SPREAD, y: this.boardCenter.y };
      if (animateNew && !had) {
        spr.visible = true;
        spr.alpha = 1;
        spr.position.set(this.deckPos.x, this.deckPos.y);
        gsap.to(spr, { x: pos.x, y: pos.y, duration: 0.5, ease: "power2.out", delay: i * 0.06 });
      } else {
        gsap.killTweensOf(spr);
        spr.position.set(pos.x, pos.y);
        spr.visible = true;
        spr.alpha = 1;
      }
    }
  }

  playRoundEndCollectThen(onComplete: () => void): void {
    if (!this.active) {
      onComplete();
      return;
    }
    this.isRoundEndAnimating = true;
    const sprites = this.collectAllCardSprites().filter((s) => s.visible);
    const cx = this.boardCenter.x;
    const cy = this.boardCenter.y;
    const tl = gsap.timeline({
      onComplete: () => {
        this.isRoundEndAnimating = false;
        sprites.forEach((s) => {
          s.visible = false;
          s.alpha = 0;
        });
        this.prevCommunity = [];
        for (let v = 0; v < TOTAL_SEATS; v += 1) {
          this.prevHoles[v] = [undefined, undefined];
        }
        onComplete();
      },
    });
    sprites.forEach((spr, i) => {
      tl.to(
        spr,
        { x: cx, y: cy, duration: 0.5, ease: "power2.in" },
        i * 0.04
      );
    });
    if (sprites.length === 0) {
      tl.kill();
      this.isRoundEndAnimating = false;
      onComplete();
    }
  }

  revealAllInSequential(cards: string[], onComplete?: () => void, stepMs: number = DEFAULT_ALL_IN_STEP_MS): void {
    this.cancelAllInReveal();
    this.measureLayout();
    let index = 0;
    const runStep = () => {
      if (index >= cards.length) {
        this.allInRevealTween = null;
        this.prevCommunity = [...cards];
        onComplete?.();
        return;
      }
      const slice = cards.slice(0, index + 1);
      this.setBoardCards(slice, false);
      for (let j = 0; j < 5; j += 1) {
        const spr = this.boardSprites[j];
        if (j < slice.length && slice[j]) {
          spr.alpha = 0;
          spr.visible = true;
          gsap.to(spr, { alpha: 1, duration: 0.25 });
        }
      }
      index += 1;
      if (index >= cards.length) {
        this.allInRevealTween = null;
        this.prevCommunity = [...cards];
        onComplete?.();
        return;
      }
      this.allInRevealTween = gsap.delayedCall(stepMs / 1000, runStep);
    };
    runStep();
  }

  cancelAllInReveal(): void {
    this.allInRevealTween?.kill();
    this.allInRevealTween = null;
  }

  reset(): void {
    this.cancelAllInReveal();
    this.potNumberTween?.kill();
    this.potNumberTween = null;
    gsap.killTweensOf(this.collectAllCardSprites());
    this.isRoundEndAnimating = false;
    this.prevCommunity = [];
    for (let v = 0; v < TOTAL_SEATS; v += 1) {
      this.prevHoles[v] = [undefined, undefined];
    }
    this.collectAllCardSprites().forEach((s) => {
      s.visible = false;
      s.alpha = 0;
    });
    this.dealerMarker.visible = false;
    this.potText.text = "Pot: 0";
    this.potText.scale.set(1);
  }
}
