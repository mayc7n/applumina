ALTER TABLE tasks
    ADD COLUMN reminder_at TIMESTAMPTZ,
    ADD COLUMN recurrence_source_id UUID REFERENCES tasks(id) ON DELETE SET NULL;

CREATE INDEX idx_tasks_user_reminder
    ON tasks(user_id, reminder_at)
    WHERE reminder_at IS NOT NULL AND deleted_at IS NULL AND status <> 'DONE';

CREATE INDEX idx_tasks_recurrence_source
    ON tasks(recurrence_source_id, scheduled_for, due_date)
    WHERE recurrence_source_id IS NOT NULL AND deleted_at IS NULL;

ALTER TABLE task_projects ALTER COLUMN color SET DEFAULT '#C63C24';
ALTER TABLE labels ALTER COLUMN color SET DEFAULT '#C63C24';
