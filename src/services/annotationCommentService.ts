import pool from "../config/database";

export const createAnnotationComment = async (
  annotationId: number,
  userId: number,
  comment: string
) => {
  const result = await pool.query(
    `INSERT INTO annotation_comments
     (annotation_id, user_id, comment)
     VALUES ($1, $2, $3)
     RETURNING
       comment_id,
       annotation_id,
       user_id,
       comment,
       created_at`,
    [
      annotationId,
      userId,
      comment
    ]
  );

  return result.rows[0];
};
export const getAnnotationComments = async (
  annotationId: number
) => {
  const result = await pool.query(
    `SELECT
       comment_id,
       annotation_id,
       user_id,
       comment,
       created_at
     FROM annotation_comments
     WHERE annotation_id = $1
     ORDER BY created_at ASC`,
    [annotationId]
  );

  return result.rows;
};