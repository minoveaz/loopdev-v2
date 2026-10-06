import { localNotesAdapter } from "./adapter/local";
import { supabaseNotesAdapter } from "./adapter/supabase";
export * from "./types";
export * from "./serialization";
export { createLocalNotesAdapter, localNotesAdapter, LOCAL_NOTES_ORGANIZATION_ID, LOCAL_NOTES_STORAGE_KEY } from "./adapter/local";
export { supabaseNotesAdapter } from "./adapter/supabase";
export const notesAdapter = supabaseNotesAdapter;
