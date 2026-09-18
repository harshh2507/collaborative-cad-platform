import { Request, Response } from "express";
import {
  registerUser,
  loginUser
} from "../services/authService";
import pool from "../config/database";

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required"
      });
    }

    const user = await registerUser(name, email, password);

    return res.status(201).json({
      message: "Registration successful",
      user: {
        id: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error("Registration error:", error);

    if (error instanceof Error && error.message === "Email already registered") {
      return res.status(409).json({
        message: "Email already registered"
      });
    }

    return res.status(500).json({
      message: "Internal server error"
    });
  }
};
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required"
      });
    }

    const result = await pool.query(
      "SELECT user_id, name, email, password, role FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    const user = result.rows[0];

    const loginResult = await loginUser(
      user.email,
      password,
      user.password
    );

    return res.status(200).json({
      message: "Login successful",
      user: {
        id: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      token: loginResult.token
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      message: "Internal server error"
    });
  }
};