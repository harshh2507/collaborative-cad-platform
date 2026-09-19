import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/env";
import { AuthenticatedUser } from "../types/auth";

export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      message: "Access token is required"
    });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      message: "Invalid authorization header"
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET as string);

    (req as Request & { user: AuthenticatedUser }).user =
  decoded as AuthenticatedUser;

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token"
    });
  }
};