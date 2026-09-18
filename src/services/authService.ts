import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "../config/database";
import { JWT_SECRET } from "../config/env";

export const registerUser = async (
  name: string,
  email: string,
  password: string
) => {
  // Check whether email already exists
  const existingUser = await pool.query(
    "SELECT user_id FROM users WHERE email = $1",
    [email]
  );

  if (existingUser.rows.length > 0) {
    throw new Error("Email already registered");
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Insert user into database
  const result = await pool.query(
    `INSERT INTO users (name, email, password, role)
     VALUES ($1, $2, $3, $4)
     RETURNING user_id, name, email, role, created_at`,
    [name, email, hashedPassword, "user"]
  );

  return result.rows[0];
};

export const loginUser = async (
  email: string,
  password: string,
  storedPasswordHash: string
) => {
  const passwordMatches = await bcrypt.compare(
    password,
    storedPasswordHash
  );

  if (!passwordMatches) {
    throw new Error("Invalid email or password");
  }

  const token = jwt.sign(
    { email },
    JWT_SECRET as string,
    { expiresIn: "1h" }
  );

  return {
    email,
    token
  };
};