import { createProfileAvatarAdapter } from "../../../packages/contracts/src/profile-avatar-adapter";
import { mobileAuthAdapter } from "./auth";
import { mobilePrivateUserFilesAdapter } from "./private-user-files";

export const mobileProfileAvatarAdapter = createProfileAvatarAdapter(
  mobileAuthAdapter,
  mobilePrivateUserFilesAdapter,
);
