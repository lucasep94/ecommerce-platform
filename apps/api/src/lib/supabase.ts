import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "./env";

/**
 * Supabase admin client (service-role). Used by the API to mint signed
 * upload URLs for the admin panel — never exposed to the browser. The
 * service role bypasses RLS, which is fine because all callers of this
 * client go through `requireAuth + requireRole('ADMIN')` first.
 *
 * Singleton: createClient is cheap but holds an internal fetch agent, so
 * we lazy-create once and reuse across requests.
 */
let _client: SupabaseClient | null = null;

export function supabaseAdmin(): SupabaseClient {
  if (_client) return _client;
  _client = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return _client;
}
