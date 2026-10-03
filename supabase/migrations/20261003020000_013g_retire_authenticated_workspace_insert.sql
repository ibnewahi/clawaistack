-- Migration 013G: retire the legacy browser-direct workspace creation grant.
--
-- Workspace creation now crosses public.create_workspace; RLS remains
-- defense-in-depth for the table's remaining authorized access paths.

REVOKE INSERT ON TABLE public.workspaces FROM authenticated;
