export type IntegrationProvider = {
  key: string;
  displayName: string;
  category: string;
  allowedCredentialTypes: readonly ["api_secret"];
  supportedScope: "organization" | "workspace";
  implementationStatus: "display_only" | "credential_configured_unverified";
};

// This registry controls accepted provider identifiers and safe browser metadata.
// It deliberately does not represent an operational provider adapter.
export const integrationRegistry = {
  odoo: {
    key: "odoo",
    displayName: "Odoo ERP & PostgreSQL",
    category: "General Ledger",
    allowedCredentialTypes: ["api_secret"],
    supportedScope: "workspace",
    implementationStatus: "display_only",
  },
  zoho: {
    key: "zoho",
    displayName: "Zoho Books & CRA Module",
    category: "Accounting & Tax",
    allowedCredentialTypes: ["api_secret"],
    supportedScope: "organization",
    implementationStatus: "credential_configured_unverified",
  },
  stripe: {
    key: "stripe",
    displayName: "Stripe & Banking Feeds",
    category: "Payment Gateways",
    allowedCredentialTypes: ["api_secret"],
    supportedScope: "workspace",
    implementationStatus: "display_only",
  },
  mcp: {
    key: "mcp",
    displayName: "Anthropic Model Context Protocol (MCP)",
    category: "AI Infrastructure",
    allowedCredentialTypes: ["api_secret"],
    supportedScope: "workspace",
    implementationStatus: "display_only",
  },
  whatsapp: {
    key: "whatsapp",
    displayName: "WhatsApp & Email Gateway",
    category: "Communication",
    allowedCredentialTypes: ["api_secret"],
    supportedScope: "workspace",
    implementationStatus: "display_only",
  },
  bitget: {
    key: "bitget",
    displayName: "Bitget Exchange API",
    category: "Crypto Treasury",
    allowedCredentialTypes: ["api_secret"],
    supportedScope: "workspace",
    implementationStatus: "display_only",
  },
} as const satisfies Record<string, IntegrationProvider>;

export const getIntegrationProvider = (key: string) =>
  integrationRegistry[key as keyof typeof integrationRegistry] ?? null;

export const integrationProviders = Object.values(integrationRegistry);
