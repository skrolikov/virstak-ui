import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { SkyDrawerProvider, useSkyDrawer } from "../src/SkyDrawer";

function Probe() {
  const sky = useSkyDrawer();
  return (
    <button
      type="button"
      onClick={() =>
        sky.open({
          title: "Панель",
          content: <p>Содержимое</p>,
        })
      }
    >
      Открыть небо
    </button>
  );
}

describe("SkyDrawer core", () => {
  it("opens an ephemeral panel without a host URL adapter", async () => {
    const user = userEvent.setup();
    render(
      <SkyDrawerProvider>
        <Probe />
      </SkyDrawerProvider>,
    );
    await user.click(screen.getByRole("button", { name: "Открыть небо" }));
    expect(screen.getByRole("dialog", { name: "Панель" })).toBeInTheDocument();
    expect(screen.getByText("Содержимое")).toBeInTheDocument();
  });
});
