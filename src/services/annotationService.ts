import pool from "../config/database";

export const createAnnotation = async (
  versionId: number,
  userId: number,
  x: number,
  y: number,
  z: number,
  comment: string
) => {
  const result = await pool.query(
    `INSERT INTO annotations
     (version_id, user_id, x, y, z, comment)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING
       annotation_id,
       version_id,
       user_id,
       x,
       y,
       z,
       comment,
       created_at,
       status,
       updated_at`,
    [
      versionId,
      userId,
      x,
      y,
      z,
      comment
    ]
  );

  return result.rows[0];
};
export const getAnnotations = async (
  versionId: number
) => {
  const result = await pool.query(
    `SELECT
       annotation_id,
       version_id,
       user_id,
       x,
       y,
       z,
       comment,
       created_at,
       status,
       updated_at
     FROM annotations
     WHERE version_id = $1
     ORDER BY created_at ASC`,
    [versionId]
  );

  return result.rows;
};
export const updateAnnotation = async (
  annotationId: number,
  comment: string,
  status: string
) => {
  const result = await pool.query(
    `UPDATE annotations
     SET
       comment = $1,
       status = $2,
       updated_at = CURRENT_TIMESTAMP
     WHERE annotation_id = $3
     RETURNING
       annotation_id,
       version_id,
       user_id,
       x,
       y,
       z,
       comment,
       created_at,
       status,
       updated_at`,
    [
      comment,
      status,
      annotationId
    ]
  );

  return result.rows[0] || null;
};
export const deleteAnnotation = async (
  annotationId: number
) => {
  const result = await pool.query(
    `DELETE FROM annotations
     WHERE annotation_id = $1
     RETURNING
       annotation_id,
       version_id,
       user_id`,
    [annotationId]
  );

  return result.rows[0] || null;
};
export const getAnnotationDetails = async (
  annotationId: number
) => {
  const result = await pool.query(
    `SELECT
       a.annotation_id,
       a.version_id,
       mv.model_id,
       cm.project_id
     FROM annotations a
     JOIN model_version mv
       ON mv.version_id = a.version_id
     JOIN cad_models cm
       ON cm.model_id = mv.model_id
     WHERE a.annotation_id = $1`,
    [annotationId]
  );

  return result.rows[0] || null;
};
