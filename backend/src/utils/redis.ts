import Redis from 'ioredis';

let client: Redis | null = null;

export function getRedisClient() {
  if (!client) {
    const redisUrl = process.env.REDIS_URL;
    if (redisUrl) {
      client = new Redis(redisUrl);
    } else {
      client = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD || undefined,
      });
    }
  }
  return client;
}

// Export the factory as default too (returns a singleton Redis client)
export default getRedisClient;
