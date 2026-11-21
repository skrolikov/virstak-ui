import { useState } from "react";
import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { HybridInput } from "../src/HybridInput/HybridInput";
import type { HybridOption } from "../src/HybridInput/types";

const options: HybridOption[] = [
  { id: "1", label: "Интересно", description: "Сергей Д." },
  { id: "2", label: "TFX-TASK-001003 · Интересно", description: "Марина К." },
  { id: "3", label: "Привет" },
];

function ChipField() {
  const [value, setValue] = useState<HybridOption | null>(null);
  return (
    <HybridInput
      variant="search"
      label="Задача"
      options={options}
      value={value}
      onChange={setValue}
    />
  );
}

function InlineField() {
  const [value, setValue] = useState<HybridOption | null>(options[0]);
  return (
    <HybridInput
      variant="search"
      mode="inline"
      label="Задача"
      options={options}
      value={value}
      onChange={setValue}
    />
  );
}

describe("SearchHybrid", () => {
  it("filters the menu by the typed query in chip mode", async () => {
    const user = userEvent.setup();
    render(<ChipField />);
    const input = screen.getByLabelText("Задача");
    await user.click(input);
    expect(screen.getByRole("option", { name: /Привет/ })).toBeTruthy();

    await user.type(input, "интер");

    expect(screen.getByRole("option", { name: /^Интересно/ })).toBeTruthy();
    expect(
      screen.getByRole("option", { name: /TFX-TASK-001003/ }),
    ).toBeTruthy();
    expect(screen.queryByRole("option", { name: /Привет/ })).toBeNull();
  });

  it("keeps the caret and the whole query when a selected chip is replaced by typing", async () => {
    const user = userEvent.setup();
    render(<InlineField />);
    const input = screen.getByLabelText("Задача");
    await user.click(input);
    await user.type(input, "x");
    expect(input).toHaveValue("Интересноx");
    expect(document.activeElement).toBe(input);
  });

  it("keeps focus while typing over an already selected chip", async () => {
    const user = userEvent.setup();
    function Selected() {
      const [value, setValue] = useState<HybridOption | null>(options[0]);
      return (
        <HybridInput
          variant="search"
          label="Задача"
          options={options}
          value={value}
          onChange={setValue}
        />
      );
    }
    render(<Selected />);
    const input = screen.getByLabelText("Задача");
    await user.click(input);
    await user.type(input, "прив");
    expect(input).toHaveValue("прив");
    expect(document.activeElement).toBe(input);
    expect(screen.getByRole("option", { name: /Привет/ })).toBeTruthy();
    expect(screen.queryByRole("option", { name: /^Интересно Сергей/ })).toBeNull();
  });

  it("keeps the full list on focus in inline mode until the text changes", async () => {
    const user = userEvent.setup();
    render(<InlineField />);
    const input = screen.getByLabelText("Задача");
    await user.click(input);
    expect(screen.getByRole("option", { name: /Привет/ })).toBeTruthy();

    await user.clear(input);
    await user.type(input, "прив");

    expect(screen.getByRole("option", { name: /Привет/ })).toBeTruthy();
    expect(screen.queryByRole("option", { name: /^Интересно/ })).toBeNull();
  });
});
