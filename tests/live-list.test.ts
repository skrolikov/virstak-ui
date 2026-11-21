import { describe, expect, it } from "vitest";

import { anchoredScrollTop, captureAnchor } from "../src/virtual/scroll-anchor";
import { pendingRecordsLabel } from "../src/virtual/pending-label";
import {
  acceptPending,
  createOverlay,
  flattenCursorPages,
  projectList,
  reduceOverlay,
} from "../../virstak-data/src/live-cache";

describe("scroll anchor", () => {
  it("keeps the visible row when items are inserted above it", () => {
    const anchor = captureAnchor(120, [
      { key: "a", start: 0, end: 40 },
      { key: "b", start: 40, end: 80 },
      { key: "c", start: 80, end: 160 },
    ]);
    expect(anchor).toMatchObject({ key: "c", atHead: false });
    const next = anchoredScrollTop(anchor, (key) => (key === "c" ? 200 : null));
    expect(next).toBe(200 - (anchor?.offset ?? 0));
  });

  it("does not fight the head of the list", () => {
    const anchor = captureAnchor(0, [{ key: "a", start: 0, end: 40 }]);
    expect(anchoredScrollTop(anchor, () => 80)).toBeNull();
  });
});

describe("live cache", () => {
  const server = [
    { id: "2", name: "b" },
    { id: "1", name: "a" },
  ];

  it("dedupes cursor pages", () => {
    expect(
      flattenCursorPages([
        { items: [server[0]] },
        { items: [server[0], server[1]] },
      ]).map((item) => item.id),
    ).toEqual(["2", "1"]);
  });

  it("patches an existing row and defers a new one away from the head", () => {
    let overlay = createOverlay<(typeof server)[number]>();
    overlay = reduceOverlay(
      overlay,
      server,
      { type: "upsert", seq: 1, item: { id: "2", name: "updated" } },
      { deferNew: true },
    );
    overlay = reduceOverlay(
      overlay,
      server,
      { type: "upsert", seq: 2, item: { id: "9", name: "fresh" } },
      { deferNew: true },
    );
    expect(projectList(server, overlay).map((item) => item.name)).toEqual(["updated", "a"]);
    expect(overlay.pending.map((item) => item.id)).toEqual(["9"]);
    expect(pendingRecordsLabel(overlay.pending.length)).toBe("Появилась 1 новая запись");

    overlay = acceptPending(overlay);
    expect(projectList(server, overlay)[0]?.id).toBe("9");
    expect(overlay.pending).toHaveLength(0);
  });

  it("ignores duplicates and flags a sequence gap", () => {
    let overlay = createOverlay<(typeof server)[number]>();
    overlay = reduceOverlay(
      overlay,
      server,
      { type: "delete", seq: 4, id: "1" },
      { deferNew: false },
    );
    const again = reduceOverlay(
      overlay,
      server,
      { type: "delete", seq: 4, id: "2" },
      { deferNew: false },
    );
    expect(again).toBe(overlay);
    const gap = reduceOverlay(
      overlay,
      server,
      { type: "upsert", seq: 6, item: { id: "3", name: "c" } },
      { deferNew: false },
    );
    expect(gap.status).toBe("gap");
    expect(projectList(server, overlay).map((item) => item.id)).toEqual(["2"]);
  });
});
