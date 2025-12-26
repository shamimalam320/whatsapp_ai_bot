import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';

let replSet: MongoMemoryReplSet | null = null;

export const startInMemoryMongo = async () => {
  // Start a replica set so transactions are supported.
  // NOTE: For simplicity and faster test startup we default to a single-member
  // replica set (count = 1). This enables transactions for tests but does
  // NOT simulate true replica set behaviors like failover/election. For more
  // realistic testing, set the `TEST_REPLICA_SET_COUNT` environment variable
  // to `3` (or more) before running tests. Example (POSIX):
  //
  //   TEST_REPLICA_SET_COUNT=3 npm test
  //
  // On Windows PowerShell you can run:
  //
  //   $env:TEST_REPLICA_SET_COUNT=3; npm test
  //
  // Keep in mind that multi-member replica sets take longer to start and
  // consume more resources in CI/runners.
  const replCount = parseInt(process.env.TEST_REPLICA_SET_COUNT || '1', 10) || 1;
  replSet = await MongoMemoryReplSet.create({ replSet: { count: replCount } });
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
