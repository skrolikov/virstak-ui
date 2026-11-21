import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { VirtualList } from "../src/virtual/VirtualList";
import { pendingRecordsLabel } from "../src/virtual/pending-label";
import { anchoredScrollTop, captureAnchor } from "../src/virtual/scroll-anchor";

describe("pendingRecordsLabel", () => {
  it("picks Russian plural forms", () => {
    expect(pendingRecordsLabel(1)).toBe("Появилась 1 новая запись");
    expect(pendingRecordsLabel(2)).toBe("Появилось 2 новые записи");
    expect(pendingRecordsLabel(5)).toBe("Появилось 5 новых записей");
    expect(pendingRecordsLabel(11)).toBe("Появилось 11 новых записей");
    expect(pendingRecordsLabel(21)).toBe("Появилась 21 новая запись");
  });
});

describe("scroll-anchor", () => {
  const rows = [
    { key: "a", start: 0, end: 40 },
    { key: "b", start: 40, end: 80 },
  ];

  it("captures the first visible row", () => {
    expect(captureAnchor(45, rows)).toEqual({
      key: "b",
      offset: -5,
      atHead: false,
    });
  });

  it("keeps the anchored row in place", () => {
    expect(
      anchoredScrollTop({ key: "b", offset: -5, atHead: false }, (key) =>
        key === "b" ? 80 : null,
      ),
    ).toBe(85);
    expect(
      anchoredScrollTop({ key: "b", offset: 0, atHead: true }, () => 80),
    ).toBeNull();
  });
});

describe("VirtualList", () => {
  const items = [
    { id: "1", name: "Alpha" },
    { id: "2", name: "Beta" },
  ];

  it("renders empty content", () => {
    render(
      <VirtualList
        items={[] as typeof items}
        getKey={(item) => item.id}
        renderItem={(item) => item.name}
        empty={<p>Пусто</p>}
      />,
    );
    expect(screen.getByText("Пусто")).toBeInTheDocument();
  });

  it("renders a short list without windowing", () => {
    render(
      <VirtualList
        items={items}
        getKey={(item) => item.id}
        renderItem={(item) => item.name}
      />,
    );
    expect(screen.getByText("Alpha")).toBeInTheDocument();
    expect(screen.getByText("Beta")).toBeInTheDocument();
    expect(screen.getByText("1–2 / 2")).toBeInTheDocument();
  });

  it("shows a pending reveal control", async () => {
    const user = userEvent.setup();
    let revealed = false;
    render(
      <VirtualList
        items={items}
        getKey={(item) => item.id}
        renderItem={(item) => item.name}
        pendingCount={3}
        onRevealPending={() => {
          revealed = true;
        }}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Появилось 3 новые записи" }));
    expect(revealed).toBe(true);
  });
});
