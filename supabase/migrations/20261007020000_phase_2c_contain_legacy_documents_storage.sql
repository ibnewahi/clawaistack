DO $$
BEGIN
  UPDATE storage.buckets
  SET public = false
  WHERE id = 'documents';

  IF NOT FOUND THEN
    RAISE EXCEPTION
      'Expected legacy documents bucket does not exist';
  END IF;

  DROP POLICY IF EXISTS "Allow public reads"
  ON storage.objects;

  DROP POLICY IF EXISTS "Allow public uploads"
  ON storage.objects;
END;
$$;
