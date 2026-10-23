import { describe, expect, it } from "vitest";
import {
  isUserPreferenceLanguage,
  mergeUserPreferencesPatch,
  validateUserPreferencesPatch,
  type UserPreferences,
} from "../../../../packages/contracts/src/user-preferences";

const preferences: UserPreferences = {
  userId: "user-1",
  language: "es",
  timeZone: "Europe/Madrid",
  personalNotifications: {
    channels: { inApp: true, email: true, push: false, sound: false },
    types: { info: true, success: true, warning: true, error: true },
  },
  version: 4,
  updatedAt: "2026-10-11T00:00:00.000Z",
};

describe("user preferences contract", () => {
  it("accepts only the shared web/native language catalog", () => {
    expect(isUserPreferenceLanguage("ar")).toBe(true);
    expect(isUserPreferenceLanguage("pt")).toBe(false);
  });

  it("validates language, IANA timezone and notification patches", () => {
    expect(validateUserPreferencesPatch({
      language: "fr",
      timeZone: "Europe/Paris",
      personalNotifications: { channels: { email: false }, types: { warning: false } },
    })).toEqual({
      success: true,
      data: {
        language: "fr",
        timeZone: "Europe/Paris",
        personalNotifications: { channels: { email: false }, types: { warning: false } },
      },
    });
  });

  it.each([
    [{ language: "pt" }, "Choose a supported language."],
    [{ timeZone: "Mars/Olympus" }, "Choose a valid time zone."],
    [{ personalNotifications: { channels: { fax: true } } }, "Choose valid notification preferences."],
    [{ email: "other@example.test" }, "The preference update contains unsupported fields."],
    [{}, "Change at least one preference."],
  ])("rejects invalid preference patches %#", (patch, message) => {
    expect(validateUserPreferencesPatch(patch)).toMatchObject({
      success: false,
      error: { code: "PREFERENCES_VALIDATION_ERROR", message },
    });
  });

  it("merges different notification fields without overwriting the rest of the user's settings", () => {
    expect(mergeUserPreferencesPatch(preferences, {
      personalNotifications: { channels: { email: false } },
      timeZone: "Europe/Paris",
    })).toEqual({
      userId: "user-1",
      language: "es",
      timeZone: "Europe/Paris",
      personalNotifications: {
        channels: { inApp: true, email: false, push: false, sound: false },
        types: { info: true, success: true, warning: true, error: true },
      },
    });
  });
});
