import { createProfileAvatarAdapter } from "../../../../../packages/contracts/src/profile-avatar-adapter";
import { supabasePrivateUserFilesAdapter } from "../../files/adapter/private-user-files-supabase";
import { defaultWebAuthAdapter } from "./auth-supabase";

export const supabaseProfileAvatarAdapter = createProfileAvatarAdapter(
  defaultWebAuthAdapter,
  supabasePrivateUserFilesAdapter,
);
