import { useState } from "react";
import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ErrorBoundary } from "../src/ErrorBoundary/ErrorBoundary";

function Boom({ fail }: { fail: boolean }) {
  if (fail) throw new Error("boom");
  return <p>ok</p>;
}

describe("ErrorBoundary", () => {
  it("renders fallback and can reset", async () => {
    const user = userEvent.setup();
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    function Harness() {
      const [fail, setFail] = useState(true);
      return (
        <ErrorBoundary
          fallback={({ reset }) => (
            <button
              type="button"
              onClick={() => {
                setFail(false);
                reset();
              }}
            >
              Сброс
            </button>
          )}
        >
          <Boom fail={fail} />
        </ErrorBoundary>
      );
    }
    render(<Harness />);
    expect(screen.getByRole("button", { name: "Сброс" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Сброс" }));
    expect(screen.getByText("ok")).toBeInTheDocument();
    spy.mockRestore();
  });
});
