import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { seededBackendState } from "../src/data/seed";
import type { BackendState } from "../src/types";
import { getSupabaseAdminClient } from "./supabase";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, "data");
const storePath = path.join(dataDir, "store.json");

async function ensureLocalStore() {
  await fs.mkdir(dataDir, { recursive: true });

  try {
    await fs.access(storePath);
  } catch {
    await fs.writeFile(storePath, JSON.stringify(seededBackendState, null, 2), "utf8");
  }
}

async function readLocalState(): Promise<BackendState> {
  await ensureLocalStore();
  const raw = await fs.readFile(storePath, "utf8");
  return JSON.parse(raw) as BackendState;
}

async function writeLocalState(state: BackendState) {
  await ensureLocalStore();
  await fs.writeFile(storePath, JSON.stringify(state, null, 2), "utf8");
}

export async function readState(): Promise<BackendState> {
  const supabase = getSupabaseAdminClient();
  if (supabase) {
    const { data, error } = await supabase
      .from("mawthuq_app_state")
      .select("state_json")
      .eq("id", "default")
      .maybeSingle();

    if (!error && data?.state_json) {
      return data.state_json as BackendState;
    }

    await supabase.from("mawthuq_app_state").upsert({
      id: "default",
      state_json: seededBackendState,
    });
  }

  return readLocalState();
}

export async function writeState(state: BackendState) {
  const supabase = getSupabaseAdminClient();
  if (supabase) {
    const { error } = await supabase.from("mawthuq_app_state").upsert({
      id: "default",
      state_json: state,
    });

    if (!error) {
      return;
    }
  }

  await writeLocalState(state);
}

export async function resetState() {
  await writeState(seededBackendState);
  return seededBackendState;
}
