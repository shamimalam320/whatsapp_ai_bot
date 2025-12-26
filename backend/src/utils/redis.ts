import Redis from 'ioredis';
import { logger } from './logger';

let rawClient: Redis | null = null;
let clientWrapper: any = null;
let _noopWarned = false;

// A no-op adapter used when Redis is unavailable. Methods return safe defaults.
function warnNoopOnce() {
  if (!_noopWarned) {
    logger.warn('Redis noop adapter in use; caching is disabled or unavailable');
    _noopWarned = true;
  }
}

const noopAdapter = {
  isNoop: true,
  async get(_key: string) { warnNoopOnce(); return null; },
  async set(_key: string, _value: string, ..._args: any[]) { warnNoopOnce(); return null; },
  async del(_key: string) { warnNoopOnce(); return 0; },
  on(_evt: string, _handler: (...args: any[]) => void) { /* no-op */ },
  quit: async () => { /* no-op */ },
  disconnect: () => { /* no-op */ },
};

function makeWrapper(c: Redis) {
  return {
    isNoop: false,
    async get(key: string) {
      try { return await c.get(key); } catch (err: any) { logger.warn('Redis GET error: %s', err?.message || err); return null; }
    },
    async set(key: string, value: string, ...args: any[]) {
      try { return await c.set(key, value, ...args); } catch (err: any) { logger.warn('Redis SET error: %s', err?.message || err); return null; }
    },
    async del(key: string) {
      try { return await c.del(key); } catch (err: any) { logger.warn('Redis DEL error: %s', err?.message || err); return 0; }
    },
    on(evt: string, handler: (...args: any[]) => void) { return c.on(evt, handler); },
    quit: async () => { try { await c.quit(); } catch (e) { /* ignore */ } },
    disconnect: () => { try { c.disconnect(); } catch (e) { /* ignore */ } },
  };
}

/**
 * Returns true if the configured Redis client is the noop adapter (i.e. caching disabled)
 */
export function isRedisNoop() {
  if (clientWrapper && typeof clientWrapper.isNoop !== 'undefined') return !!clientWrapper.isNoop;
  // If client is not initialized yet, return false (unknown) — caller can call getRedisClient() first.
  return false;
}

export function getRedisClient(): any {
  if (clientWrapper) return clientWrapper;

  try {
    const redisUrl = process.env.REDIS_URL;
    // Use lazyConnect so the constructor doesn't attempt a synchronous
    // connection (which could throw). We start connect() in the
    // background and fall back to the noop adapter if the initial
    // connection attempt fails quickly.
    const clientOptions = { lazyConnect: true, connectTimeout: 5000 } as any;
    if (redisUrl) {
      rawClient = new Redis(redisUrl, clientOptions);
    } else {
      rawClient = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD || undefined,
        ...clientOptions,
      });
    }

    // Only attach handlers if rawClient was successfully created
    if (rawClient) {
      // Attach handlers so transient errors are logged but don't crash the app
      rawClient.on('error', (err) => {
        logger.warn('Redis client error: %s', err?.message || err);
      });
      rawClient.on('connect', () => {
        logger.info('Redis client connected');
      });

      // Try to connect now, but don't block initialization. If connect fails
      // we switch to the noop adapter so the app can continue operating.
      rawClient.connect().catch((err: any) => {
        logger.warn('Initial Redis connection failed, using no-op adapter: %s', err?.message || err);
        try { rawClient?.disconnect(); } catch (e) {}
        clientWrapper = noopAdapter;
      });
    } else {
      // If rawClient creation failed (unlikely with lazyConnect), use noop
      clientWrapper = noopAdapter;
      return clientWrapper;
    }

    // Set wrapper to the actual client. If connection fails later, the catch
    // block above will replace it with noopAdapter. This ensures consistency:
    // all callers before the failure get the real wrapper, and all after get noop.
    clientWrapper = makeWrapper(rawClient);
    return clientWrapper;
  } catch (err: any) {
    logger.warn('Failed to initialize Redis client, using no-op adapter: %s', err?.message || err);
    clientWrapper = noopAdapter;
    return clientWrapper;
  }
}

// Export the factory as default too (returns a singleton Redis client)
export default getRedisClient;
