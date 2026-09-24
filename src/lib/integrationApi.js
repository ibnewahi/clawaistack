import { supabase } from "./supabase";

const invokeIntegrationAdmin = async (body) => {
  const { data, error } = await supabase.functions.invoke("integration-admin", { body });

  if (error || !data || data.success !== true) {
    throw new Error("Integration request failed");
  }

  return data;
};

export const listIntegrations = (workspaceId) =>
  invokeIntegrationAdmin({ action: "list", workspaceId });

export const configureIntegrationCredential = ({ workspaceId, integrationKey, secret }) =>
  invokeIntegrationAdmin({
    action: "configure",
    workspaceId,
    integrationKey,
    credential: {
      type: "api_secret",
      value: secret,
    },
  });

export const disconnectIntegrationCredential = ({ workspaceId, integrationKey }) =>
  invokeIntegrationAdmin({
    action: "disconnect",
    workspaceId,
    integrationKey,
  });
