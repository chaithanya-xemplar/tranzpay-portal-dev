import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Breadcrumb from "./Breadcrumb";

function renderCrumbs(items: Parameters<typeof Breadcrumb>[0]["items"]) {
  return render(
    <MemoryRouter>
      <Breadcrumb items={items} />
    </MemoryRouter>
  );
}

describe("Breadcrumb", () => {
  it("renders a router link for items with `to`", () => {
    renderCrumbs([{ label: "Merchants", to: "/merchants" }, { label: "Acme" }]);
    const link = screen.getByRole("link", { name: "Merchants" });
    expect(link).toHaveAttribute("href", "/merchants");
  });

  it("keeps plain anchors for items with `href`", () => {
    renderCrumbs([{ label: "Docs", href: "https://example.com" }, { label: "Page" }]);
    expect(screen.getByRole("link", { name: "Docs" })).toHaveAttribute(
      "href",
      "https://example.com"
    );
  });

  it("renders the last item as text even when it has a link target", () => {
    renderCrumbs([{ label: "Merchants", to: "/merchants" }, { label: "Acme", to: "/x" }]);
    expect(screen.queryByRole("link", { name: "Acme" })).toBeNull();
    expect(screen.getByText("Acme")).toBeInTheDocument();
  });
});
