import multer from 'multer';
import { ApiError } from './error.middleware.js';

// Setup file filters for image uploads
const imageFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new ApiError(400, 'Invalid file type: Please upload an image.'), false);
  }
};

const storage = multer.memoryStorage();

export const uploadImage = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: imageFilter
});

export default uploadImage;
