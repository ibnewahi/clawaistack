import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const MAX_BODY_BYTES = 8192;
const ALLOWED_ORIGINS = new Set([
  "https://clawaistack.com",
  "https://www.clawaistack.com",
]);
const LIMITS = {
  first_name: 100, last_name: 100, email: 254, job_title: 150,
  organization: 200, country: 100, contact_no: 40, website: 200,
};
type Lead = {
  first_name: string;
  last_name: string | null;
  email: string;
  job_title: string | null;
  organization: string | null;
  country: string | null;
  contact_no: string | null;
};

export function validateLead(value: unknown): { lead: Lead; honeypot: boolean } {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("invalid");
  const input = value as Record<string, unknown>;
  if (Object.keys(input).some((key) => !Object.hasOwn(LIMITS, key))) throw new Error("invalid");
  const fields: Record<string, string> = {};
  for (const [key, limit] of Object.entries(LIMITS)) {
    const raw = input[key] ?? "";
    if (Object.hasOwn(input, key) && typeof input[key] !== "string") throw new Error("invalid");
    if (typeof raw !== "string" || /[\u0000-\u001f\u007f-\u009f]/u.test(raw)) throw new Error("invalid");
    const text = raw.trim().normalize("NFC");
    if ([...text].length > limit) throw new Error("invalid");
    fields[key] = text;
  }
  if (!fields.first_name || !fields.email) throw new Error("invalid");
  const emailParts = fields.email.split("@");
  const local = emailParts[0];
  const domain = emailParts[1];
  if (emailParts.length !== 2 || !local || !domain || local.length > 64 ||
      !/^[A-Za-z0-9!#$%&'*+/=?^_`{|}~.-]+$/.test(local) ||
      local.startsWith(".") || local.endsWith(".") || local.includes("..") ||
      domain.length > 253 || !domain.includes(".") ||
      !domain.split(".").every((label) =>
        /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?$/.test(label))) throw new Error("invalid");
  let phone: string | null = null;
  if (fields.contact_no) {
    if (!/^\+?[0-9 ()-]+$/.test(fields.contact_no)) throw new Error("invalid");
    phone = fields.contact_no.replace(/[+ ()-]/g, "");
    if (!/^[0-9]{7,15}$/.test(phone)) throw new Error("invalid");
  }
  return {
    honeypot: fields.website !== "",
    lead: {
      first_name: fields.first_name,
      last_name: fields.last_name || null,
      email: `${local}@${domain.toLowerCase()}`,
      job_title: fields.job_title || null,
      organization: fields.organization || null,
      country: fields.country || null,
      contact_no: phone,
    },
  };
}

export async function readBoundedBody(request: Request): Promise<unknown> {
  const length = request.headers.get("content-length");
  if (length !== null && (!/^\d+$/.test(length) || Number(length) > MAX_BODY_BYTES)) {
    throw new Error(/^\d+$/.test(length) ? "too_large" : "invalid");
  }
  if (!request.body) throw new Error("invalid");
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BODY_BYTES) {
        await reader.cancel().catch(() => {});
        throw new Error("too_large");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  if (!size) throw new Error("invalid");
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
}

export function localOriginEnabled(url: string, enabled: string | undefined): boolean {
  if (enabled !== "true") return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" &&
      ["localhost", "127.0.0.1", "[::1]", "kong", "supabase_kong"].includes(parsed.hostname);
  } catch { return false; }
}

export function createHandler(
  insertLead: (lead: Lead) => Promise<void>,
  allowLocal = false,
) {
  return async (request: Request): Promise<Response> => {
    const origin = request.headers.get("origin");
    const allowed = origin !== null && (ALLOWED_ORIGINS.has(origin) ||
      (allowLocal && origin === "http://localhost:5173"));
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      "Vary": "Origin",
    };
    if (allowed) {
      headers["Access-Control-Allow-Origin"] = origin!;
      headers["Access-Control-Allow-Methods"] = "POST, OPTIONS";
      headers["Access-Control-Allow-Headers"] = "content-type, apikey, authorization, x-client-info";
    }
    const respond = (status: number, body: object) => new Response(JSON.stringify(body), { status, headers });
    if (!allowed) return respond(403, { success: false, error: "Request not allowed." });
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
    if (request.method !== "POST") {
      headers.Allow = "POST, OPTIONS";
      return respond(405, { success: false, error: "Method not allowed." });
    }
    const contentType = request.headers.get("content-type") ?? "";
    if (!/^application\/json(?:\s*;\s*charset\s*=\s*(?:utf-8|"utf-8"))?\s*$/i.test(contentType) ||
        (request.headers.get("content-encoding") ?? "identity").toLowerCase() !== "identity") {
      return respond(415, { success: false, error: "Unsupported request format." });
    }
    let parsed: ReturnType<typeof validateLead>;
    try { parsed = validateLead(await readBoundedBody(request)); }
    catch (error) {
      if (error instanceof Error && error.message === "too_large") {
        return respond(413, { success: false, error: "Request too large." });
      }
      return respond(400, { success: false, error: "Invalid request. Check your details." });
    }
    if (!parsed.honeypot) {
      try { await insertLead(parsed.lead); }
      catch {
        console.error("lead_intake_write_failed");
        return respond(503, { success: false, error: "Unable to confirm submission. Please try again later." });
      }
    }
    return respond(200, { success: true });
  };
}

if (import.meta.main) {
  const url = Deno.env.get("SUPABASE_URL") ?? "";
  const allowLocal = localOriginEnabled(url, Deno.env.get("LEAD_INTAKE_ALLOW_LOCALHOST"));
  const handler = createHandler(async (lead) => {
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !key) throw new Error("unavailable");
    const client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { error } = await client.from("leads").insert(lead);
    if (error) throw new Error("write_failed");
  }, allowLocal);
  serve(handler);
}
