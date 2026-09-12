import { localNotesAdapter } from "./adapter/local";
export * from "./types";
export * from "./serialization";
export { createLocalNotesAdapter, localNotesAdapter, LOCAL_NOTES_ORGANIZATION_ID, LOCAL_NOTES_STORAGE_KEY } from "./adapter/local";
export const notesAdapter = localNotesAdapter;
