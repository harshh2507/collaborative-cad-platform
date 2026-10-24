import pool from "../config/database";

export const createProject = async (
  projectName: string,
  description: string,
  createdBy: number
) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const projectResult = await client.query(
      `INSERT INTO projects (project_name, description, created_by)
       VALUES ($1, $2, $3)
       RETURNING project_id, project_name, description, created_by, created_at`,
      [projectName, description, createdBy]
    );

    const project = projectResult.rows[0];

    await client.query(
      `INSERT INTO project_members (project_id, user_id, role)
       VALUES ($1, $2, $3)`,
      [project.project_id, createdBy, "owner"]
    );

    await client.query("COMMIT");

    return project;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const getProjects = async (userId: number) => {
  const result = await pool.query(
    `SELECT
        p.project_id,
        p.project_name,
        p.description,
        p.created_by,
        p.created_at,
        pm.role
     FROM projects p
     JOIN project_members pm
       ON pm.project_id = p.project_id
     WHERE pm.user_id = $1
     ORDER BY p.created_at DESC`,
    [userId]
  );

  return result.rows;
};

export const getProjectById = async (
  projectId: number,
  userId: number
) => {
  const result = await pool.query(
    `SELECT
        p.project_id,
        p.project_name,
        p.description,
        p.created_by,
        p.created_at,
        pm.role
     FROM projects p
     JOIN project_members pm
       ON pm.project_id = p.project_id
     WHERE p.project_id = $1
       AND pm.user_id = $2`,
    [projectId, userId]
  );

  return result.rows[0] || null;
};
export const addProjectMember = async (
  projectId: number,
  userId: number,
  role: string
) => {
  const result = await pool.query(
    `INSERT INTO project_members (project_id, user_id, role)
     VALUES ($1, $2, $3)
     RETURNING project_member_id, project_id, user_id, role, joined_at`,
    [projectId, userId, role]
  );

  return result.rows[0];
};
export const getProjectMemberRole = async (
  projectId: number,
  userId: number
) => {
  const result = await pool.query(
    `SELECT role
     FROM project_members
     WHERE project_id = $1
       AND user_id = $2`,
    [projectId, userId]
  );

  return result.rows[0]?.role || null;
};
export const getCadModelProject = async (
  modelId: number
) => {
  const result = await pool.query(
    `SELECT project_id
     FROM cad_models
     WHERE model_id = $1`,
    [modelId]
  );

  return result.rows[0] || null;
};
export const hasProjectRole = (
  userRole: string,
  allowedRoles: string[]
) => {
  return allowedRoles.includes(userRole);
};
export const isUserProjectMember = async (
  projectId: number,
  userId: number
) => {
  const result = await pool.query(
    `SELECT project_member_id
     FROM project_members
     WHERE project_id = $1
       AND user_id = $2`,
    [projectId, userId]
  );

  return result.rows.length > 0;
};

export const deleteProject = async (
  projectId: number,
  userId: number
): Promise<"deleted" | "not_found" | "forbidden"> => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Lock the project row and verify the user's membership.
    const projectResult = await client.query(
      `SELECT p.project_id, pm.role
       FROM projects p
       JOIN project_members pm
         ON pm.project_id = p.project_id
       WHERE p.project_id = $1
         AND pm.user_id = $2
       FOR UPDATE OF p`,
      [projectId, userId]
    );

    if (projectResult.rows.length === 0) {
      const existsResult = await client.query(
        "SELECT project_id FROM projects WHERE project_id = $1",
        [projectId]
      );

      await client.query("ROLLBACK");
      return existsResult.rows.length ? "forbidden" : "not_found";
    }

    if (projectResult.rows[0].role !== "owner") {
      await client.query("ROLLBACK");
      return "forbidden";
    }

    // Delete dependent records in foreign-key-safe order.
    await client.query(
      `DELETE FROM tasks
       WHERE annotation_id IN (
         SELECT a.annotation_id
         FROM annotations a
         JOIN model_version mv ON mv.version_id = a.version_id
         JOIN cad_models cm ON cm.model_id = mv.model_id
         WHERE cm.project_id = $1
       )`,
      [projectId]
    );

    await client.query(
      `DELETE FROM annotations
       WHERE version_id IN (
         SELECT mv.version_id
         FROM model_version mv
         JOIN cad_models cm ON cm.model_id = mv.model_id
         WHERE cm.project_id = $1
       )`,
      [projectId]
    );

    await client.query(
      `DELETE FROM model_version
       WHERE model_id IN (
         SELECT model_id FROM cad_models WHERE project_id = $1
       )`,
      [projectId]
    );

    await client.query(
      "DELETE FROM cad_models WHERE project_id = $1",
      [projectId]
    );

    await client.query(
      "DELETE FROM projects WHERE project_id = $1",
      [projectId]
    );

    await client.query("COMMIT");
    return "deleted";
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};
