import path from "path";
import multer from "multer";
import { fileTypeFromBuffer } from "file-type";

const storage = multer.memoryStorage();

const normalizeMimeType = (mimeType = "") => String(mimeType).split(";")[0].trim().toLowerCase();

const allowedExtensions = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp", ".pdf", ".webm", ".ogg", ".mp3", ".wav", ".m4a", ".aac"]);
const allowedMimeTypesByExtension = {
  ".png": ["image/png"],
  ".jpg": ["image/jpeg", "image/pjpeg"],
  ".jpeg": ["image/jpeg", "image/pjpeg"],
  ".gif": ["image/gif"],
  ".webp": ["image/webp"],
  ".pdf": ["application/pdf"],
  ".webm": ["audio/webm", "video/webm"],
  ".ogg": ["audio/ogg", "application/ogg", "audio/opus"],
  ".mp3": ["audio/mpeg", "audio/mp3"],
  ".wav": ["audio/wav", "audio/x-wav", "audio/vnd.wave"],
  ".m4a": ["audio/mp4", "audio/x-m4a", "video/mp4"],
  ".aac": ["audio/aac", "audio/x-aac"],
};

const getFileExtension = (filename = "") => path.extname(filename).toLowerCase();

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const extension = getFileExtension(file.originalname);

    if (!allowedExtensions.has(extension)) {
      cb(new Error("Invalid file extension; only PNG, JPG, JPEG, GIF, WEBP, PDF, WEBM, OGG, MP3, WAV, M4A, and AAC files are allowed"), false);
      return;
    }

    const allowedMimeTypes = allowedMimeTypesByExtension[extension] || [];
    const normalizedMimeType = normalizeMimeType(file.mimetype);
    if (!normalizedMimeType || !allowedMimeTypes.includes(normalizedMimeType)) {
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
        message: "Invalid file extension; only PNG, JPG, JPEG, GIF, WEBP, PDF, WEBM, OGG, MP3, WAV, M4A, and AAC files are allowed",
      });
    }

    const detectedFileType = await fileTypeFromBuffer(req.file.buffer);
    const detectedMimeType = normalizeMimeType(detectedFileType?.mime);
    if (!detectedMimeType || !allowedMimeTypes.includes(detectedMimeType)) {
      return res.status(400).json({
        message: "Invalid file content; uploaded file signature does not match the allowed file type",
      });
    }

    req.file.detectedMimeType = detectedMimeType;
    next();
  } catch (error) {
    next(error);
  }
};

export const verifyUploadedFilesSignature = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return next();
    }

    for (const file of req.files) {
      const extension = getFileExtension(file.originalname);
      const allowedMimeTypes = allowedMimeTypesByExtension[extension];

      if (!allowedMimeTypes) {
        return res.status(400).json({
          message: "Invalid file extension; only PNG, JPG, JPEG, GIF, WEBP, PDF, WEBM, OGG, MP3, WAV, M4A, and AAC files are allowed",
        });
      }

      const detectedFileType = await fileTypeFromBuffer(file.buffer);
      const detectedMimeType = normalizeMimeType(detectedFileType?.mime);
      if (!detectedMimeType || !allowedMimeTypes.includes(detectedMimeType)) {
        return res.status(400).json({
          message: "Invalid file content; uploaded file signature does not match the allowed file type",
        });
      }

      file.detectedMimeType = detectedMimeType;
    }

    next();
  } catch (error) {
    next(error);
  }
};

export const allowedImageMimeTypes = new Set(["image/jpeg", "image/pjpeg", "image/png", "image/gif", "image/webp"]);

export default upload;
