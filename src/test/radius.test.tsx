import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { SelectTrigger, Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

/**
 * Lightweight visual-regression guard for the Rivera radius system.
 *
 * Canonical tokens (see chat history + index.css):
 *  - Controls (button / input / textarea / select trigger / tab):  rounded-lg or rounded-md
 *  - Cards / dialogs / dropdowns / popovers / sheet panels:        rounded-xl
 *  - Badges:                                                       rounded-md (NOT rounded-full)
 *
 * If anyone tightens or loosens a radius on a key surface, these tests fail.
 * Source-level checks (regex on file contents) are used for surfaces that are
 * awkward to render in jsdom (Dialog/Dropdown portals, Popover, Sheet, AlertDialog).
 */

const cls = (el: HTMLElement | null) => el?.className ?? "";

describe("radius system — rendered components", () => {
  it("Button uses rounded-lg", () => {
    const { container } = render(<Button>x</Button>);
    expect(cls(container.querySelector("button"))).toMatch(/\brounded-lg\b/);
  });

  it("Input uses rounded-lg", () => {
    const { container } = render(<Input />);
    expect(cls(container.querySelector("input"))).toMatch(/\brounded-lg\b/);
  });

  it("Textarea uses rounded-lg", () => {
    const { container } = render(<Textarea />);
    expect(cls(container.querySelector("textarea"))).toMatch(/\brounded-lg\b/);
  });

  it("SelectTrigger uses rounded-lg", () => {
    const { container } = render(
      <Select>
        <SelectTrigger>x</SelectTrigger>
      </Select>,
    );
    expect(cls(container.querySelector("button"))).toMatch(/\brounded-lg\b/);
  });

  it("Badge uses rounded-md and NOT rounded-full", () => {
    const { container } = render(<Badge>x</Badge>);
    const c = cls(container.firstChild as HTMLElement);
    expect(c).toMatch(/\brounded-md\b/);
    expect(c).not.toMatch(/\brounded-full\b/);
  });

  it("Card surface uses surface-card (rounded-xl) — no rounded-2xl/3xl", () => {
    const { container } = render(<Card>x</Card>);
    const c = cls(container.firstChild as HTMLElement);
    expect(c).toMatch(/\bsurface-card\b/);
    expect(c).not.toMatch(/\brounded-(2xl|3xl)\b/);
  });

  it("TabsList uses rounded-lg, TabsTrigger uses rounded-sm", () => {
    const { container } = render(
      <Tabs defaultValue="a">
        <TabsList>
          <TabsTrigger value="a">a</TabsTrigger>
        </TabsList>
      </Tabs>,
    );
    expect(cls(container.querySelector('[role="tablist"]'))).toMatch(/\brounded-lg\b/);
    expect(cls(container.querySelector('[role="tab"]'))).toMatch(/\brounded-sm\b/);
  });
});

describe("radius system — source contract (portaled surfaces)", () => {
  // Read source at test time so we catch class-string changes without booting a browser.
  const read = async (p: string) => {
    const fs = await import("node:fs/promises");
    const path = await import("node:path");
    return fs.readFile(path.resolve(process.cwd(), p), "utf8");
  };

  it("Dialog content is rounded-xl", async () => {
    const src = await read("src/components/ui/dialog.tsx");
    expect(src).toMatch(/rounded-xl/);
    expect(src).not.toMatch(/rounded-(2xl|3xl)/);
  });

  it("AlertDialog content is sm:rounded-xl", async () => {
    const src = await read("src/components/ui/alert-dialog.tsx");
    expect(src).toMatch(/sm:rounded-xl/);
  });

  it("DropdownMenu content is rounded-xl", async () => {
    const src = await read("src/components/ui/dropdown-menu.tsx");
    // Both Content and SubContent should use rounded-xl
    const matches = src.match(/rounded-xl/g) ?? [];
    expect(matches.length).toBeGreaterThanOrEqual(2);
  });

  it("Popover content is rounded-xl", async () => {
    const src = await read("src/components/ui/popover.tsx");
    expect(src).toMatch(/rounded-xl/);
  });

  it("Sheet/Drawer use rounded-xl (no legacy rounded-2xl/3xl)", async () => {
    const sheet = await read("src/components/ui/sheet.tsx");
    const drawer = await read("src/components/ui/drawer.tsx");
    expect(sheet).not.toMatch(/rounded-(2xl|3xl)/);
    expect(drawer).not.toMatch(/rounded-(2xl|3xl)/);
    expect(drawer).toMatch(/rounded-(t-)?xl/);
  });

  it("Toast uses rounded-lg", async () => {
    const src = await read("src/components/ui/toast.tsx");
    expect(src).toMatch(/rounded-lg/);
  });

  it("--radius token is 0.5rem (8px), --radius-sm is 0.375rem (6px)", async () => {
    const css = await read("src/index.css");
    expect(css).toMatch(/--radius:\s*0\.5rem/);
    expect(css).toMatch(/--radius-sm:\s*0\.375rem/);
  });
});