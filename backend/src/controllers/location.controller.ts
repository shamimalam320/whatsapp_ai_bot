import { Request, Response } from 'express';
import axios from 'axios';
import { getRedisClient } from '../utils/redis';

// NOTE: `getRedisClient()` is intentionally called inside the request handler
// so the Redis client is initialized lazily. The Redis utility returns a
// resilient/no-op cache adapter when Redis is unavailable, allowing the
// location lookup to gracefully degrade without failing the application.
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
  } catch (err: any) {
    if (axios.isAxiosError(err)) {
      const upstreamStatus = err.response?.status;
      console.error(
        `Pincode lookup failed for ${pincode}. Upstream status: ${upstreamStatus ?? 'N/A'}.`,
        err.message
      );
      if (upstreamStatus && upstreamStatus >= 500) {
        return res
          .status(502)
          .json({
            success: false,
            message: 'Unable to fetch pincode details from external service. Please try again later.',
          });
      }
    } else {
      console.error(`Pincode lookup failed for ${pincode}.`, err);
    }

    return res
      .status(500)
      .json({
        success: false,
        message: 'Unable to fetch pincode details. Please try again later.',
      });
  }
}

export default { getPincode };
