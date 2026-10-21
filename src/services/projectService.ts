import pool from "../config/database";

// Automatically ensure the table exists on service load so getProjects never fails
const ensureCollaboratorTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS project_collaborators (
        id SERIAL PRIMARY KEY,
        project_id INT NOT NULL,
        user_email VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'editor',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(project_id, user_email)
      );
    `);
  } catch (err) {
    console.warn("Could not auto-create project_collaborators table:", err);
  }
};
ensureCollaboratorTable();

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
  await ensureCollaboratorTable();

  const result = await pool.query(
    `SELECT DISTINCT
        p.project_id,
        p.project_name,
        p.description,
        p.created_by,
        p.created_at,
        COALESCE(pm.role, pc.role, 'editor') AS role
     FROM projects p
     LEFT JOIN project_members pm
       ON pm.project_id = p.project_id AND pm.user_id = $1
     LEFT JOIN users u
       ON u.user_id = $1
     LEFT JOIN project_collaborators pc
       ON pc.project_id = p.project_id AND LOWER(pc.user_email) = LOWER(u.email)
     WHERE pm.user_id = $1 OR (u.email IS NOT NULL AND LOWER(pc.user_email) = LOWER(u.email))
     ORDER BY p.created_at DESC`,
    [userId]
  );

  return result.rows;
};

export const getProjectById = async (
  projectId: number,
  userId: number
) => {
  await ensureCollaboratorTable();

  const result = await pool.query(
    `SELECT
        p.project_id,
        p.project_name,
        p.description,
        p.created_by,
        p.created_at,
        COALESCE(pm.role, pc.role, 'editor') AS role
     FROM projects p
     LEFT JOIN project_members pm
       ON pm.project_id = p.project_id AND pm.user_id = $2
     LEFT JOIN users u
       ON u.user_id = $2
     LEFT JOIN project_collaborators pc
       ON pc.project_id = p.project_id AND LOWER(pc.user_email) = LOWER(u.email)
     WHERE p.project_id = $1
       AND (pm.user_id = $2 OR (u.email IS NOT NULL AND LOWER(pc.user_email) = LOWER(u.email)))`,
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
     ON CONFLICT (project_id, user_id)
     DO UPDATE SET role = EXCLUDED.role
     RETURNING project_member_id, project_id, user_id, role, joined_at`,
    [projectId, userId, role.toLowerCase()]
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
export const addProjectCollaborator = async (
  projectId: string | number,
  email: string,
  role: string
) => {
  await ensureCollaboratorTable();

  const cleanEmail = email.trim().toLowerCase();
  const cleanRole = role.toLowerCase();

  const query = `
    INSERT INTO project_collaborators (project_id, user_email, role)
    VALUES ($1, $2, $3)
    ON CONFLICT (project_id, user_email)
    DO UPDATE SET role = EXCLUDED.role
    RETURNING *;
  `;
  const result = await pool.query(query, [Number(projectId), cleanEmail, cleanRole]);

  // If Sana is already registered in users table, also add directly to project_members
  try {
    const userResult = await pool.query(
      `SELECT user_id FROM users WHERE LOWER(email) = $1`,
      [cleanEmail]
    );
    if (userResult.rows.length > 0) {
      const targetUserId = userResult.rows[0].user_id;
      await pool.query(
        `INSERT INTO project_members (project_id, user_id, role)
         VALUES ($1, $2, $3)
         ON CONFLICT (project_id, user_id)
         DO UPDATE SET role = EXCLUDED.role`,
        [Number(projectId), targetUserId, cleanRole]
      );
    }
  } catch (err) {
    console.warn("Could not sync project_members for user:", err);
  }

  return result.rows[0];
};

export const getProjectCollaborators = async (projectId: string | number) => {
  await ensureCollaboratorTable();

  const query = `
    SELECT user_email AS email, role, created_at 
    FROM project_collaborators 
    WHERE project_id = $1;
  `;
  const result = await pool.query(query, [Number(projectId)]);
  return result.rows;
};
