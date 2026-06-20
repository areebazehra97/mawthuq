export const serverConfig = {
  openAiApiKey: process.env.OPENAI_API_KEY ?? "",
  openAiModel: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
  promptVersion: process.env.MAWTHUQ_PROMPT_VERSION ?? "2026-06-17",
  supabaseUrl: process.env.SUPABASE_URL ?? "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  supabaseBucket: process.env.SUPABASE_BUCKET ?? "vendor-packages",
  stateStoreDriver: process.env.MAWTHUQ_STATE_DRIVER ?? "local",
};

export function hasOpenAiConfig() {
  return Boolean(serverConfig.openAiApiKey);
}

export function hasSupabaseConfig() {
  return Boolean(serverConfig.supabaseUrl && serverConfig.supabaseServiceRoleKey);
}
