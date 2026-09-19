import pool from "../config/database";

export const createTask = async (
  annotationId: number,
  assignedTo: number,
  title: string,
  description: string,
  priority: string,
  dueDate: string | null
) => {
  const result = await pool.query(
    `INSERT INTO tasks
     (
       annotation_id,
       assigned_to,
       title,
       description,
       status,
       priority,
       due_date
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING
       task_id,
       annotation_id,
       assigned_to,
       title,
       description,
       status,
       priority,
       created_at,
       updated_at,
       due_date`,
    [
      annotationId,
      assignedTo,
      title,
      description,
      "open",
      priority,
      dueDate
    ]
  );

  return result.rows[0];
};
export const getAnnotationTasks = async (
  annotationId: number
) => {
  const result = await pool.query(
    `SELECT
       task_id,
       annotation_id,
       assigned_to,
       title,
       description,
       status,
       priority,
       created_at,
       updated_at,
       due_date
     FROM tasks
     WHERE annotation_id = $1
     ORDER BY created_at ASC`,
    [annotationId]
  );

  return result.rows;
};
export const updateTask = async (
  taskId: number,
  assignedTo: number,
  description: string,
  status: string,
  priority: string,
  dueDate: string | null
) => {
  const result = await pool.query(
    `UPDATE tasks
     SET
       assigned_to = $1,
       description = $2,
       status = $3,
       priority = $4,
       due_date = $5,
       updated_at = CURRENT_TIMESTAMP
     WHERE task_id = $6
     RETURNING
       task_id,
       annotation_id,
       assigned_to,
       title,
       description,
       status,
       priority,
       created_at,
       updated_at,
       due_date`,
    [
      assignedTo,
      description,
      status,
      priority,
      dueDate,
      taskId
    ]
  );

  return result.rows[0] || null;
};
export const deleteTask = async (
  taskId: number
) => {
  const result = await pool.query(
    `DELETE FROM tasks
     WHERE task_id = $1
     RETURNING
       task_id,
       annotation_id,
       assigned_to`,
    [taskId]
  );

  return result.rows[0] || null;
};
export const getTaskDetails = async (
  taskId: number
) => {
  const result = await pool.query(
    `SELECT
       t.task_id,
       t.annotation_id,
       a.version_id,
       mv.model_id,
       cm.project_id
     FROM tasks t
     JOIN annotations a
       ON a.annotation_id = t.annotation_id
     JOIN model_version mv
       ON mv.version_id = a.version_id
     JOIN cad_models cm
       ON cm.model_id = mv.model_id
     WHERE t.task_id = $1`,
    [taskId]
  );

  return result.rows[0] || null;
};