import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DeviceCard from "../../src/components/cards/DeviceCard";

describe("DeviceCard", () => {
  it("shows blank when value is 0 (placeholder visible)", () => {
    render(
      <DeviceCard
        type="Megapack"
        def={{ w: 1, d: 1, energyMWh: 1, cost: 1, release: null }}
        value={0}
        onChange={() => {}}
      />
    );
    const input = screen.getByRole("spinbutton");
    expect(input).toHaveValue(null);
    expect(input).toHaveAttribute("placeholder", "0");
  });

  it("calls onChange with typed number string", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <DeviceCard
        type="Megapack"
        def={{ w: 1, d: 1, energyMWh: 1, cost: 1, release: null }}
        value={0}
        onChange={onChange}
      />
    );
    const input = screen.getByRole("spinbutton");
    await user.type(input, "3");
    expect(onChange).toHaveBeenCalled();
    expect(onChange).toHaveBeenLastCalledWith("3");
  });
});
