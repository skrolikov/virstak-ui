import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Button } from "../src/Button/Button";
import { Dialog } from "../src/Dialog/Dialog";
import { Drawer } from "../src/Drawer/Drawer";
import { Tooltip } from "../src/Tooltip/Tooltip";

describe("overlay contract", () => {
  it("gives Dialog unique title id and product accent on the portal", () => {
    render(
      <div data-product="tasks">
        <Dialog open onClose={() => undefined} title="Задача">
          Тело
        </Dialog>
      </div>,
    );
    const dialog = screen.getByRole("dialog", { name: "Задача" });
    const title = screen.getByRole("heading", { name: "Задача" });
    expect(dialog.getAttribute("aria-labelledby")).toBe(title.id);
    expect(title.id).not.toBe("dialog-title");
    expect(
      dialog.closest("[data-virstak-overlay]")?.getAttribute("data-product"),
    ).toBe("tasks");
  });

  it("traps focus inside Dialog and restores it on close", async () => {
    const user = userEvent.setup();
    function Harness() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <Button onClick={() => setOpen(true)}>Открыть</Button>
          <Dialog open={open} onClose={() => setOpen(false)} title="Фокус">
            <Button>Внутри</Button>
          </Dialog>
        </>
      );
    }
    render(<Harness />);
    const opener = screen.getByRole("button", { name: "Открыть" });
    await user.click(opener);
    const close = screen.getByRole("button", { name: "Закрыть" });
    expect(close).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("button", { name: "Внутри" })).toHaveFocus();
    await user.tab();
    expect(close).toHaveFocus();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(opener).toHaveFocus();
  });

  it("closes only the top overlay on Escape", () => {
    const onDialog = vi.fn();
    const onDrawer = vi.fn();
    render(
      <>
        <Drawer open onClose={onDrawer} title="Низ">
          Низ
        </Drawer>
        <Dialog open onClose={onDialog} title="Верх">
          Верх
        </Dialog>
      </>,
    );
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onDialog).toHaveBeenCalledTimes(1);
    expect(onDrawer).not.toHaveBeenCalled();
  });

  it("links Tooltip trigger through aria-describedby", async () => {
    const user = userEvent.setup();
    render(
      <Tooltip content="Подсказка">
        <Button>Цель</Button>
      </Tooltip>,
    );
    const trigger = screen.getByRole("button", { name: "Цель" });
    await user.hover(trigger);
    const tip = await screen.findByRole("tooltip");
    expect(trigger.getAttribute("aria-describedby")).toBe(tip.id);
  });
});
