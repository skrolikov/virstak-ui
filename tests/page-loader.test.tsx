import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PageLoader } from "../src/PageLoader/PageLoader";

describe("PageLoader", () => {
  it("announces loading status", () => {
    render(<PageLoader />);
    expect(screen.getByRole("status")).toHaveTextContent("Загрузка…");
  });
});
