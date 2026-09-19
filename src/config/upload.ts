import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },

  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});

const allowedExtensions = [
  ".step",
  ".stp",
  ".iges",
  ".igs",
  ".stl",
  ".obj",
  ".gltf",
  ".glb",
  ".fbx",
  ".3mf"
];

const upload = multer({
  storage,

  limits: {
    fileSize: 250 * 1024 * 1024
  },

  fileFilter: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();

    if (allowedExtensions.includes(extension)) {
      cb(null, true);
    } else {
      cb(
        new Error("Only supported 3D model files are allowed")
      );
    }
  }
});

export default upload;