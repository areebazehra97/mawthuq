import { createClient } from "@supabase/supabase-js";
import { hasSupabaseConfig, serverConfig } from "./config";

export function getSupabaseAdminClient() {
  if (!hasSupabaseConfig()) {
    return null;
  }

  return createClient(serverConfig.supabaseUrl, serverConfig.supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
