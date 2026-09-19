import { Request, Response, NextFunction } from "express";
import multer from "multer";

export const handleUploadError = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        message: "File size must not exceed 250 MB"
      });
    }

    return res.status(400).json({
      message: error.message
    });
  }

  if (error instanceof Error) {
    return res.status(400).json({
      message: error.message
    });
  }

  next(error);
};