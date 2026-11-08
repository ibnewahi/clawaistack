DO $$
BEGIN
  UPDATE storage.buckets
  SET
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY[
      'application/pdf',
      'text/csv',
      'application/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/png',
      'image/jpeg'
    ]::text[]
  WHERE id = 'financial-documents';

  IF NOT FOUND THEN
    RAISE EXCEPTION
      'Expected financial-documents bucket does not exist';
  END IF;
END;
$$;
