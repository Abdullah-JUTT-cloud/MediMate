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

export const allowedMimeTypesSet = new Set([
  "image/jpeg",
  "image/pjpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

const allowedExtensions = new Set([".png", ".jpg", ".jpeg", ".webp", ".pdf"]);
const allowedMimeTypesByExtension = {
  ".png": ["image/png"],
  ".jpg": ["image/jpeg", "image/pjpeg"],
  ".jpeg": ["image/jpeg", "image/pjpeg"],
  ".webp": ["image/webp"],
  ".pdf": ["application/pdf"],
};

const getFileExtension = (filename = "") => path.extname(filename).toLowerCase();

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    const extension = getFileExtension(file.originalname);

    if (!allowedExtensions.has(extension)) {
      cb(
        new Error("Invalid file extension; only PNG, JPG, JPEG, WEBP, and PDF files are allowed"),
        false
      );
      return;
    }

    const allowedMimeTypes = allowedMimeTypesByExtension[extension] || [];
    const normalizedMimeType = normalizeMimeType(file.mimetype);
    if (!normalizedMimeType || !allowedMimeTypes.includes(normalizedMimeType)) {
      cb(
        new Error(
          "Invalid file type; allowed types are image/jpeg, image/png, image/webp, application/pdf"
        ),
        false
      );
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
        message: "Invalid file extension; only PNG, JPG, JPEG, WEBP, and PDF files are allowed",
      });
    }

    const detectedFileType = await fileTypeFromBuffer(req.file.buffer);
    const detectedMimeType = normalizeMimeType(detectedFileType?.mime);

    // Fallback for PDFs if fileTypeFromBuffer fails on certain valid PDFs or signatures
    const isValidSignature =
      (detectedMimeType && allowedMimeTypes.includes(detectedMimeType)) ||
      (extension === ".pdf" && normalizeMimeType(req.file.mimetype) === "application/pdf");

    if (!isValidSignature) {
      return res.status(400).json({
        message: "Invalid file content; uploaded file signature does not match allowed file types",
      });
    }

    req.file.detectedMimeType = detectedMimeType || req.file.mimetype;
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
          message: "Invalid file extension; only PNG, JPG, JPEG, WEBP, and PDF files are allowed",
        });
      }

      const detectedFileType = await fileTypeFromBuffer(file.buffer);
      const detectedMimeType = normalizeMimeType(detectedFileType?.mime);

      const isValidSignature =
        (detectedMimeType && allowedMimeTypes.includes(detectedMimeType)) ||
        (extension === ".pdf" && normalizeMimeType(file.mimetype) === "application/pdf");

      if (!isValidSignature) {
        return res.status(400).json({
          message: "Invalid file content; uploaded file signature does not match allowed file types",
        });
      }

      file.detectedMimeType = detectedMimeType || file.mimetype;
    }

    next();
  } catch (error) {
    next(error);
  }
};

export default upload;
