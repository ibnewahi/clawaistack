-- Migration 013D: align trigger-generated document keys with document-admin.
--
-- Existing rows are intentionally untouched. The insert trigger remains
-- authoritative while direct authenticated inserts still exist.

CREATE OR REPLACE FUNCTION public.enforce_document_insert()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO ''
AS $function$
declare
    v_uid uuid;
    v_safe_file_name text;
begin

    v_uid := auth.uid();

    if v_uid is not null then
        new.uploaded_by_user_id := v_uid;
    end if;

    new.bucket_id := 'financial-documents';

    new.status := 'PENDING_UPLOAD';

    new.original_file_name := btrim(new.original_file_name);

    v_safe_file_name :=
        regexp_replace(
            new.original_file_name,
            '[^A-Za-z0-9._-]+',
            '_',
            'g'
        );

    v_safe_file_name := btrim(v_safe_file_name, '._-');

    if v_safe_file_name = '' then
        v_safe_file_name := 'document';
    end if;

    if new.id is null then
        new.id := gen_random_uuid();
    end if;

    new.object_path :=
        'organizations/'
        || new.organization_id::text
        || '/workspaces/'
        || new.workspace_id::text
        || '/documents/'
        || new.id::text
        || '/'
        || v_safe_file_name;

    return new;
end;
$function$;
