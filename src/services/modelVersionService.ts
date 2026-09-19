import pool from "../config/database";
import fs from "fs";
import path from "path";

export const createModelVersion = async (
  modelId: number,
  filePath: string,
  uploadedBy: number
) => {
  // Find the latest version number
  const latestVersionResult = await pool.query(
    `SELECT version_number
     FROM model_version
     WHERE model_id = $1
     ORDER BY version_number DESC
     LIMIT 1`,
    [modelId]
  );

  // Calculate the next version number
  const nextVersionNumber =
    latestVersionResult.rows.length === 0
      ? 1
      : latestVersionResult.rows[0].version_number + 1;

  // Get the uploaded file name
  const originalFileName = path.basename(filePath);

  const extension = path.extname(originalFileName);

  const baseName = path.basename(
    originalFileName,
    extension
  );

  // Create the versioned file name
  const versionedFileName =
    `${baseName}_v${nextVersionNumber}${extension}`;

  const versionedFilePath = path.join(
    path.dirname(filePath),
    versionedFileName
  );

  // Rename the uploaded file
  fs.renameSync(
    filePath,
    versionedFilePath
  );

  // Save the version in PostgreSQL
  const result = await pool.query(
    `INSERT INTO model_version
     (model_id, version_number, file_path, uploaded_by)
     VALUES ($1, $2, $3, $4)
     RETURNING
       version_id,
       model_id,
       version_number,
       file_path,
       uploaded_by,
       created_at`,
    [
      modelId,
      nextVersionNumber,
      versionedFilePath,
      uploadedBy
    ]
  );

  return result.rows[0];
};

export const getModelVersions = async (
  modelId: number
) => {
  const result = await pool.query(
    `SELECT
       version_id,
       model_id,
       version_number,
       file_path,
       uploaded_by,
       created_at
     FROM model_version
     WHERE model_id = $1
     ORDER BY version_number ASC`,
    [modelId]
  );

  return result.rows;
};
export const getModelVersionDetails = async (
  versionId: number
) => {
  const result = await pool.query(
    `SELECT
       mv.version_id,
       mv.model_id,
       cm.project_id
     FROM model_version mv
     JOIN cad_models cm
       ON cm.model_id = mv.model_id
     WHERE mv.version_id = $1`,
    [versionId]
  );

  return result.rows[0] || null;
};