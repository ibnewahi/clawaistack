-- Migration 013C: server-only integration credential persistence primitives.
--
-- Rollback note: a future controlled migration may revoke or drop these RPCs.
-- It must not delete existing integration_credentials rows, Vault secrets, or
-- historical integration ownership as part of that rollback.

-- The 16 KiB limit is deliberately well above common API credential sizes while
-- bounding accidental oversized request bodies. The original secret text is not
-- trimmed or transformed before storage.
CREATE OR REPLACE FUNCTION public.store_integration_credential(
  p_integration_id uuid,
  p_credential_type text,
  p_secret text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_integration_id uuid;
  v_vault_secret_id uuid;
  v_vault_name text;
  v_vault_description constant text := 'ClawAI Stack integration credential';
BEGIN
  IF p_integration_id IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'invalid integration credential request';
  END IF;

  IF p_credential_type IS NULL OR p_credential_type <> 'api_secret' THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'invalid integration credential request';
  END IF;

  IF p_secret IS NULL OR pg_catalog.btrim(p_secret) = '' OR pg_catalog.length(p_secret) > 16384 THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'invalid integration credential request';
  END IF;

  -- Locking the parent serializes configure/disconnect operations for this integration.
  SELECT integrations.id
  INTO v_integration_id
  FROM public.integrations
  WHERE integrations.id = p_integration_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION USING ERRCODE = 'P0002', MESSAGE = 'integration credential persistence failed';
  END IF;

  v_vault_name := pg_catalog.format(
    'clawai-integration-%s-%s',
    v_integration_id::text,
    p_credential_type
  );

  -- Lock the exact existing relationship when present; the parent lock covers
  -- the no-row case and prevents concurrent duplicate Vault creation.
  SELECT credentials.vault_secret_id
  INTO v_vault_secret_id
  FROM public.integration_credentials AS credentials
  WHERE credentials.integration_id = v_integration_id
    AND credentials.credential_type = p_credential_type
  FOR UPDATE;

  IF FOUND THEN
    PERFORM vault.update_secret(
      v_vault_secret_id,
      p_secret,
      v_vault_name,
      v_vault_description,
      NULL
    );
  ELSE
    v_vault_secret_id := vault.create_secret(
      p_secret,
      v_vault_name,
      v_vault_description,
      NULL
    );

    IF v_vault_secret_id IS NULL THEN
      RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'integration credential persistence failed';
    END IF;

    INSERT INTO public.integration_credentials (
      integration_id,
      vault_secret_id,
      credential_type,
      created_at,
      updated_at
    )
    VALUES (
      v_integration_id,
      v_vault_secret_id,
      p_credential_type,
      pg_catalog.clock_timestamp(),
      pg_catalog.clock_timestamp()
    );
  END IF;

  -- Stored credentials are not evidence of provider verification.
  UPDATE public.integrations
  SET is_connected = false,
      updated_at = pg_catalog.clock_timestamp()
  WHERE id = v_integration_id;

  RETURN true;
END;
$$;

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
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'invalid integration credential request';
  END IF;

  IF p_credential_type IS NULL OR p_credential_type <> 'api_secret' THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'invalid integration credential request';
  END IF;

  -- Locking the parent serializes configure/disconnect operations for this integration.
  SELECT integrations.id
  INTO v_integration_id
  FROM public.integrations
  WHERE integrations.id = p_integration_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION USING ERRCODE = 'P0002', MESSAGE = 'integration credential persistence failed';
  END IF;

  SELECT credentials.id, credentials.vault_secret_id
  INTO v_credential_id, v_vault_secret_id
  FROM public.integration_credentials AS credentials
  WHERE credentials.integration_id = v_integration_id
    AND credentials.credential_type = p_credential_type
  FOR UPDATE;
  v_has_credential := FOUND;

  -- A local disconnect state is committed atomically with credential deletion.
  UPDATE public.integrations
  SET is_connected = false,
      updated_at = pg_catalog.clock_timestamp()
  WHERE id = v_integration_id;

  IF NOT v_has_credential THEN
    -- The integration exists but no credential relationship remains: idempotent success.
    RETURN false;
  END IF;

  -- Lock the exact Vault row before removing the relationship that restricts it.
  PERFORM 1
  FROM vault.secrets
  WHERE id = v_vault_secret_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'integration credential persistence failed';
  END IF;

  -- The FK is ON DELETE RESTRICT, so delete the relationship before its Vault row.
  DELETE FROM public.integration_credentials
  WHERE id = v_credential_id
    AND integration_id = v_integration_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'integration credential persistence failed';
  END IF;

  DELETE FROM vault.secrets
  WHERE id = v_vault_secret_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'integration credential persistence failed';
  END IF;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.store_integration_credential(uuid, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.store_integration_credential(uuid, text, text) FROM anon;
REVOKE ALL ON FUNCTION public.store_integration_credential(uuid, text, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.store_integration_credential(uuid, text, text) TO service_role;

REVOKE ALL ON FUNCTION public.delete_integration_credential(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.delete_integration_credential(uuid, text) FROM anon;
REVOKE ALL ON FUNCTION public.delete_integration_credential(uuid, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.delete_integration_credential(uuid, text) TO service_role;
