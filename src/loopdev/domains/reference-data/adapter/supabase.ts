import type { ReferenceDataAdapter } from "./index";

/**
 * Boundary for the future Supabase implementation. The local adapter remains
 * the only runtime implementation until the application has a configured
 * Supabase client and RLS-backed persistence.
 */
export interface SupabaseReferenceDataAdapterOptions {
  organizationId: string;
  schema?: string;
}

export type SupabaseReferenceDataAdapterFactory = (
  options: SupabaseReferenceDataAdapterOptions,
) => ReferenceDataAdapter;
