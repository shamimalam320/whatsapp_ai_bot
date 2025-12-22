import { fetchJson } from './index';

interface RegisterData {
  email: string;
  password: string;
  name: string;
  businessName: string;
  phone?: string;
}

interface LoginData {
  email: string;
  password: string;
}

interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    token: string;
    user: {
      id: string;
      email: string;
      name: string;
      phone?: string;
      business: {
        id: string;
        name: string;
      };
    };
  };
  errors?: Array<{ msg: string; param: string }>;
}

interface UserResponse {
  success: boolean;
  data?: {
    user: {
      id: string;
      email: string;
      name: string;
      phone?: string;
      business: any;
      lastLogin?: string;
    };
  };
  message?: string;
}

class AuthAPI {
  // headers are handled by fetchJson; remove unused helper

  async register(data: RegisterData): Promise<AuthResponse> {
    return fetchJson('/auth/register', { method: 'POST', body: JSON.stringify(data) });
  }

  async login(data: LoginData): Promise<AuthResponse> {
    return fetchJson('/auth/login', { method: 'POST', body: JSON.stringify(data) });
  }

  async getCurrentUser(): Promise<UserResponse> {
    return fetchJson('/auth/me');
  }

  saveToken(token: string): void {
    localStorage.setItem('token', token);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  removeToken(): void {
    localStorage.removeItem('token');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}

export const authAPI = new AuthAPI();
