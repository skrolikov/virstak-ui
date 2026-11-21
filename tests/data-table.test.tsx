import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DataTable } from "../src/DataTable/DataTable";

const columns = [
  { accessorKey: "name", header: "Name" },
  { accessorKey: "status", header: "Status" },
];

describe("DataTable", () => {
  it("renders every short list without a pager", () => {
    render(
      <DataTable
        searchable={false}
        columns={columns}
        data={[
          { id: "1", name: "Alpha", status: "В работе" },
          { id: "2", name: "Beta", status: "Готов" },
        ]}
      />,
    );
    expect(screen.getByText("Alpha")).toBeInTheDocument();
    expect(screen.getByText("Beta")).toBeInTheDocument();
    expect(screen.queryByText(/Страница/)).not.toBeInTheDocument();
    expect(screen.queryByTitle("Следующая страница")).not.toBeInTheDocument();
  });

  it("virtualizes a long list and keeps row identity", () => {
    const clientHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "clientHeight");
    const offsetHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetHeight");
    Object.defineProperty(HTMLElement.prototype, "clientHeight", {
      configurable: true,
      get() {
        return (this as HTMLElement).tagName === "TR" ? 52 : 400;
      },
    });
    Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
      configurable: true,
      get() {
        return (this as HTMLElement).tagName === "TR" ? 52 : 400;
      },
    });
    const data = Array.from({ length: 80 }, (_, index) => ({
      id: `row-${index}`,
      name: `Запись ${index}`,
      status: "В работе",
    }));
    try {
      render(<DataTable searchable={false} columns={columns} data={data} />);
      expect(screen.getByText("Запись 0")).toBeInTheDocument();
      expect(screen.queryByText("Запись 79")).not.toBeInTheDocument();
      expect(screen.queryByText(/Страница/)).not.toBeInTheDocument();
    } finally {
      if (clientHeight) Object.defineProperty(HTMLElement.prototype, "clientHeight", clientHeight);
      if (offsetHeight) Object.defineProperty(HTMLElement.prototype, "offsetHeight", offsetHeight);
    }
  });
});
