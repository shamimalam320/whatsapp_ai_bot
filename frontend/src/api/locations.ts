// Pincode lookup helper for India Post API
import axios from 'axios';

export type PincodeApiResponse = {
  success: boolean;
  data?: {
    pincode: string;
    states: string[];
    districts: string[];
    postOffices: { name: string; branchType?: string }[];
  };
  message?: string;
};

export async function getPincodeDetails(pincode: string): Promise<PincodeApiResponse | null> {
  try {
    const res = await axios.get(`/api/locations/pincode/${pincode}`);
    return res.data as PincodeApiResponse;
  } catch (err) {
    return null;
  }
}
