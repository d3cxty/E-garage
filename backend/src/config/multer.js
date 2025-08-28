import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

const driver = process.env.STORAGE_DRIVER || 'local';

/* ------------------------- LOCAL DISK (fallback) ------------------------- */
function localUploader() {
  const root = path.resolve();
  const uploads = path.join(root, 'uploads');
  const folders = {
    photos: path.join(uploads, 'photos'),
    proformas: path.join(uploads, 'proformas'),
    logos: path.join(uploads, 'logos'),
  };
  Object.values(folders).forEach((d) => {
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  });

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const isImage = file.mimetype.startsWith('image/');
      if (req.baseUrl.includes('/account')) return cb(null, folders.logos);
      if (req.baseUrl.includes('/clients') && !isImage) return cb(null, folders.proformas);
      cb(null, folders.photos);
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`);
    },
  });

  return multer({ storage, limits: { fileSize: 25 * 1024 * 1024 } }); // 25MB
}

/* --------------------------- CLOUDINARY STORAGE -------------------------- */
function cloudinaryUploader() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  const storage = new CloudinaryStorage({
    cloudinary,
    params: (req, file) => {
      // pick folder by route + file type (same logic as local)
      const isImage = file.mimetype.startsWith('image/');
      let folder = 'photos';
      if (req.baseUrl.includes('/account')) folder = 'logos';
      else if (req.baseUrl.includes('/clients') && !isImage) folder = 'proformas';

      // Optional: restrict formats
      const allowedFormats = ['jpg', 'jpeg', 'png', 'webp', 'pdf'];

      return {
        folder,
        resource_type: 'auto', // handles images & pdfs
        allowed_formats: allowedFormats,
        // public_id defaults to random; you can customize:
        // public_id: `${Date.now()}_${Math.random().toString(36).slice(2)}`
        use_filename: true,
        unique_filename: true,
        overwrite: false,
      };
    },
  });

  return multer({ storage, limits: { fileSize: 25 * 1024 * 1024 } });
}

/* ------------------------------ EXPORT UPLOAD ---------------------------- */
export const upload = driver === 'cloudinary' ? cloudinaryUploader() : localUploader();
