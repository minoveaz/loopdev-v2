import {
  UserPreferencesSyncAdapter,
  type UserPreferencesQueueStorage,
} from "../../../../../packages/contracts/src/user-preferences-sync";
import { defaultWebAuthAdapter } from "./auth-supabase";

const browserQueueStorage: UserPreferencesQueueStorage = {
  async getItem(key) {
    if (typeof window === "undefined") throw new Error("Preference recovery storage is unavailable.");
    return window.localStorage.getItem(key);
  },
  async setItem(key, value) {
    if (typeof window === "undefined") throw new Error("Preference recovery storage is unavailable.");
    window.localStorage.setItem(key, value);
  },
  async removeItem(key) {
    if (typeof window === "undefined") throw new Error("Preference recovery storage is unavailable.");
    window.localStorage.removeItem(key);
  },
};

export function getWebUserPreferencesAdapter(): UserPreferencesSyncAdapter {
  const client = defaultWebAuthAdapter.getClient();
  if (!client) throw new Error("Preferences are unavailable until the Auth provider is configured.");
  return new UserPreferencesSyncAdapter({
    auth: {
      async getUser() {
        const { data, error } = await client.auth.getUser();
        return { data: { user: data.user ? { id: data.user.id } : null }, error };
      },
      async getSession() {
        const { data, error } = await client.auth.getSession();
        return { data: { session: data.session ? { user: { id: data.session.user.id } } : null }, error };
      },
    },
    async rpc(functionName, args) {
      const { data, error } = await client.rpc(functionName, args);
      return { data, error };
    },
  }, browserQueueStorage);
}
