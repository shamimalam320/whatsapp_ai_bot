import { Router } from 'express';
import locationController from '../controllers/location.controller';

const router = Router();

// GET /api/locations/pincode/:pincode
router.get('/pincode/:pincode', locationController.getPincode);

export default router;
