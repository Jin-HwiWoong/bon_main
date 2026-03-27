DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM branches
    GROUP BY name
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Cannot add branches_name_unique: duplicate branch names exist.';
  END IF;
END $$;

DROP INDEX IF EXISTS branches_name_idx;
CREATE UNIQUE INDEX IF NOT EXISTS branches_name_unique ON branches (name);
