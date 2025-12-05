import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongo: MongoMemoryServer | null = null;

export const startInMemoryMongo = async () => {
  mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri();
  process.env.MONGODB_URI = uri;
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
};

export const stopInMemoryMongo = async () => {
  try { await mongoose.disconnect(); } catch (e) {}
  try { if (mongo) await mongo.stop(); } catch (e) {}
};

export const clearDatabase = async () => {
  const collections = Object.keys(mongoose.connection.collections);
  for (const name of collections) {
    await mongoose.connection.collections[name].deleteMany({});
  }
};
