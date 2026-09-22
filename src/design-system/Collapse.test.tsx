import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Collapse from "./Collapse";

/** The animated wrapper whose grid-rows/opacity classes encode open state. */
function panelOf(childText: string): HTMLElement {
  // <p> → padding div → overflow div → animated grid wrapper
  const panel = screen.getByText(childText).parentElement?.parentElement?.parentElement;
  if (!panel) throw new Error("Collapse panel wrapper not found");
  return panel;
}

function expectOpen(panel: HTMLElement) {
  expect(panel.className).toContain("grid-rows-[1fr]");
  expect(panel.className).toContain("opacity-100");
}

function expectClosed(panel: HTMLElement) {
  expect(panel.className).toContain("grid-rows-[0fr]");
  expect(panel.className).toContain("opacity-0");
}

describe("Collapse", () => {
  it("renders title, subtitle and children", () => {
    render(
      <Collapse title="Advanced settings" subtitle="Optional extras">
        <p>Panel body</p>
      </Collapse>
    );
    expect(screen.getByText("Advanced settings")).toBeInTheDocument();
    expect(screen.getByText("Optional extras")).toBeInTheDocument();
    expect(screen.getByText("Panel body")).toBeInTheDocument();
  });

  it("renders without a subtitle", () => {
    render(
      <Collapse title="Plain title">
        <p>Panel body</p>
      </Collapse>
    );
    expect(screen.getByRole("button", { name: "Plain title" })).toBeInTheDocument();
  });

  it("is open by default", () => {
    render(
      <Collapse title="Open me">
        <p>Panel body</p>
      </Collapse>
    );
    expectOpen(panelOf("Panel body"));
  });

  it("honors defaultOpen={false} (content stays in the DOM, hidden by CSS)", () => {
    render(
      <Collapse title="Closed" defaultOpen={false}>
        <p>Panel body</p>
      </Collapse>
    );
    expect(screen.getByText("Panel body")).toBeInTheDocument();
    expectClosed(panelOf("Panel body"));
  });

  it("clicking the header toggles open and closed", async () => {
    const user = userEvent.setup();
    render(
      <Collapse title="Toggle me" defaultOpen={false}>
        <p>Panel body</p>
      </Collapse>
    );
    const header = screen.getByRole("button", { name: /toggle me/i });
    const panel = panelOf("Panel body");

    expectClosed(panel);
    await user.click(header);
    expectOpen(panel);
    await user.click(header);
    expectClosed(panel);
  });
});
