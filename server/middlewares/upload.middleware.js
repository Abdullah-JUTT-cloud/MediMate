import path from "path";
import multer from "multer";
import { fileTypeFromBuffer } from "file-type";

const storage = multer.memoryStorage();

const allowedExtensions = new Set([".png", ".jpg", ".jpeg", ".gif", ".pdf"]);
const allowedMimeTypesByExtension = {
  ".png": ["image/png"],
  ".jpg": ["image/jpeg"],
  ".jpeg": ["image/jpeg"],
  ".gif": ["image/gif"],
  ".pdf": ["application/pdf"],
};

const getFileExtension = (filename = "") => path.extname(filename).toLowerCase();

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const extension = getFileExtension(file.originalname);

    if (!allowedExtensions.has(extension)) {
      cb(new Error("Invalid file extension; only PNG, JPG, JPEG, GIF, and PDF files are allowed"), false);
      return;
    }

    const allowedMimeTypes = allowedMimeTypesByExtension[extension] || [];
    if (!file.mimetype || !allowedMimeTypes.includes(file.mimetype)) {
      cb(new Error("Invalid file type; the file extension and MIME type do not match an allowed upload type"), false);
      return;
    }

    cb(null, true);
  },
});

export const verifyUploadedFileSignature = async (req, res, next) => {
  try {
    if (!req.file) {
      return next();
    }

    const extension = getFileExtension(req.file.originalname);
    const allowedMimeTypes = allowedMimeTypesByExtension[extension];

    if (!allowedMimeTypes) {
      return res.status(400).json({
        message: "Invalid file extension; only PNG, JPG, JPEG, GIF, and PDF files are allowed",
      });
    }

    const detectedFileType = await fileTypeFromBuffer(req.file.buffer);
    if (!detectedFileType || !allowedMimeTypes.includes(detectedFileType.mime)) {
      return res.status(400).json({
        message: "Invalid file content; uploaded file signature does not match the allowed file type",
      });
    }

    req.file.detectedMimeType = detectedFileType.mime;
    next();
  } catch (error) {
    next(error);
  }
};

export const allowedImageMimeTypes = new Set(["image/jpeg", "image/png", "image/gif"]);

export default upload;