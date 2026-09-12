import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CityCombobox, ReferenceSelect } from "@/loopdev/domains/reference-data";

describe("reference data components", () => {
  it("keeps an unknown legacy value visible in the searchable combobox", () => {
    render(
      <CityCombobox
        items={[{ code: "ES-MAD", label: "Madrid" }]}
        value="Legacy City"
        onValueChange={vi.fn()}
      />,
    );

    expect(screen.getByRole("combobox")).toHaveTextContent("Legacy City (legacy value)");
  });

  it("renders a typed select with a stable code value", () => {
    render(
      <ReferenceSelect
        items={[{ code: "ES", label: "Spain" }]}
        value="ES"
        onValueChange={vi.fn()}
        aria-label="Country"
      />,
    );

    expect(screen.getByRole("combobox", { name: "Country" })).toBeInTheDocument();
  });
});
