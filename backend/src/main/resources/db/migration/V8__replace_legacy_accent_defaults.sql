UPDATE user_preferences
SET accent_color = '#C63C24'
WHERE lower(accent_color) IN ('indigo', '#6366f1', '#8b5cf6', '#7c3aed');

ALTER TABLE user_preferences ALTER COLUMN accent_color SET DEFAULT '#C63C24';
