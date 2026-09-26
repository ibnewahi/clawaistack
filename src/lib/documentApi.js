import { supabase } from "./supabase";

const invokeDocumentAdmin = async (body) => {
  const { data, error } = await supabase.functions.invoke("document-admin", { body });

  if (error || !data || data.success !== true) {
    throw new Error("Document request failed");
  }

  return data;
};

const isNonEmptyString = (value) => typeof value === "string" && value.trim().length > 0;

export const prepareDocumentUpload = ({ workspaceId, file }) => {
  if (
    !isNonEmptyString(workspaceId) ||
    !file ||
    !isNonEmptyString(file.name) ||
    !isNonEmptyString(file.mimeType) ||
    !Number.isSafeInteger(file.sizeBytes) ||
    file.sizeBytes < 0
  ) {
    throw new Error("Invalid document upload request");
  }

  return invokeDocumentAdmin({
    action: "prepare-upload",
    workspaceId,
    file: {
      name: file.name,
      mimeType: file.mimeType,
      sizeBytes: file.sizeBytes,
    },
  });
};

export const finalizeDocumentUpload = ({ workspaceId, documentId }) => {
  if (!isNonEmptyString(workspaceId) || !isNonEmptyString(documentId)) {
    throw new Error("Invalid document finalization request");
  }

  return invokeDocumentAdmin({
    action: "finalize-upload",
    workspaceId,
    documentId,
  });
};
