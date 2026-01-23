ALTER TABLE group_settings
ADD COLUMN IF NOT EXISTS admin_v2_enabled BOOLEAN DEFAULT false;

COMMENT ON COLUMN group_settings.admin_v2_enabled IS
  'Feature flag to enable the new admin panel (v2)';
