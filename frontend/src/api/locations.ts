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

export async function getPincodeDetails(pincode: string): Promise<PincodeApiResponse> {
  try {
    const res = await axios.get(`/api/locations/pincode/${pincode}`);
    return res.data as PincodeApiResponse;
  } catch (err) {
    let message = 'Failed to fetch pincode details.';
    if (axios.isAxiosError(err)) {
      if (err.response?.status === 404) {
        message = 'Pincode not found.';
      } else if (typeof err.message === 'string' && err.message.trim() !== '') {
        message = err.message;
      }
    } else if (err instanceof Error && err.message.trim() !== '') {
      message = err.message;
    }
    return {
      success: false,
      message,
    };
  }
}
