-- Migration 013C: retire direct authenticated browser access to integrations.
-- Integration operations now cross the JWT-authorized integration-admin
-- server boundary, which derives tenant and workspace ownership server-side.

REVOKE SELECT, INSERT, UPDATE ON TABLE public.integrations FROM authenticated;

DROP POLICY IF EXISTS "Tenant insert integrations" ON public.integrations;
DROP POLICY IF EXISTS "Tenant read integrations" ON public.integrations;
DROP POLICY IF EXISTS "Tenant update integrations" ON public.integrations;
