import multer from "multer";
import fs from "fs";
import path from "path";

const uploadsDirectory = path.resolve(process.cwd(), "uploads");
const allowedExtensions = [".step", ".stp", ".iges", ".igs", ".stl", ".obj", ".gltf", ".glb", ".fbx", ".ply", ".3mf"];

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    try {
      fs.mkdirSync(uploadsDirectory, { recursive: true });
      cb(null, uploadsDirectory);
    } catch (error) {
      cb(error as Error, uploadsDirectory);
    }
  },
  filename: (_req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const baseName = path.basename(file.originalname, path.extname(file.originalname))
      .replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 100) || "model";
    cb(null, `${baseName}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${extension}`);
  },
});

const versionUpload = multer({
  storage,
  limits: { fileSize: 250 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    if (allowedExtensions.includes(extension)) cb(null, true);
    else cb(new Error("Unsupported 3D model format. Use GLB, GLTF, OBJ, FBX, STL, PLY, STEP, IGES or 3MF."));
  },
});

export default versionUpload;
