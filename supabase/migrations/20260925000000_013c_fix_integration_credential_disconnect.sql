-- Migration 013C:
-- Fix integration credential disconnect Vault privilege failure.
------------------------------------------------------------------

-- Root cause:
-- delete_integration_credential used SELECT ... FOR UPDATE on vault.secrets.
-- The SECURITY DEFINER owner has SELECT and DELETE privileges on
-- vault.secrets, but intentionally does not have UPDATE privilege.
--------------------------------------------------------------------

-- Fix:
-- Remove only the unnecessary FOR UPDATE lock from the Vault existence
-- check. Do not broaden Vault privileges.

CREATE OR REPLACE FUNCTION public.delete_integration_credential(
p_integration_id uuid,
p_credential_type text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
v_integration_id uuid;
v_credential_id uuid;
v_vault_secret_id uuid;
v_has_credential boolean := false;
BEGIN
IF p_integration_id IS NULL THEN
RAISE EXCEPTION USING
ERRCODE = '22023',
MESSAGE = 'invalid integration credential request';
END IF;

IF p_credential_type IS NULL OR p_credential_type <> 'api_secret' THEN
RAISE EXCEPTION USING
ERRCODE = '22023',
MESSAGE = 'invalid integration credential request';
END IF;

SELECT integrations.id
INTO v_integration_id
FROM public.integrations
WHERE integrations.id = p_integration_id
FOR UPDATE;

IF NOT FOUND THEN
RAISE EXCEPTION USING
ERRCODE = 'P0002',
MESSAGE = 'integration credential persistence failed';
END IF;

SELECT
credentials.id,
credentials.vault_secret_id
INTO
v_credential_id,
v_vault_secret_id
FROM public.integration_credentials AS credentials
WHERE credentials.integration_id = v_integration_id
AND credentials.credential_type = p_credential_type
FOR UPDATE;

v_has_credential := FOUND;

UPDATE public.integrations
SET
is_connected = false,
updated_at = pg_catalog.clock_timestamp()
WHERE id = v_integration_id;

IF NOT v_has_credential THEN
RETURN false;
END IF;

-- Intentionally no FOR UPDATE here.
-- The function owner has SELECT and DELETE on vault.secrets,
-- but does not require UPDATE privilege for this operation.
PERFORM 1
FROM vault.secrets
WHERE id = v_vault_secret_id;

IF NOT FOUND THEN
RAISE EXCEPTION USING
ERRCODE = 'P0001',
MESSAGE = 'integration credential persistence failed';
END IF;

DELETE FROM public.integration_credentials
WHERE id = v_credential_id
AND integration_id = v_integration_id;

IF NOT FOUND THEN
RAISE EXCEPTION USING
ERRCODE = 'P0001',
MESSAGE = 'integration credential persistence failed';
END IF;

DELETE FROM vault.secrets
WHERE id = v_vault_secret_id;

IF NOT FOUND THEN
RAISE EXCEPTION USING
ERRCODE = 'P0001',
MESSAGE = 'integration credential persistence failed';
END IF;

RETURN true;
END;
$$;
