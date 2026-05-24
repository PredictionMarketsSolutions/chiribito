import { describe, it, expect } from "vitest";
import { createCardElement, renderCardRow } from "./ui-cards";

function row(): HTMLElement {
  return document.createElement("div");
}
function keys(el: HTMLElement): string[] {
  return Array.from(el.children).map((c) => (c as HTMLElement).dataset.card ?? "<none>");
}

describe("createCardElement", () => {
  it("tags the element with its card key via data-card", () => {
    expect(createCardElement("10O").dataset.card).toBe("10O");
  });
  it("uses an empty key for a face-down (undefined) card", () => {
    const el = createCardElement(undefined);
    expect(el.dataset.card).toBe("");
    expect(el.classList.contains("card-back")).toBe(true);
  });
});

describe("renderCardRow — final DOM (unchanged contract)", () => {
  it("renders exactly `slots` card nodes in order", () => {
    const el = row();
    renderCardRow(el, ["10O", "7O"], 2);
    expect(el.children.length).toBe(2);
    expect(keys(el)).toEqual(["10O", "7O"]);
  });
  it("fills missing slots with face-down backs", () => {
    const el = row();
    renderCardRow(el, ["5O"], 5);
    expect(el.children.length).toBe(5);
    expect(keys(el)).toEqual(["5O", "", "", "", ""]);
  });
  it("clears to all backs when given an empty array (reset)", () => {
    const el = row();
    renderCardRow(el, ["5O", "6O", "7O", "10O", "11O"], 5);
    renderCardRow(el, [], 5);
    expect(keys(el)).toEqual(["", "", "", "", ""]);
  });
  it("shrinks to exactly `slots` if the row previously held more", () => {
    const el = row();
    renderCardRow(el, ["5O", "6O", "7O", "10O", "11O"], 5);
    renderCardRow(el, ["5O", "6O"], 2);
    expect(el.children.length).toBe(2);
    expect(keys(el)).toEqual(["5O", "6O"]);
  });
});

describe("renderCardRow — node persistence (keyed reconcile)", () => {
  it("keeps the SAME node instances when cards are unchanged", () => {
    const el = row();
    renderCardRow(el, ["10O", "7O"], 2);
    const before = Array.from(el.children);
    renderCardRow(el, ["10O", "7O"], 2);
    const after = Array.from(el.children);
    expect(after[0]).toBe(before[0]);
    expect(after[1]).toBe(before[1]);
  });

  it("keeps unchanged slots and replaces only the changed one", () => {
    const el = row();
    renderCardRow(el, ["10O", "7O", "5C"], 3);
    const before = Array.from(el.children);
    renderCardRow(el, ["10O", "7O", "6C"], 3);
    const after = Array.from(el.children);
    expect(after[0]).toBe(before[0]); // unchanged — persisted
    expect(after[1]).toBe(before[1]); // unchanged — persisted
    expect(after[2]).not.toBe(before[2]); // changed — replaced
    expect((after[2] as HTMLElement).dataset.card).toBe("6C");
  });

  it("flips a face-down slot to a face by replacing just that node (reveal)", () => {
    const el = row();
    renderCardRow(el, ["5O"], 2); // slot 1 is a face-down back
    const before = Array.from(el.children);
    expect((before[1] as HTMLElement).dataset.card).toBe("");
    renderCardRow(el, ["5O", "6O"], 2);
    const after = Array.from(el.children);
    expect(after[0]).toBe(before[0]); // already-shown card persists
    expect(after[1]).not.toBe(before[1]); // the revealed slot is the only churn
    expect((after[1] as HTMLElement).dataset.card).toBe("6O");
    expect((after[1] as HTMLElement).classList.contains("card-back")).toBe(false);
  });

  it("persists already-shown community cards across a progressive reveal", () => {
    const el = row();
    renderCardRow(el, ["5O"], 5);
    const firstCard = el.children[0];
    renderCardRow(el, ["5O", "6O"], 5);
    renderCardRow(el, ["5O", "6O", "7O"], 5);
    expect(el.children[0]).toBe(firstCard); // never recreated
    expect(el.children.length).toBe(5);
    expect(keys(el)).toEqual(["5O", "6O", "7O", "", ""]);
  });
});

describe("renderCardRow — reveal detection (onReveal)", () => {
  it("fires onReveal once when a single back turns into a face", () => {
    const el = row();
    renderCardRow(el, ["5O"], 5); // slots 1-4 are face-down backs
    const seen: string[] = [];
    renderCardRow(el, ["5O", "6O"], 5, { onReveal: (_n, faceId) => seen.push(faceId) });
    expect(seen).toEqual(["6O"]);
  });

  it("does NOT fire onReveal on a bulk fill (resync of several cards)", () => {
    const el = row();
    renderCardRow(el, [], 5); // 5 backs
    let count = 0;
    renderCardRow(el, ["5O", "6O", "7O"], 5, { onReveal: () => { count += 1; } });
    expect(count).toBe(0);
  });

  it("does NOT fire onReveal on a fresh build (no pre-existing back)", () => {
    const el = row(); // empty
    let count = 0;
    renderCardRow(el, ["5O", "6O", "7O"], 5, { onReveal: () => { count += 1; } });
    expect(count).toBe(0);
  });

  it("does NOT fire onReveal on a reset (face -> back)", () => {
    const el = row();
    renderCardRow(el, ["5O", "6O"], 5);
    let count = 0;
    renderCardRow(el, [], 5, { onReveal: () => { count += 1; } });
    expect(count).toBe(0);
  });

  it("hands onReveal the freshly created face node", () => {
    const el = row();
    renderCardRow(el, ["5O"], 2); // slot 1 is a back
    let received: HTMLElement | null = null;
    renderCardRow(el, ["5O", "6O"], 2, { onReveal: (node) => { received = node; } });
    expect(received).toBe(el.children[1] as HTMLElement);
    expect((received as unknown as HTMLElement).dataset.card).toBe("6O");
  });

  it("works without opts (back-compatible)", () => {
    const el = row();
    renderCardRow(el, ["5O"], 2);
    expect(() => renderCardRow(el, ["5O", "6O"], 2)).not.toThrow();
    expect(keys(el)).toEqual(["5O", "6O"]);
  });
});
