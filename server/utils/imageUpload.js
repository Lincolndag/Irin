const fs = require('fs');
const path = require('path');
const multer = require('multer');
const sharp = require('sharp');
const slugify = require('slugify');

const AsyncHandler = require('./asyncHandler');
const AppError = require('./appError');

const publicImageDir = path.join(__dirname, '..', 'public', 'img');
const userImageDir = path.join(publicImageDir, 'users');
const tourImageDir = path.join(publicImageDir, 'tours');

[publicImageDir, userImageDir, tourImageDir].forEach(dir => {
  fs.mkdirSync(dir, { recursive: true });
});

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only image files.', 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});

const escapeHtml = value =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');

const sanitizeValue = value => {
  if (typeof value === 'string') return escapeHtml(value);
  if (Array.isArray(value)) return value.map(sanitizeValue);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [key, sanitizeValue(nestedValue)])
    );
  }
  return value;
};

exports.uploadUserPhoto = upload.single('photo');
exports.uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 }
]);

exports.resizeUserPhoto = AsyncHandler(async (req, res, next) => {
  if (!req.file) return next();

  if (req.body) req.body = sanitizeValue(req.body);

  const filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(path.join(userImageDir, filename));

  req.body.photo = `/img/users/${filename}`;
  next();
});

exports.resizeTourImages = AsyncHandler(async (req, res, next) => {
  const hasCover = req.files && req.files.imageCover && req.files.imageCover.length > 0;
  const hasImages = req.files && req.files.images && req.files.images.length > 0;

  if (!hasCover && !hasImages) return next();

  if (req.body) req.body = sanitizeValue(req.body);

  const slug = slugify(req.body.name || req.params.id || 'tour', {
    lower: true,
    strict: true
  }) || 'tour';
  const baseName = `tour-${slug}`;
  const timestamp = Date.now();

  if (hasCover) {
    const coverFilename = `${baseName}-${timestamp}-cover.jpeg`;

    await sharp(req.files.imageCover[0].buffer)
      .resize(2000, 1333)
      .toFormat('jpeg')
      .jpeg({ quality: 90 })
      .toFile(path.join(tourImageDir, coverFilename));

    req.body.imageCover = `/img/tours/${coverFilename}`;
  }

  if (hasImages) {
    const imageFilenames = await Promise.all(
      req.files.images.map(async (file, index) => {
        const imageFilename = `${baseName}-${timestamp}-${index + 1}.jpeg`;

        await sharp(file.buffer)
          .resize(2000, 1333)
          .toFormat('jpeg')
          .jpeg({ quality: 90 })
          .toFile(path.join(tourImageDir, imageFilename));

        return `/img/tours/${imageFilename}`;
      })
    );

    req.body.images = imageFilenames;
  }

  next();
});
