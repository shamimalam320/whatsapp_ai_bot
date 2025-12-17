#!/usr/bin/env node
/**
 * Clean invalid image strings from products in MongoDB.
 * Keeps only values that look like actual image files or URLs.
 * 
 * Usage (from backend folder):
 *   MONGODB_URI="mongodb://..." node scripts/clean-products-images.js
 * 
 * This script will:
 * - Connect to MongoDB
 * - Find all products
 * - Remove any image entry that doesn't look like a valid image path/URL
 * - Save updated documents
 * - Report counts
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

async function run() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('❌ Please set MONGODB_URI environment variable');
    process.exit(1);
  }

  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected');

    const db = mongoose.connection.db;
    const productsCollection = db.collection('products');

    // Helper to check if a string looks like an image path/URL
    const isValidImageRef = (s) => {
      if (!s || typeof s !== 'string') return false;
      const trimmed = s.trim();
      if (!trimmed) return false;
      // absolute URL
      if (/^https?:\/\//i.test(trimmed)) return true;
      // relative /uploads path
      if (/^\/uploads\/|^uploads\//i.test(trimmed)) return true;
      // filename with image extension
      if (/\.(jpg|jpeg|png|gif|bmp|webp|svg)(\?.*)?$/i.test(trimmed)) return true;
      return false;
    };

    console.log('\n🔍 Scanning products...');
    const allProducts = await productsCollection.find({}).toArray();
    console.log(`Found ${allProducts.length} products`);

    let updatedCount = 0;
    let totalInvalidRemoved = 0;

    for (const product of allProducts) {
      if (!Array.isArray(product.images) || product.images.length === 0) {
        continue;
      }

      const original = [...product.images];
      const cleaned = original.filter(img => isValidImageRef(img));

      // Log all products with images for debugging
      if (original.length > 0) {
        console.log(`  🔍 Product: ${product.name} (${product._id})`);
        console.log(`     Images: ${JSON.stringify(original)}`);
        console.log(`     Valid: ${original.map(i => isValidImageRef(i) ? '✓' : '✗').join(' ')}`);
      }

      if (cleaned.length < original.length) {
        const removed = original.length - cleaned.length;
        console.log(`  ⚠️  WILL UPDATE - Removing ${removed} invalid entries`);
        console.log(`     Before: ${JSON.stringify(original)}`);
        console.log(`     After:  ${JSON.stringify(cleaned)}`);

        // Update the product
        await productsCollection.updateOne(
          { _id: product._id },
          { $set: { images: cleaned } }
        );

        updatedCount++;
        totalInvalidRemoved += removed;
      }
    }

    console.log(`\n✅ Cleanup complete!`);
    console.log(`   Products updated: ${updatedCount}`);
    console.log(`   Invalid entries removed: ${totalInvalidRemoved}`);

    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

run();
