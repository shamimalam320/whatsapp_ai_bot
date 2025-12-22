import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';

let replSet: MongoMemoryReplSet | null = null;

export const startInMemoryMongo = async () => {
  // Start a replica set so transactions are supported
  replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  const uri = replSet.getUri();
  process.env.MONGODB_URI = uri;
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 30000 });
};

export const stopInMemoryMongo = async () => {
  try { await mongoose.disconnect(); } catch (e) {}
  try { if (replSet) await replSet.stop(); } catch (e) {}
};

export const clearDatabase = async () => {
  const collections = Object.keys(mongoose.connection.collections);
  for (const name of collections) {
    await mongoose.connection.collections[name].deleteMany({});
  }
};
