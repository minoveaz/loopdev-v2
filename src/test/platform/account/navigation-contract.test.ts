import { describe, expect, it } from "vitest";
import { accountDestinations } from "../../../../packages/contracts/src/account-navigation";
import { collectNavRoutes, navigation } from "@/app/navigation";

describe("Account navigation contract", () => {
  it("defines stable protected destinations and replace-redirects for every legacy path", () => {
    const destinations = Object.values(accountDestinations);
    const ids = destinations.map(({ id }) => id);
    const paths = destinations.map(({ path }) => path);
    const legacyPaths = destinations.flatMap(({ legacyPaths: routes }) => routes);

    expect(ids).toEqual([
      "account.profile",
      "account.settings",
      "account.security",
      "account.billing",
    ]);
    expect(new Set(paths).size).toBe(destinations.length);
    expect(new Set(legacyPaths).size).toBe(destinations.length);

    for (const destination of destinations) {
      expect(destination.path).toMatch(/^\/app\/account\//);
      expect(destination.access).toBe("authenticated");
      expect(destination.legacyRedirect).toBe("replace");
      expect(destination.legacyPaths).toHaveLength(1);
      expect(destination.legacyPaths[0]).toMatch(/^\/account\//);
    }
  });

  it("keeps Billing visible as a disabled, non-routable destination until it is ready", () => {
    const billingItem = navigation
      .flatMap((section) => section.items)
      .flatMap((item) => item.children ?? [])
      .find((item) => item.label === "Plan & Billing");

    expect(accountDestinations.billing.enabled).toBe(false);
    expect(billingItem).toMatchObject({
      disabled: true,
      to: accountDestinations.billing.path,
    });
    expect(collectNavRoutes()).not.toContain("/account/billing");
    expect(collectNavRoutes()).not.toContain(accountDestinations.billing.path);
  });
});
