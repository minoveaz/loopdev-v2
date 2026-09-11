import { localNotesAdapter } from "./adapter/local";
export * from "./types";
export * from "./serialization";
export { localNotesAdapter };
export const notesAdapter = localNotesAdapter;
