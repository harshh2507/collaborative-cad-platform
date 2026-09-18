import pool from "../config/database";

export const createCadModel = async (
  projectId: number,
  modelName: string,
  filePath: string,
  uploadedBy: number
) => {
  const result = await pool.query(
    `INSERT INTO cad_models
     (project_id, file_name, file_path, uploaded_by)
     VALUES ($1, $2, $3, $4)
     RETURNING
       model_id,
       project_id,
       file_name,
       file_path,
       uploaded_by,
       created_at`,
    [
      projectId,
      modelName,
      filePath,
      uploadedBy
    ]
  );

  return result.rows[0];
};
export const getCadModels = async (
  projectId: number
) => {
  const result = await pool.query(
    `SELECT
       model_id,
       project_id,
       file_name,
       file_path,
       uploaded_by,
       created_at
     FROM cad_models
     WHERE project_id = $1
     ORDER BY created_at DESC`,
    [projectId]
  );

  return result.rows;
};