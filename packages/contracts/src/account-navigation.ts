export type AccountDestinationId =
  | "account.profile"
  | "account.settings"
  | "account.security"
  | "account.billing";

export type AccountDestination = {
  id: AccountDestinationId;
  path: string;
  legacyPaths: readonly string[];
  access: "authenticated";
  legacyRedirect: "replace";
  enabled: boolean;
};

export const accountDestinations = {
  profile: {
    id: "account.profile",
    path: "/app/account/profile",
    legacyPaths: ["/account/profile"],
    access: "authenticated",
    legacyRedirect: "replace",
    enabled: true,
  },
  settings: {
    id: "account.settings",
    path: "/app/account/settings",
    legacyPaths: ["/account/settings"],
    access: "authenticated",
    legacyRedirect: "replace",
    enabled: true,
  },
  security: {
    id: "account.security",
    path: "/app/account/security",
    legacyPaths: ["/account/security"],
    access: "authenticated",
    legacyRedirect: "replace",
    enabled: true,
  },
  billing: {
    id: "account.billing",
    path: "/app/account/billing",
    legacyPaths: ["/account/billing"],
    access: "authenticated",
    legacyRedirect: "replace",
    enabled: false,
  },
} as const satisfies Record<string, AccountDestination>;
