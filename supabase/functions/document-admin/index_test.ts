import { handleDocumentRequest, resolveFileMetadata, resolveTrustedObjectLocation } from "./index.ts";

function assert(value: unknown, message = "Assertion failed"): asserts value {
  if (!value) throw new Error(message);
}
const workspace = "00000000-0000-4000-8000-000000000001";
const organization = "00000000-0000-4000-8000-000000000002";
const documentId = "00000000-0000-4000-8000-000000000003";
const path = `organizations/${organization}/workspaces/${workspace}/documents/${documentId}/report.pdf`;
const file = { name: "report.pdf", mimeType: "application/pdf", sizeBytes: 12 };

for (const [extension, mime] of [
  ["pdf", "application/pdf"], ["csv", "text/csv"], ["csv", "application/csv"],
  ["xls", "application/vnd.ms-excel"],
  ["xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
  ["png", "image/png"], ["jpg", "image/jpeg"], ["jpeg", "image/jpeg"],
]) {
  Deno.test(`accepted metadata: ${extension} / ${mime}`, () => {
    assert(resolveFileMetadata({ name: `report.${extension}`, mimeType: mime, sizeBytes: 10485760 }));
  });
}
Deno.test("invalid metadata and over-limit declarations fail closed", () => {
  for (const value of [null, [], {}, { ...file, sizeBytes: 10485761 }, { ...file, sizeBytes: 0 },
    { ...file, sizeBytes: 1.5 }, { ...file, mimeType: "text/html" },
    { ...file, mimeType: "image/png" }, { ...file, name: "report.exe" },
    { ...file, name: " " }, { ...file, extra: true }]) assert(resolveFileMetadata(value) === null);
});
Deno.test("filename sanitization strips paths, controls, and double-extension punctuation", () => {
  const result = resolveFileMetadata({ ...file, name: "../folder\\bad\r\n<script>.exe.PDF" });
  assert(result && result.safeFileName.endsWith(".pdf"));
  assert(!/[\\/\r\n<>]/.test(result.safeFileName));
  assert(result.safeFileName.split(".").length === 2);
  assert(resolveFileMetadata({ ...file, name: `${"a".repeat(300)}.pdf` })!.safeFileName.length <= 180);
});
Deno.test("canonical path rejects tenant changes, traversal and controls", () => {
  assert(resolveTrustedObjectLocation(path, organization, workspace, documentId));
  for (const bad of [path.replace(workspace, documentId), `${path}/extra`,
    path.replace("report.pdf", ".."), path.replace("report.pdf", "bad\\file.pdf"),
    path.replace("report.pdf", "bad\n.pdf")]) {
    assert(resolveTrustedObjectLocation(bad, organization, workspace, documentId) === null);
  }
});

function harness(options: {
  permitted?: boolean; document?: Record<string, unknown>; objects?: unknown[]; authenticated?: boolean;
} = {}) {
  const calls: { table: string; operation: string; value?: unknown }[] = [];
  const signed: unknown[][] = [];
  const permissions: { name: string; args: Record<string, unknown> }[] = [];
  const filters: { table: string; column: string; value: unknown }[] = [];
  const rpcCalls: Record<string, unknown>[] = [];
  let adminCreated = 0;
  let transitioned = false;
  let finalizations = 0;
  const row: Record<string, unknown> = {
    id: documentId, organization_id: organization, workspace_id: workspace,
    bucket_id: "financial-documents", object_path: path, original_file_name: "untrusted.html",
    mime_type: "application/pdf", file_size_bytes: 12, status: "PENDING_UPLOAD",
    ...options.document,
  };
  const user = {
    auth: { getUser: async () => ({ data: { user: options.authenticated === false ? null : { id: documentId } }, error: null }) },
    rpc: async (name: string, args: Record<string, unknown>) => {
      permissions.push({ name, args });
      return { data: options.permitted !== false, error: null };
    },
  };
  const admin = {
    from(table: string) {
      const query = {
        select() { return query; },
        eq(column: string, value: unknown) { filters.push({ table, column, value }); return query; },
        async maybeSingle() { return { data: table === "workspaces" ? { id: workspace, organization_id: organization } : row, error: null }; },
        async insert(value: unknown) { calls.push({ table, operation: "insert", value }); return { error: null }; },
      };
      return query;
    },
    storage: { from(bucket: string) {
      assert(bucket === "financial-documents");
      return {
        async list() { return { data: options.objects ?? [{ id: "local-object", name: "report.pdf", metadata: { size: 12, mimetype: "application/pdf" } }], error: null }; },
        async createSignedUrl(...args: unknown[]) { signed.push(args); return { data: { signedUrl: "https://local.test/signed" }, error: null }; },
        async createSignedUploadUrl(objectPath: string) { return { data: { path: objectPath, token: "local-test-placeholder" }, error: null }; },
      };
    } },
    async rpc(name: string, args: Record<string, unknown>) {
      assert(name === "finalize_document_upload");
      rpcCalls.push(args);
      const changed = !transitioned;
      transitioned = true;
      row.status = "UPLOADED";
      finalizations++;
      return { data: [{ document_id: documentId, status: "UPLOADED", transitioned: changed }], error: null };
    },
  };
  const factory = ((_: string, key: string) => {
    if (key === "local-user") return user;
    adminCreated++;
    return admin;
  }) as unknown as Parameters<typeof handleDocumentRequest>[1];
  const env = (name: string) => name === "SUPABASE_ANON_KEY" ? "local-user" : "local-placeholder";
  const request = (body: unknown, raw = false) => handleDocumentRequest(new Request("https://local.test/document-admin", {
    method: "POST", headers: { Authorization: "Bearer local-test-placeholder", "Content-Type": "application/json" },
    body: raw ? body as string : JSON.stringify(body),
  }), factory, env);
  return { request, calls, signed, permissions, filters, rpcCalls, finalizations: () => finalizations, adminCreated: () => adminCreated };
}
Deno.test("malformed requests and unauthorized workspace do not write", async () => {
  const h = harness();
  for (const payload of [[], {}, { action: "prepare-upload", workspaceId: workspace, extra: true }]) {
    assert((await h.request(payload)).status === 400);
  }
  assert((await h.request("{", true)).status === 400);
  const denied = harness({ permitted: false });
  assert((await denied.request({ action: "prepare-upload", workspaceId: workspace, file })).status === 403);
  assert(denied.calls.length === 0 && h.calls.length === 0);
  assert(denied.adminCreated() === 0);
  assert(denied.permissions[0].name === "has_workspace_permission");
  assert(denied.permissions[0].args.p_workspace_id === workspace);
  assert(denied.permissions[0].args.p_permission_key === "document.upload");
});
Deno.test("failed authentication cannot reach permission checks or privileged client", async () => {
  const h = harness({ authenticated: false });
  assert((await h.request({ action: "prepare-upload", workspaceId: workspace, file })).status === 401);
  assert(h.permissions.length === 0 && h.adminCreated() === 0);
});
Deno.test("prepare constructs a server-derived canonical path", async () => {
  const h = harness();
  const response = await h.request({ action: "prepare-upload", workspaceId: workspace, file });
  assert(response.status === 200);
  const body = await response.json();
  assert(resolveTrustedObjectLocation(body.upload.objectPath, organization, workspace, body.document.id));
  assert(body.upload.objectPath.endsWith("/report.pdf"));
  const inserted = h.calls.find((call) => call.table === "documents")!.value as Record<string, unknown>;
  assert(inserted.object_path === body.upload.objectPath && inserted.id === body.document.id);
  assert(inserted.organization_id === organization && inserted.workspace_id === workspace);
  assert(inserted.bucket_id === "financial-documents" && inserted.uploaded_by_user_id === documentId);
});
for (const [label, objects] of [
  ["missing", []],
  ["size mismatch", [{ id: "local-object", name: "report.pdf", metadata: { size: 13, mimetype: "application/pdf" } }]],
  ["MIME mismatch", [{ id: "local-object", name: "report.pdf", metadata: { size: 12, mimetype: "image/png" } }]],
] as const) {
  Deno.test(`finalization rejects ${label}`, async () => {
    const h = harness({ objects: [...objects] });
    assert((await h.request({ action: "finalize-upload", workspaceId: workspace, documentId })).status === 409);
    assert(h.finalizations() === 0);
  });
}
Deno.test("cross-workspace document cannot finalize or download", async () => {
  const h = harness({ document: { workspace_id: documentId, status: "UPLOADED" } });
  for (const action of ["finalize-upload", "authorize-download"]) {
    assert((await h.request({ action, workspaceId: workspace, documentId })).status === 404);
  }
  assert(h.finalizations() === 0 && h.signed.length === 0);
});
Deno.test("repeated finalization preserves RPC transitioned result", async () => {
  const h = harness();
  const body = { action: "finalize-upload", workspaceId: workspace, documentId };
  assert((await (await h.request(body)).json()).transitioned === true);
  assert((await (await h.request(body)).json()).transitioned === false);
  assert(h.finalizations() === 2);
  for (const args of h.rpcCalls) {
    assert(args.p_document_id === documentId && args.p_workspace_id === workspace);
    assert(args.p_organization_id === organization && args.p_actor_user_id === documentId);
    assert(args.p_stored_size_bytes === 12 && args.p_stored_mime_type === "application/pdf");
  }
});
Deno.test("download uses canonical attachment basename and unchanged 60-second TTL", async () => {
  const h = harness({ document: {
    id: documentId, organization_id: organization, workspace_id: workspace,
    bucket_id: "financial-documents", object_path: path,
    original_file_name: "ignored\r\n<script>.html", status: "UPLOADED",
  } });
  assert((await h.request({ action: "authorize-download", workspaceId: workspace, documentId })).status === 200);
  assert(h.signed.length === 1 && h.signed[0][0] === path && h.signed[0][1] === 60);
  assert((h.signed[0][2] as { download: string }).download === "report.pdf");
  assert(h.calls.length === 1 && h.calls[0].table === "audit_events");
  assert(h.permissions[0].args.p_permission_key === "document.read");
  for (const [column, value] of [["id", documentId], ["organization_id", organization], ["workspace_id", workspace]]) {
    assert(h.filters.some((filter) => filter.table === "documents" && filter.column === column && filter.value === value));
  }
  const audit = h.calls[0].value as Record<string, unknown>;
  assert(audit.event_type === "document.download_authorized" && audit.subject_id === documentId);
  assert(audit.workspace_id === workspace && audit.organization_id === organization);
});
Deno.test("attachment basename handles hostile historical paths without header/query injection", async () => {
  for (const basename of ["quote\";evil.pdf", "%0d%0a.pdf", "odd雪.pdf", "a.exe.pdf", `${"a".repeat(300)}.pdf`, "unknown.bin"]) {
    const h = harness({ document: { object_path: path.replace("report.pdf", basename), status: "UPLOADED" } });
    assert((await h.request({ action: "authorize-download", workspaceId: workspace, documentId })).status === 200);
    const filename = (h.signed[0][2] as { download: string }).download;
    assert(/^[A-Za-z0-9 _-]+(?:\.[a-z]+)?$/.test(filename) && filename.length <= 180);
    if (basename === "unknown.bin") assert(filename === "document");
  }
  for (const basename of ["..", "", "bad/extra.pdf", "bad\\file.pdf", "bad\r\n.pdf"]) {
    const h = harness({ document: { object_path: path.replace("report.pdf", basename), status: "UPLOADED" } });
    assert((await h.request({ action: "authorize-download", workspaceId: workspace, documentId })).status === 404);
    assert(h.signed.length === 0);
  }
});
