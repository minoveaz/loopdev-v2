import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CRMRecordPicker } from "@/loopdev/components/crm/CRMRecordPicker";

describe("CRMRecordPicker", () => {
  it("searches and returns the selected unified record key", () => {
    const onValueChange = vi.fn();
    render(
      <CRMRecordPicker
        value=""
        onValueChange={onValueChange}
        items={[
          { type: "contact", id: "contact-1", label: "Contact · Alex Rivera" },
          { type: "lead", id: "lead-1", label: "Lead · Alex Rivera" },
        ]}
      />,
    );

    fireEvent.click(screen.getByRole("combobox"));
    expect(screen.getByText("Contact · Alex Rivera")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Lead · Alex Rivera"));

    expect(onValueChange).toHaveBeenCalledWith("lead:lead-1");
  });

  it("shows an empty state when the search has no matches", () => {
    render(
      <CRMRecordPicker
        value=""
        onValueChange={vi.fn()}
        items={[{ type: "contact", id: "contact-1", label: "Contact · Alex Rivera" }]}
      />,
    );

    fireEvent.click(screen.getByRole("combobox"));
    fireEvent.change(screen.getByPlaceholderText("Search CRM records..."), { target: { value: "missing" } });

    expect(screen.getByText("No CRM records found.")).toBeInTheDocument();
  });

  it("restores the selected record label from its unified key", () => {
    render(
      <CRMRecordPicker
        value="contact:contact-1"
        onValueChange={vi.fn()}
        items={[{ type: "contact", id: "contact-1", label: "Contact · Alex Rivera" }]}
      />,
    );

    expect(screen.getByRole("combobox")).toHaveTextContent("Contact · Alex Rivera");
  });
});
