import path from "path";
import multer from "multer";
import { fileTypeFromBuffer } from "file-type";

const storage = multer.memoryStorage();

const normalizeMimeType = (mimeType = "") => String(mimeType).split(";")[0].trim().toLowerCase();

export const allowedImageMimeTypes = new Set([
  "image/jpeg",
  "image/pjpeg",
  "image/png",
  "image/webp",
]);

export const allowedAudioMimeTypes = new Set([
  "audio/webm",
  "audio/mp3",
  "audio/mpeg",
  "audio/wav",
  "audio/x-wav",
  "audio/wave",
  "audio/ogg",
  "audio/m4a",
  "audio/mp4",
  "audio/x-m4a",
  "audio/aac",
  "video/webm",
]);

export const allowedMimeTypesSet = new Set([
  "image/jpeg",
  "image/pjpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  ...allowedAudioMimeTypes,
]);

const allowedExtensions = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".pdf",
  ".webm",
  ".mp3",
  ".wav",
  ".ogg",
  ".m4a",
  ".aac",
]);

const allowedMimeTypesByExtension = {
  ".png": ["image/png"],
  ".jpg": ["image/jpeg", "image/pjpeg"],
  ".jpeg": ["image/jpeg", "image/pjpeg"],
  ".webp": ["image/webp"],
  ".pdf": ["application/pdf"],
  ".webm": ["audio/webm", "video/webm"],
  ".mp3": ["audio/mp3", "audio/mpeg"],
  ".wav": ["audio/wav", "audio/x-wav", "audio/wave"],
  ".ogg": ["audio/ogg"],
  ".m4a": ["audio/m4a", "audio/mp4", "audio/x-m4a"],
  ".aac": ["audio/aac", "audio/mp4"],
};

const AUDIO_EXTENSIONS = new Set([".webm", ".mp3", ".wav", ".ogg", ".m4a", ".aac"]);

const getFileExtension = (filename = "") => path.extname(filename).toLowerCase();

const isAllowedAudioMime = (mimeType = "") => {
  const normalized = normalizeMimeType(mimeType);
  return allowedAudioMimeTypes.has(normalized) || normalized.startsWith("audio/");
};

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    const extension = getFileExtension(file.originalname);
    const normalizedMimeType = normalizeMimeType(file.mimetype);

    if (AUDIO_EXTENSIONS.has(extension) || isAllowedAudioMime(normalizedMimeType)) {
      cb(null, true);
      return;
    }

    if (!allowedExtensions.has(extension)) {
      cb(
        new Error(
          "Invalid file extension; only PNG, JPG, JPEG, WEBP, PDF, and audio files are allowed",
        ),
        false,
      );
      return;
    }

    const allowedMimeTypes = allowedMimeTypesByExtension[extension] || [];
    if (!normalizedMimeType || !allowedMimeTypes.includes(normalizedMimeType)) {
      cb(
        new Error(
          "Invalid file type; allowed types are image/jpeg, image/png, image/webp, application/pdf, and audio/*",
        ),
        false,
      );
      return;
    }

    cb(null, true);
  },
});

const validateFileSignature = async (file) => {
  const extension = getFileExtension(file.originalname);
  const declaredMime = normalizeMimeType(file.mimetype);
  const allowedMimeTypes = allowedMimeTypesByExtension[extension];

  if (AUDIO_EXTENSIONS.has(extension) || isAllowedAudioMime(declaredMime)) {
    const detectedFileType = await fileTypeFromBuffer(file.buffer);
    const detectedMimeType = normalizeMimeType(detectedFileType?.mime);
    const isAudioSignature =
      !detectedMimeType ||
      detectedMimeType.startsWith("audio/") ||
      detectedMimeType === "video/webm" ||
      (allowedMimeTypes || []).includes(detectedMimeType);

    if (!isAudioSignature) {
      return { ok: false, reason: "content" };
    }

    file.detectedMimeType = detectedMimeType || declaredMime || "audio/webm";
    return { ok: true };
  }

  if (!allowedMimeTypes) {
    return { ok: false, reason: "extension" };
  }

  const detectedFileType = await fileTypeFromBuffer(file.buffer);
  const detectedMimeType = normalizeMimeType(detectedFileType?.mime);

  const isValidSignature =
    (detectedMimeType && allowedMimeTypes.includes(detectedMimeType)) ||
    (extension === ".pdf" && declaredMime === "application/pdf");

  if (!isValidSignature) {
    return { ok: false, reason: "content" };
  }

  file.detectedMimeType = detectedMimeType || file.mimetype;
  return { ok: true };
};

export const verifyUploadedFileSignature = async (req, res, next) => {
  try {
    if (!req.file) {
      return next();
    }

    const result = await validateFileSignature(req.file);
    if (!result.ok) {
      return res.status(400).json({
        message:
          result.reason === "extension"
            ? "Invalid file extension; only PNG, JPG, JPEG, WEBP, PDF, and audio files are allowed"
            : "Invalid file content; uploaded file signature does not match allowed file types",
      });
    }

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
      const result = await validateFileSignature(file);
      if (!result.ok) {
        return res.status(400).json({
          message:
            result.reason === "extension"
              ? "Invalid file extension; only PNG, JPG, JPEG, WEBP, PDF, and audio files are allowed"
              : "Invalid file content; uploaded file signature does not match allowed file types",
        });
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

export default upload;
