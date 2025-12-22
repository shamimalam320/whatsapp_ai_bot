import { Request, Response } from 'express';
import axios from 'axios';
import { getRedisClient } from '../utils/redis';

// NOTE: Calling `getRedisClient()` at module load time means the Redis
// client is created when the module is imported. If Redis is unavailable
// during application startup this can throw and prevent the whole app
// from starting. Consider lazy initialization (e.g., call `getRedisClient()`
// inside the request handler on first use), or make `getRedisClient()`
// return a resilient/no-op cache adapter when Redis is unavailable so
// the location lookup can gracefully degrade without failing the app.

export async function getPincode(req: Request, res: Response) {
  const { pincode } = req.params;
  if (!/^[0-9]{6}$/.test(pincode)) {
    return res.status(400).json({ success: false, message: 'Invalid pincode' });
  }

  try {
    // Lazy-get redis client so we don't attempt connections at import time
    const redis = getRedisClient();
    const cacheKey = `pincode:${pincode}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      // If already in the new envelope shape, return as-is
      if (parsed && typeof parsed.success !== 'undefined') {
        return res.json(parsed);
      }

      // Backwards-compatibility: older cached shape may be { pincode, state, city, locality }
      if (parsed && parsed.pincode) {
        const transformed = {
          success: true,
          data: {
            pincode: parsed.pincode,
            states: parsed.state ? [parsed.state] : [],
            districts: parsed.city ? [parsed.city] : [],
            postOffices: parsed.locality ? [{ name: parsed.locality }] : [],
          },
        };
        // overwrite cache with new envelope
        await redis.set(cacheKey, JSON.stringify(transformed), 'EX', 60 * 60 * 24 * 7);
        return res.json(transformed);
      }

      return res.json(parsed);
    }

    const resp = await axios.get(`https://api.postalpincode.in/pincode/${pincode}`);
    const data = resp.data && Array.isArray(resp.data) ? resp.data[0] : null;
    if (!data || data.Status !== 'Success' || !data.PostOffice || data.PostOffice.length === 0) {
      return res.status(404).json({ success: false, message: 'Pincode not found' });
    }

    const postOffices = data.PostOffice;

    const states = Array.from(new Set(postOffices.map((o: any) => o.State).filter(Boolean)));
    const districts = Array.from(new Set(postOffices.map((o: any) => o.District || o.Region).filter(Boolean)));

    const result = {
      pincode,
      states,
      districts,
      postOffices: postOffices.map((o: any) => ({ name: o.Name, branchType: o.BranchType || '' })),
    };

    // Cache for 7 days (store the envelope so subsequent reads are consistent)
    const envelope = { success: true, data: result };
    await redis.set(cacheKey, JSON.stringify(envelope), 'EX', 60 * 60 * 24 * 7);

    return res.json(envelope);
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Lookup failed' });
  }
}

export default { getPincode };
