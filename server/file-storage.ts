import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getSupabaseAdminClient } from "./supabase";
import { serverConfig } from "./config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, "data", "uploads");

export interface StoredUpload {
  storagePath: string;
  storageProvider: "local" | "supabase";
  documentHash: string;
}

export async function saveUpload(
  vendorId: string,
  fileName: string,
  bytes: Buffer,
  mimeType: string,
): Promise<StoredUpload> {
  const documentHash = crypto.createHash("sha256").update(bytes).digest("hex");
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `${vendorId}/${documentHash}-${safeName}`;
  const supabase = getSupabaseAdminClient();

  if (supabase) {
    const { error } = await supabase.storage
      .from(serverConfig.supabaseBucket)
      .upload(storagePath, bytes, {
        contentType: mimeType,
        upsert: true,
      });

    if (!error) {
      return {
        storagePath,
        storageProvider: "supabase",
        documentHash,
      };
    }
  }

  await fs.mkdir(uploadsDir, { recursive: true });
  const localPath = path.join(uploadsDir, storagePath);
  await fs.mkdir(path.dirname(localPath), { recursive: true });
  await fs.writeFile(localPath, bytes);

  return {
    storagePath,
    storageProvider: "local",
    documentHash,
  };
}

export async function readUpload(
  storagePath: string,
  storageProvider: "local" | "supabase" | undefined,
): Promise<Buffer | null> {
  if (storageProvider === "supabase") {
    const supabase = getSupabaseAdminClient();
    if (supabase) {
      const { data, error } = await supabase.storage
        .from(serverConfig.supabaseBucket)
        .download(storagePath);
      if (!error && data) {
        return Buffer.from(await data.arrayBuffer());
      }
    }
  }

  const localPath = path.join(uploadsDir, storagePath);
  try {
    return await fs.readFile(localPath);
  } catch {
    return null;
  }
}

export async function clearStoredUploads() {
  const supabase = getSupabaseAdminClient();
  if (supabase) {
    const { data } = await supabase.storage.from(serverConfig.supabaseBucket).list("", {
      limit: 1000,
    });
    if (data?.length) {
      await supabase.storage
        .from(serverConfig.supabaseBucket)
        .remove(data.map((item) => item.name));
    }
  }

  await fs.rm(uploadsDir, { recursive: true, force: true });
}
