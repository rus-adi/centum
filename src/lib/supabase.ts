import { createClient } from "@supabase/supabase-js";

export function supabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Supabase env missing: SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
  }

  return createClient(url, key, {
    auth: { persistSession: false }
  });
}

export function attachmentsBucket() {
  return process.env.SUPABASE_STORAGE_BUCKET || "attachments";
}

export function signedUrlTTL() {
  const raw = process.env.SUPABASE_STORAGE_SIGNED_URL_TTL_SECONDS || "600";
  const ttl = parseInt(raw, 10);
  return Number.isFinite(ttl) ? ttl : 600;
}
