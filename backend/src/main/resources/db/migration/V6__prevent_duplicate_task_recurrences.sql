CREATE UNIQUE INDEX uq_tasks_recurrence_scheduled
    ON tasks(recurrence_source_id, scheduled_for)
    WHERE recurrence_source_id IS NOT NULL
      AND scheduled_for IS NOT NULL
      AND deleted_at IS NULL;

CREATE UNIQUE INDEX uq_tasks_recurrence_due
    ON tasks(recurrence_source_id, due_date)
    WHERE recurrence_source_id IS NOT NULL
      AND scheduled_for IS NULL
      AND due_date IS NOT NULL
      AND deleted_at IS NULL;
