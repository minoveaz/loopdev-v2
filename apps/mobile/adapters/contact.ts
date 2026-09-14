import { createLocalContactAdapter } from "../../../packages/contracts/src/contact-local-adapter";

export const createMobileContactAdapter = () => createLocalContactAdapter();
export const mobileContactAdapter = createMobileContactAdapter();