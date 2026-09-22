import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { createParentCompany, createPrincipal } from "../../model/defaults";
import type { Owner } from "../../model/types";
import OwnershipTotalBar from "./OwnershipTotalBar";

function principal(pct: string): Owner {
  return { ...createPrincipal(), ownershipPct: pct };
}

describe("OwnershipTotalBar", () => {
  it("shows the summed total and 'Balanced' when owners add to exactly 100%", () => {
    render(<OwnershipTotalBar owners={[principal("60"), principal("40")]} />);
    expect(screen.getByText("100%")).toBeInTheDocument();
    expect(screen.getByText("Balanced")).toBeInTheDocument();
  });

  it("mixes owner kinds with integer percentages", () => {
    const owners: Owner[] = [
      principal("33"),
      principal("33"),
      { ...createParentCompany(), ownershipPct: "34" },
    ];
    render(<OwnershipTotalBar owners={owners} />);
    expect(screen.getByText("100%")).toBeInTheDocument();
    expect(screen.getByText("Balanced")).toBeInTheDocument();
  });

  it("flags an under-allocated total with 'Must equal 100%'", () => {
    render(<OwnershipTotalBar owners={[principal("50"), principal("30")]} />);
    expect(screen.getByText("80%")).toBeInTheDocument();
    expect(screen.getByText("Must equal 100%")).toBeInTheDocument();
  });

  it("flags an over-allocated total with 'Must equal 100%'", () => {
    render(<OwnershipTotalBar owners={[principal("60"), principal("50")]} />);
    expect(screen.getByText("110%")).toBeInTheDocument();
    expect(screen.getByText("Must equal 100%")).toBeInTheDocument();
  });

  it("calls out zero/blank owners even when the total reaches 100%", () => {
    render(<OwnershipTotalBar owners={[principal("100"), principal("")]} />);
    expect(screen.getByText("100%")).toBeInTheDocument();
    expect(screen.getByText("Each owner must be greater than 0%")).toBeInTheDocument();
  });

  it("ignores non-numeric percentages in the sum and marks them as zero owners", () => {
    render(<OwnershipTotalBar owners={[principal("70"), principal("abc")]} />);
    expect(screen.getByText("70%")).toBeInTheDocument();
    expect(screen.getByText("Each owner must be greater than 0%")).toBeInTheDocument();
  });

  it("is never balanced with no owners", () => {
    render(<OwnershipTotalBar owners={[]} />);
    expect(screen.getByText("0%")).toBeInTheDocument();
    expect(screen.getByText("Must equal 100%")).toBeInTheDocument();
  });
});
