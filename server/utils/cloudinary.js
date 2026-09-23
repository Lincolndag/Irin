const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path'); // <-- MISSING in the original file!
require('dotenv').config({ path: path.resolve(__dirname, '../config.env') });

// ^^^ THE ISSUE: The original code is missing `const path = require('path')` before using `path.resolve`. 
// This would cause a ReferenceError because `path` is not defined.
// The fix is to add: `const path = require('path');` before calling `require('dotenv').config({...})`

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function getTourImages() {
  const result = await cloudinary.search
    .expression("folder:nigeria-tours/*")
    .max_results(500)
    .execute();

  const images = result.resources.map(img => ({
    public_id: img.public_id,
    folder: img.asset_folder,
    url: img.secure_url
  }));

  console.log(JSON.stringify(images, null, 2));
}

getTourImages();