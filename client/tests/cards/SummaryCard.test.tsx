import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import SummaryCard from "../../src/components/cards/SummaryCard";

describe("SummaryCard", () => {
  it("shows helper text when computed is null", () => {
    render(<SummaryCard computed={null} />);
    expect(screen.getByText(/Adjust device counts/i)).toBeInTheDocument();
  });

  it("renders totals and layout numbers", () => {
    render(
      <SummaryCard
        computed={{
          totals: { totalCost: 1000, totalEnergyMWh: 2.5, energyDensity: 0.00123 },
          layout: { siteWidthFt: 40, siteLengthFt: 20, siteAreaSqFt: 800 },
          counts: { MegapackXL: 1, Megapack2: 0, Megapack: 0, PowerPack: 0, Transformer: 1 }
        }}
      />
    );
    expect(screen.getByText("$1,000")).toBeInTheDocument();
    expect(screen.getByText("2.50")).toBeInTheDocument();
    expect(screen.getByText("40")).toBeInTheDocument();
    expect(screen.getByText("20")).toBeInTheDocument();
  });
});
