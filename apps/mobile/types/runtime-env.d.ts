interface ImportMeta {
  readonly env: {
    readonly DEV: boolean;
    readonly MODE: string;
    readonly VITE_SUPABASE_ANON_KEY?: string;
    readonly VITE_SUPABASE_URL?: string;
  };
}
