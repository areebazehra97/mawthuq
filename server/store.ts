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
  return normalizeState(JSON.parse(raw) as Partial<BackendState>);
}

async function writeLocalState(state: BackendState) {
  await ensureLocalStore();
  await fs.writeFile(storePath, JSON.stringify(state, null, 2), "utf8");
}

export async function readState(): Promise<BackendState> {
  const supabase = getSupabaseAdminClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("mawthuq_app_state")
        .select("state_json")
        .eq("id", "default")
        .maybeSingle();

      if (error) throw error;

      if (data?.state_json) {
        return normalizeState(data.state_json as Partial<BackendState>);
      }

      // First run: seed Supabase
      const seeded = normalizeState(seededBackendState);
      await supabase.from("mawthuq_app_state").upsert({ id: "default", state_json: seeded });
      return seeded;
    } catch (err) {
      console.error("[store] Supabase read failed, falling back to local:", err);
    }
  }

  return readLocalState();
}

export async function writeState(state: BackendState) {
  const normalized = normalizeState(state);
  const supabase = getSupabaseAdminClient();
  if (supabase) {
    const { error } = await supabase.from("mawthuq_app_state").upsert({
      id: "default",
      state_json: normalized,
    });

    if (error) {
      // Throw so callers get a 500 instead of a mysterious 404 on the next read
      throw new Error(`Supabase write failed: ${error.message}`);
    }
    return;
  }

  await writeLocalState(normalized);
}

export async function resetState() {
  await writeState(seededBackendState);
  return seededBackendState;
}

function normalizeState(state: Partial<BackendState>): BackendState {
  return {
    vendors: state.vendors ?? seededBackendState.vendors,
    documents: state.documents ?? seededBackendState.documents,
    extractions: state.extractions ?? seededBackendState.extractions,
    auditRecords: state.auditRecords ?? seededBackendState.auditRecords,
    fieldReviewStates: state.fieldReviewStates ?? seededBackendState.fieldReviewStates,
    ruleReviewStates: state.ruleReviewStates ?? seededBackendState.ruleReviewStates,
    packageConfig: state.packageConfig ?? seededBackendState.packageConfig,
    projects: state.projects ?? seededBackendState.projects,
    packages: state.packages ?? seededBackendState.packages,
    vendorPackageApplications:
      state.vendorPackageApplications ?? seededBackendState.vendorPackageApplications,
    invitations: state.invitations ?? seededBackendState.invitations,
    reports: state.reports ?? seededBackendState.reports,
  };
}
