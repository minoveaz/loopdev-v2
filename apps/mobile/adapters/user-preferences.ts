import { UserPreferencesSyncAdapter } from "../../../packages/contracts/src/user-preferences-sync";
import { mobileAuthStorage } from "./mobile-auth-storage";
import { mobileSupabaseClient } from "./supabase";

export const mobileUserPreferencesAdapter = new UserPreferencesSyncAdapter(
  {
    auth: {
      async getUser() {
        const { data, error } = await mobileSupabaseClient.auth.getUser();
        return { data: { user: data.user ? { id: data.user.id } : null }, error };
      },
      async getSession() {
        const { data, error } = await mobileSupabaseClient.auth.getSession();
        return { data: { session: data.session ? { user: { id: data.session.user.id } } : null }, error };
      },
    },
    async rpc(functionName, args) {
      const { data, error } = await mobileSupabaseClient.rpc(functionName, args);
      return { data, error };
    },
  },
  mobileAuthStorage,
);
