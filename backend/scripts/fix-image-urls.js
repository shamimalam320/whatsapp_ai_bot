#!/usr/bin/env node
/**
 * One-off script to normalise product.image URLs saved in the database.
 *
 * Usage:
 *   BACKEND_URL=http://localhost:5000 MONGODB_URI="..." node scripts/fix-image-urls.js
 *
 * The script will convert absolute URLs that point to /uploads/* to either
 * - an absolute URL using BACKEND_URL if set, or
 * - a relative path ("/uploads/...") if BACKEND_URL is not set.
 */

const mongoose = require('mongoose');
const Product = require('../dist/models/Product').default || require('../src/models/Product').default;
const connectDB = require('../dist/config/database').default || require('../src/config/database').default;

async function run() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('Please provide MONGODB_URI env var');
    process.exit(2);
  }

  // Use existing database connection util if present
  try {
    await connectDB();
  } catch (err) {
    // fallback to mongoose connect
    await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
  }

  const backendUrl = process.env.BACKEND_URL ? process.env.BACKEND_URL.replace(/\/$/, '') : null;
  const dry = !!process.env.DRY_RUN;

  const products = await Product.find({});
  console.log(`Found ${products.length} products. Scanning images...`);

  let updatedCount = 0;
  const removeInvalid = !!process.env.CLEAN_INVALID;

  for (const p of products) {
    let changed = false;
    const images = (p.images || []).map((img) => {
      if (!img) return img;
      try {
        if (img.startsWith('http://') || img.startsWith('https://')) {
          const u = new URL(img);
          if (u.pathname.startsWith('/uploads')) {
            changed = true;
            return backendUrl ? `${backendUrl}${u.pathname}` : u.pathname;
          }
          return img;
        }
      } catch (e) {
        // not a URL
      }
      return img;
    });

    // Optionally remove anything which doesn't look like an image / uploads path
    const isImageLike = (s) => {
      if (!s || typeof s !== 'string') return false;
      if (/^https?:\/\//i.test(s)) return true;
      if (/^\/uploads|^uploads\//i.test(s)) return true;
      if (/\.(jpg|jpeg|png|gif|bmp|webp|svg)(\?.*)?$/i.test(s)) return true;
      return false;
    };

    const finalImages = images.filter((s) => {
      if (isImageLike(s)) return true;
      if (removeInvalid) {
        changed = true;
        return false; // drop invalid
      }
      return true; // keep invalid unless cleanup requested
    });

    if (changed) {
      console.log(`Will update ${p._id} - new images: ${JSON.stringify(images)}`);
      if (!dry) {
        p.images = finalImages;
        await p.save();
        updatedCount++;
        console.log(`Updated product ${p._id}`);
      }
    }
  }

  console.log(dry ? `Dry run complete. ${updatedCount} products would be updated.` : `Completed. Updated ${updatedCount} products.`);
  process.exit(0);
}

run().catch((err) => {
  console.error('Error running script', err);
  process.exit(1);
});
