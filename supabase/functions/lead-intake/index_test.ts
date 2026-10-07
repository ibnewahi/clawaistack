import { createHandler, localOriginEnabled, validateLead } from "./index.ts";

function assert(condition: unknown, message = "Assertion failed"): asserts condition {
  if (!condition) throw new Error(message);
}
const valid = { first_name: " Zoë ", email: "Ada@EXAMPLE.COM", contact_no: "+1 (234) 567-8901" };
function request(body: unknown, options: { origin?: string; type?: string; method?: string; raw?: boolean } = {}) {
  return new Request("http://local.test/lead-intake", {
    method: options.method ?? "POST",
    headers: {
      origin: options.origin ?? "https://www.clawaistack.com",
      "content-type": options.type ?? "application/json",
    },
    body: options.method === "GET" || options.method === "OPTIONS" ? undefined :
      options.raw ? body as string : JSON.stringify(body),
  });
}

Deno.test("normalization, Unicode, optional blanks, exact phone, narrow payload", () => {
  const { lead } = validateLead({ ...valid, last_name: " ", organization: "" });
  assert(lead.first_name === "Zoë" && lead.email === "Ada@example.com");
  assert(lead.last_name === null && lead.organization === null);
  assert(lead.contact_no === "12345678901");
  assert(Object.keys(lead).length === 7 && !Object.hasOwn(lead, "id") && !Object.hasOwn(lead, "website"));
  assert(validateLead({ ...valid, contact_no: "00123456789" }).lead.contact_no === "00123456789");
});

Deno.test("invalid fields and request shapes never insert", async () => {
  let calls = 0;
  const handler = createHandler(async () => { calls++; });
  for (const body of [
    { email: valid.email }, { first_name: valid.first_name },
    { ...valid, email: "a@@example.com" }, { ...valid, email: "a@-example.com" },
    { ...valid, first_name: "a".repeat(101) }, { ...valid, id: "1" },
    { ...valid, contact_no: "123abc4567" }, { ...valid, contact_no: "123+456789" },
    { ...valid, first_name: null }, { ...valid, last_name: 42 },
    { ...valid, first_name: "A\nB" }, [], null, "text",
  ]) assert((await handler(request(body))).status === 400);
  assert(calls === 0);
});

Deno.test("valid insert and honeypot have identical success responses", async () => {
  let calls = 0;
  const handler = createHandler(async () => { calls++; });
  const good = await handler(request(valid));
  const trap = await handler(request({ ...valid, website: "bot" }));
  assert(good.status === 200 && trap.status === 200 && calls === 1);
  assert(await good.text() === await trap.text());
});

Deno.test("malformed JSON, wrong content type, oversized actual bytes", async () => {
  const handler = createHandler(async () => { throw new Error("Must not insert"); });
  assert((await handler(request("{", { raw: true }))).status === 400);
  assert((await handler(request("", { raw: true }))).status === 400);
  assert((await handler(request(valid, { type: "text/plain" }))).status === 415);
  assert((await handler(request("x".repeat(8193), { raw: true }))).status === 413);
  const invalidUtf8 = new Request("http://local.test", {
    method: "POST", headers: { origin: "https://clawaistack.com", "content-type": "application/json" },
    body: new Uint8Array([0xff]),
  });
  assert((await handler(invalidUtf8)).status === 400);
});

Deno.test("CORS and methods fail closed", async () => {
  let calls = 0;
  const handler = createHandler(async () => { calls++; });
  for (const origin of ["https://evil.test", "null", "http://localhost:5173"]) {
    const response = await handler(request(valid, { origin }));
    assert(response.status === 403 && !response.headers.has("access-control-allow-origin"));
  }
  const missing = request(valid); missing.headers.delete("origin");
  assert((await handler(missing)).status === 403);
  assert((await handler(request(null, { method: "GET" }))).status === 405);
  const preflight = await handler(request(null, { method: "OPTIONS" }));
  assert(preflight.status === 204 && preflight.headers.get("vary") === "Origin");
  assert(calls === 0);
});

Deno.test("oversized streamed body cancels without Content-Length", async () => {
  let cancelled = false;
  const stream = new ReadableStream<Uint8Array>({
    start(controller) { controller.enqueue(new Uint8Array(8193)); },
    cancel() { cancelled = true; },
  });
  const options = {
    method: "POST",
    headers: { origin: "https://clawaistack.com", "content-type": "application/json" },
    body: stream,
    duplex: "half",
  };
  const handler = createHandler(async () => { throw new Error("Must not insert"); });
  assert((await handler(new Request("http://local.test", options))).status === 413);
  assert(cancelled);
});

Deno.test("local origin requires explicit flag and local backend", () => {
  assert(localOriginEnabled("http://kong:8000", "true"));
  assert(!localOriginEnabled("https://project.supabase.co", "true"));
  assert(!localOriginEnabled("http://localhost:54321", undefined));
});

Deno.test("database failures expose only generic response", async () => {
  const handler = createHandler(async () => { throw new Error("private_database_detail"); });
  const response = await handler(request(valid));
  assert(response.status === 503 && !(await response.text()).includes("private_database_detail"));
});
